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
import javafx.scene.control.*;
import javafx.beans.property.SimpleStringProperty;
import javafx.beans.property.SimpleObjectProperty;
import com.possum.ui.common.dialogs.DialogStyler;

import java.util.Map;

public class UsersController {
    
    @FXML private FilterBar filterBar;
    @FXML private DataTableView<User> usersTable;
    @FXML private PaginationBar paginationBar;
    @FXML private javafx.scene.control.Button addButton;
    
    private final UserService userService;
    private final WorkspaceManager workspaceManager;
    private String currentSearch = "";
    private java.util.List<Boolean> currentActiveStatuses = null;

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
        statusCol.setCellValueFactory(cellData -> new SimpleStringProperty(cellData.getValue().active() ? "Active" : "Inactive"));
        statusCol.setSortable(false);
        statusCol.setCellFactory(col -> new javafx.scene.control.TableCell<>() {
            @Override
            protected void updateItem(String status, boolean empty) {
                super.updateItem(status, empty);
                if (empty || status == null) {
                    setGraphic(null);
                    setText(null);
                } else {
                    Label badge = new Label(status);
                    badge.getStyleClass().addAll("badge", "badge-status");
                    if ("Active".equalsIgnoreCase(status)) {
                        badge.getStyleClass().add("badge-success");
                    } else {
                        badge.getStyleClass().add("badge-neutral");
                    }
                    setGraphic(badge);
                    setText(null);
                }
            }
        });
        
        TableColumn<User, java.time.LocalDateTime> createdCol = new TableColumn<>("Created At");
        createdCol.setCellValueFactory(cellData -> new SimpleObjectProperty<>(cellData.getValue().createdAt()));
        createdCol.setCellFactory(col -> new javafx.scene.control.TableCell<>() {
            @Override
            protected void updateItem(java.time.LocalDateTime item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || item == null) {
                    setText(null);
                } else {
                    java.time.LocalDateTime localTime = com.possum.shared.util.TimeUtil.toLocal(item);
                    setText(localTime != null ? com.possum.shared.util.TimeUtil.formatStandard(localTime) : "");
                }
            }
        });
        
        usersTable.getTableView().getColumns().addAll(nameCol, usernameCol, statusCol, createdCol);
        
        usersTable.addMenuActionColumn("Actions", this::buildActionsMenu);
    }

    private void setupFilters() {
        filterBar.addMultiSelectFilter("status", "All Statuses", 
                java.util.List.of("Active", "Inactive"),
                s -> s,
                false
        );

        filterBar.setOnFilterChange(filters -> {
            currentSearch = (String) filters.get("search");
            
            java.util.List<String> statuses = (java.util.List<String>) filters.get("status");
            if (statuses == null || statuses.isEmpty()) {
                currentActiveStatuses = null;
            } else {
                currentActiveStatuses = statuses.stream()
                        .map("Active"::equals)
                        .toList();
            }
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
                    paginationBar.getPageSize(),
                    currentActiveStatuses,
                    null
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
        NotificationService.success("Employee list refreshed");
    }

    @FXML
    private void handleAdd() {
        workspaceManager.openDialog("Add Employee", "/fxml/people/user-form-view.fxml");
    }

    private java.util.List<javafx.scene.control.MenuItem> buildActionsMenu(User user) {
        java.util.List<javafx.scene.control.MenuItem> items = new java.util.ArrayList<>();

        if (com.possum.ui.common.UIPermissionUtil.hasPermission(com.possum.application.auth.Permissions.USERS_MANAGE)) {
            javafx.scene.control.MenuItem editItem = new javafx.scene.control.MenuItem("✏️ Edit");
            editItem.setOnAction(e -> workspaceManager.openDialog("Edit Employee: " + user.name(), "/fxml/people/user-form-view.fxml", Map.of("userId", user.id(), "mode", "edit")));
            items.add(editItem);

            javafx.scene.control.MenuItem rolesItem = new javafx.scene.control.MenuItem("🛡️ Roles & Permissions");
            rolesItem.setOnAction(e -> workspaceManager.openWindow("Roles & Permissions: " + user.name(), "/fxml/people/user-roles-view.fxml", Map.of("userId", user.id())));
            items.add(rolesItem);

            javafx.scene.control.MenuItem deleteItem = new javafx.scene.control.MenuItem("🗑️ Delete");
            deleteItem.setStyle("-fx-text-fill: red;");
            deleteItem.setOnAction(e -> handleDelete(user));
            items.add(new javafx.scene.control.SeparatorMenuItem());
            items.add(deleteItem);
        }

        return items;
    }

    private void handleDelete(User user) {
        Alert confirm = new Alert(Alert.AlertType.CONFIRMATION);
        DialogStyler.apply(confirm);
        confirm.setTitle("Confirm Deletion");
        confirm.setHeaderText("Delete employee '" + user.name() + "'?");
        confirm.setContentText("Are you sure you want to delete this employee? This action is permanent and cannot be undone.");
        
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
