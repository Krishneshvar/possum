package com.possum.ui.people;

import com.possum.application.people.CustomerService;
import com.possum.domain.model.Customer;
import com.possum.shared.dto.PagedResult;
import com.possum.shared.dto.CustomerFilter;
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

public class CustomersController {
    
    @FXML private FilterBar filterBar;
    @FXML private DataTableView<Customer> customersTable;
    @FXML private PaginationBar paginationBar;
    
    private final CustomerService customerService;
    private final WorkspaceManager workspaceManager;
    private String currentSearch = "";

    public CustomersController(CustomerService customerService, WorkspaceManager workspaceManager) {
        this.customerService = customerService;
        this.workspaceManager = workspaceManager;
    }

    @FXML
    public void initialize() {
        setupTable();
        setupFilters();
        loadCustomers();
    }

    private void setupTable() {
        TableColumn<Customer, String> nameCol = new TableColumn<>("Name");
        nameCol.setCellValueFactory(cellData -> new SimpleStringProperty(cellData.getValue().name()));
        
        TableColumn<Customer, String> phoneCol = new TableColumn<>("Phone");
        phoneCol.setCellValueFactory(cellData -> {
            String phone = cellData.getValue().phone();
            return new SimpleStringProperty(phone != null && !phone.isEmpty() ? phone : "-");
        });
        
        TableColumn<Customer, String> emailCol = new TableColumn<>("Email");
        emailCol.setCellValueFactory(cellData -> {
            String email = cellData.getValue().email();
            return new SimpleStringProperty(email != null && !email.isEmpty() ? email : "-");
        });
        
        TableColumn<Customer, String> addressCol = new TableColumn<>("Address");
        addressCol.setCellValueFactory(cellData -> {
            String addr = cellData.getValue().address();
            return new SimpleStringProperty(addr != null && !addr.isEmpty() ? addr : "-");
        });
        
        TableColumn<Customer, Integer> pointsCol = new TableColumn<>("Loyalty Points");
        pointsCol.setCellValueFactory(cellData -> new SimpleObjectProperty<>(cellData.getValue().loyaltyPoints()));
        
        customersTable.getTableView().getColumns().addAll(nameCol, phoneCol, emailCol, addressCol, pointsCol);
        
        customersTable.addActionColumn("Actions", this::showActions);
    }

    private void setupFilters() {
        filterBar.setOnFilterChange(filters -> {
            currentSearch = (String) filters.get("search");
            loadCustomers();
        });
        
        paginationBar.setOnPageChange((page, size) -> loadCustomers());
    }

    private void loadCustomers() {
        customersTable.setLoading(true);
        
        Platform.runLater(() -> {
            try {
                CustomerFilter filter = new CustomerFilter(
                    currentSearch == null || currentSearch.isEmpty() ? null : currentSearch,
                    paginationBar.getCurrentPage(),
                    paginationBar.getPageSize(),
                    paginationBar.getCurrentPage(),
                    paginationBar.getPageSize(),
                    "name",
                    "ASC"
                );
                
                PagedResult<Customer> result = customerService.getCustomers(filter);
                
                customersTable.setItems(FXCollections.observableArrayList(result.items()));
                paginationBar.setTotalItems(result.totalCount());
                customersTable.setLoading(false);
            } catch (Exception e) {
                customersTable.setLoading(false);
                NotificationService.error("Failed to load customers: " + e.getMessage());
            }
        });
    }

    @FXML
    private void handleRefresh() {
        loadCustomers();
    }

    @FXML
    private void handleAdd() {
        workspaceManager.openDialog("Add Customer", "/fxml/people/customer-form-view.fxml");
    }

    private void showActions(Customer customer) {
        Alert alert = new Alert(Alert.AlertType.CONFIRMATION);
        alert.setTitle("Customer Actions");
        alert.setHeaderText(customer.name());
        alert.setContentText("Choose action:");
        
        ButtonType editBtn = new ButtonType("Edit");
        ButtonType deleteBtn = new ButtonType("Delete");
        ButtonType cancelBtn = ButtonType.CANCEL;
        
        alert.getButtonTypes().setAll(editBtn, deleteBtn, cancelBtn);
        
        alert.showAndWait().ifPresent(type -> {
            if (type == editBtn) {
                workspaceManager.openDialog("Edit Customer: " + customer.name(), "/fxml/people/customer-form-view.fxml", Map.of("customerId", customer.id(), "mode", "edit"));
            } else if (type == deleteBtn) {
                handleDelete(customer);
            }
        });
    }

    private void handleDelete(Customer customer) {
        Alert confirm = new Alert(Alert.AlertType.CONFIRMATION);
        confirm.setTitle("Delete Customer");
        confirm.setHeaderText("Delete " + customer.name() + "?");
        confirm.setContentText("This action cannot be undone.");
        
        confirm.showAndWait().ifPresent(response -> {
            if (response == ButtonType.OK) {
                try {
                    customerService.deleteCustomer(customer.id());
                    NotificationService.success("Customer deleted successfully");
                    loadCustomers();
                } catch (Exception e) {
                    NotificationService.error("Failed to delete customer: " + e.getMessage());
                }
            }
        });
    }
}
