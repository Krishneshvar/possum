package com.possum.ui.people;

import com.possum.application.people.UserService;
import com.possum.domain.model.User;
import com.possum.shared.dto.PagedResult;
import com.possum.shared.dto.UserFilter;
import com.possum.ui.common.controls.DataTableView;
import com.possum.ui.common.controls.FilterBar;
import com.possum.ui.common.controls.NotificationService;
import com.possum.ui.common.controls.PaginationBar;
import com.possum.ui.workspace.WorkspaceManager;
import javafx.application.Platform;
import javafx.collections.FXCollections;
import javafx.fxml.FXML;
import javafx.scene.control.Alert;
import javafx.scene.control.ButtonType;
import javafx.scene.control.TableColumn;
import javafx.beans.property.SimpleStringProperty;
import javafx.beans.property.SimpleObjectProperty;

import java.util.Map;

public class UsersController {
    
    @FXML private FilterBar filterBar;
    @FXML private DataTableView<User> usersTable;
    @FXML private PaginationBar paginationBar;
    @FXML private javafx.scene.control.Button addButton;
    
    private final UserService userService;
    private final WorkspaceManager workspaceManager;
    private String currentSearch = "";

    public UsersController(UserService userService, WorkspaceManager workspaceManager) {
        this.userService = userService;
        this.workspaceManager = workspaceManager;
    }

    @FXML
    public void initialize() {
        if (addButton != null) {
            com.possum.ui.common.UIPermissionUtil.requirePermission(addButton, com.possum.application.auth.Permissions.USERS_MANAGE);
        }
        setupTable();
        setupFilters();
        loadUsers();
    }

    private void setupTable() {
        TableColumn<User, String> nameCol = new TableColumn<>("Name");
        nameCol.setCellValueFactory(cellData -> new SimpleStringProperty(cellData.getValue().name()));
        
        TableColumn<User, String> usernameCol = new TableColumn<>("Username");
        usernameCol.setCellValueFactory(cellData -> new SimpleStringProperty(cellData.getValue().username()));
        
        TableColumn<User, String> statusCol = new TableColumn<>("Status");
        statusCol.setCellValueFactory(cellData -> {
            boolean active = cellData.getValue().active();
            return new SimpleStringProperty(active ? "Active" : "Inactive");
        });
        
        TableColumn<User, String> createdCol = new TableColumn<>("Created At");
        createdCol.setCellValueFactory(cellData -> new SimpleStringProperty(cellData.getValue().createdAt().toLocalDate().toString()));
        
        usersTable.getTableView().getColumns().addAll(nameCol, usernameCol, statusCol, createdCol);
        
        usersTable.addActionColumn("Actions", this::showActions);
    }

    private void setupFilters() {
        filterBar.setOnFilterChange(filters -> {
            currentSearch = (String) filters.get("search");
            loadUsers();
        });
        
        paginationBar.setOnPageChange((page, size) -> loadUsers());
    }

    private void loadUsers() {
        usersTable.setLoading(true);
        
        Platform.runLater(() -> {
            try {
                UserFilter filter = new UserFilter(
                    currentSearch == null || currentSearch.isEmpty() ? null : currentSearch,
                    paginationBar.getCurrentPage(),
                    paginationBar.getPageSize()
                );
                
                PagedResult<User> result = userService.getUsers(filter);
                
                usersTable.setItems(FXCollections.observableArrayList(result.items()));
                paginationBar.setTotalItems(result.totalCount());
                usersTable.setLoading(false);
            } catch (Exception e) {
                usersTable.setLoading(false);
                NotificationService.error("Failed to load users: " + e.getMessage());
            }
        });
    }

    @FXML
    private void handleRefresh() {
        loadUsers();
    }

    @FXML
    private void handleAdd() {
        workspaceManager.openDialog("Add Employee", "/fxml/people/user-form-view.fxml");
    }

    private void showActions(User user) {
        Alert alert = new Alert(Alert.AlertType.CONFIRMATION);
        alert.setTitle("Employee Actions");
        alert.setHeaderText(user.name() + " (" + user.username() + ")");
        alert.setContentText("Choose action:");
        
        ButtonType editBtn = new ButtonType("Edit");
        ButtonType rolesBtn = new ButtonType("Roles & Permissions");
        ButtonType deleteBtn = new ButtonType("Delete");
        ButtonType cancelBtn = ButtonType.CANCEL;
        
        java.util.List<javafx.scene.control.ButtonType> buttons = new java.util.ArrayList<>();
        if (com.possum.ui.common.UIPermissionUtil.hasPermission(com.possum.application.auth.Permissions.USERS_MANAGE)) {
            buttons.add(editBtn);
            buttons.add(rolesBtn);
            buttons.add(deleteBtn);
        }
        buttons.add(cancelBtn);

        alert.getButtonTypes().setAll(buttons);
        
        alert.showAndWait().ifPresent(type -> {
            if (type == editBtn) {
                workspaceManager.openDialog("Edit Employee: " + user.name(), "/fxml/people/user-form-view.fxml", Map.of("userId", user.id(), "mode", "edit"));
            } else if (type == rolesBtn) {
                workspaceManager.openWindow("Roles & Permissions: " + user.name(), "/fxml/people/user-roles-view.fxml", Map.of("userId", user.id()));
            } else if (type == deleteBtn) {
                handleDelete(user);
            }
        });
    }

    private void handleDelete(User user) {
        Alert confirm = new Alert(Alert.AlertType.CONFIRMATION);
        confirm.setTitle("Delete Employee");
        confirm.setHeaderText("Delete " + user.name() + "?");
        confirm.setContentText("This action cannot be undone.");
        
        confirm.showAndWait().ifPresent(response -> {
            if (response == ButtonType.OK) {
                try {
                    userService.deleteUser(user.id());
                    NotificationService.success("Employee deleted successfully");
                    loadUsers();
                } catch (Exception e) {
                    NotificationService.error("Failed to delete employee: " + e.getMessage());
                }
            }
        });
    }
}
