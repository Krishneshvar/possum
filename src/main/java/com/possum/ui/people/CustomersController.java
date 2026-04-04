package com.possum.ui.people;

import com.possum.application.auth.AuthContext;
import com.possum.application.auth.AuthUser;
import com.possum.application.people.CustomerService;
import com.possum.domain.model.Customer;
import com.possum.shared.dto.PagedResult;
import com.possum.shared.dto.CustomerFilter;
import com.possum.ui.common.controls.DataTableView;
import com.possum.ui.common.controls.FilterBar;
import com.possum.ui.common.controls.NotificationService;
import com.possum.ui.common.controls.PaginationBar;
import com.possum.ui.common.dialogs.ImportProgressDialog;
import com.possum.ui.workspace.WorkspaceManager;
import com.possum.shared.util.CsvImportUtil;
import javafx.concurrent.Task;
import javafx.application.Platform;
import javafx.collections.FXCollections;
import javafx.fxml.FXML;
import javafx.scene.control.Alert;
import javafx.scene.control.ButtonType;
import javafx.scene.control.TableColumn;
import javafx.beans.property.SimpleStringProperty;
import com.possum.ui.common.dialogs.DialogStyler;
import javafx.stage.FileChooser;

import java.io.File;
import java.util.ArrayList;
import java.util.List;
import java.util.StringJoiner;

import java.util.Map;

public class CustomersController {
    
    @FXML private FilterBar filterBar;
    @FXML private DataTableView<Customer> customersTable;
    @FXML private PaginationBar paginationBar;
    @FXML private javafx.scene.control.Button addButton;
    @FXML private javafx.scene.control.Button importButton;
    
    private final CustomerService customerService;
    private final WorkspaceManager workspaceManager;
    private String currentSearch = "";

    public CustomersController(CustomerService customerService, WorkspaceManager workspaceManager) {
        this.customerService = customerService;
        this.workspaceManager = workspaceManager;
    }

    @FXML
    public void initialize() {
        if (addButton != null) {
            com.possum.ui.common.UIPermissionUtil.requirePermission(addButton, com.possum.application.auth.Permissions.CUSTOMERS_MANAGE);
        }
        if (importButton != null) {
            com.possum.ui.common.UIPermissionUtil.requirePermission(importButton, com.possum.application.auth.Permissions.CUSTOMERS_MANAGE);
        }
        setupTable();
        setupFilters();
        loadCustomers();
    }

    private void setupTable() {
        TableColumn<Customer, String> nameCol = new TableColumn<>("Name");
        nameCol.setCellValueFactory(cellData -> new SimpleStringProperty(cellData.getValue().name()));
        
        TableColumn<Customer, String> phoneCol = new TableColumn<>("Phone");
        phoneCol.setSortable(false);
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
        addressCol.setSortable(false);
        addressCol.setCellValueFactory(cellData -> {
            String addr = cellData.getValue().address();
            return new SimpleStringProperty(addr != null && !addr.isEmpty() ? addr : "-");
        });
        
        customersTable.getTableView().getColumns().addAll(nameCol, phoneCol, emailCol, addressCol);
        
        customersTable.addMenuActionColumn("Actions", this::buildActionsMenu);
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
                    paginationBar.getCurrentPage() + 1,
                    paginationBar.getPageSize(),
                    paginationBar.getCurrentPage() + 1,
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
        NotificationService.success("Customer list refreshed");
    }

    @FXML
    private void handleImport() {
        FileChooser fileChooser = new FileChooser();
        fileChooser.setTitle("Import Customers from CSV");
        fileChooser.getExtensionFilters().add(new FileChooser.ExtensionFilter("CSV Files", "*.csv"));

        File file = fileChooser.showOpenDialog(addButton != null ? addButton.getScene().getWindow() : null);
        if (file == null) return;

        AuthUser currentUser = AuthContext.getCurrentUser();
        if (currentUser == null) {
            NotificationService.error("No active user session found. Please sign in again and retry import.");
            return;
        }

        javafx.stage.Window owner = addButton != null && addButton.getScene() != null
                ? addButton.getScene().getWindow()
                : null;
        ImportProgressDialog progressDialog = new ImportProgressDialog(owner, "Import Customers");
        progressDialog.show();

        Task<ImportResult> importTask = new Task<>() {
            @Override
            protected ImportResult call() throws Exception {
                AuthContext.setCurrentUser(currentUser);
                try {
                    List<List<String>> rows = CsvImportUtil.readCsv(file.toPath());
                    int headerIndex = CsvImportUtil.findHeaderRowIndex(rows, "Customer Name");
                    if (headerIndex < 0) {
                        headerIndex = CsvImportUtil.findHeaderRowIndex(rows, "Name");
                    }
                    if (headerIndex < 0) {
                        throw new IllegalArgumentException("Could not find a valid customer header row in CSV.");
                    }

                    Map<String, Integer> headers = CsvImportUtil.buildHeaderIndex(rows.get(headerIndex));
                    List<CustomerImportRow> records = new ArrayList<>();

                    for (int i = headerIndex + 1; i < rows.size(); i++) {
                        List<String> row = rows.get(i);
                        if (CsvImportUtil.isRowEmpty(row)) {
                            continue;
                        }

                        String name = CsvImportUtil.emptyToNull(CsvImportUtil.getValue(
                                row,
                                headers,
                                "Customer Name",
                                "Name"
                        ));
                        if (name == null) {
                            continue;
                        }

                        String phone = CsvImportUtil.emptyToNull(CsvImportUtil.getValue(
                                row,
                                headers,
                                "Contact Number",
                                "Phone"
                        ));
                        String email = CsvImportUtil.emptyToNull(CsvImportUtil.getValue(
                                row,
                                headers,
                                "Email"
                        ));
                        String address = buildAddress(
                                CsvImportUtil.getValue(row, headers, "Customer Address", "Address"),
                                CsvImportUtil.getValue(row, headers, "City"),
                                CsvImportUtil.getValue(row, headers, "Pin Code", "Pincode", "Postal Code")
                        );

                        records.add(new CustomerImportRow(name, phone, email, address));
                    }

                    int totalRecords = records.size();
                    progressDialog.setTotalRecords(totalRecords);

                    int processed = 0;
                    int imported = 0;
                    int skipped = 0;

                    for (CustomerImportRow record : records) {
                        processed++;
                        try {
                            customerService.createCustomer(record.name(), record.phone(), record.email(), record.address());
                            imported++;
                        } catch (Exception ex) {
                            String message = ex.getMessage() == null ? "" : ex.getMessage();
                            if (message.contains("UNIQUE constraint failed")) {
                                skipped++;
                            } else {
                                skipped++;
                            }
                        }
                        progressDialog.updateProgress(processed, imported);
                    }

                    return new ImportResult(totalRecords, imported, skipped);
                } finally {
                    AuthContext.clear();
                }
            }
        };

        importTask.setOnSucceeded(event -> {
            ImportResult result = importTask.getValue();
            progressDialog.complete(result.totalRecords(), result.imported(), result.skipped());
            loadCustomers();

            if (result.skipped() == 0) {
                NotificationService.success("Imported " + result.imported() + " customer(s) successfully.");
            } else {
                NotificationService.warning("Imported " + result.imported() + " customer(s). " + result.skipped() + " row(s) skipped.");
            }
        });

        importTask.setOnFailed(event -> {
            Throwable error = importTask.getException();
            String message = error != null && error.getMessage() != null ? error.getMessage() : "Unknown error";
            progressDialog.fail(message);
            NotificationService.error("Failed to import customers: " + message);
        });

        Thread worker = new Thread(importTask, "customers-import-task");
        worker.setDaemon(true);
        worker.start();
    }

    private String buildAddress(String address, String city, String pinCode) {
        StringJoiner joiner = new StringJoiner(", ");

        String normalizedAddress = CsvImportUtil.emptyToNull(address);
        String normalizedCity = CsvImportUtil.emptyToNull(city);
        String normalizedPin = CsvImportUtil.emptyToNull(pinCode);

        if (normalizedAddress != null) {
            joiner.add(normalizedAddress);
        }
        if (normalizedCity != null) {
            joiner.add(normalizedCity);
        }
        if (normalizedPin != null) {
            joiner.add(normalizedPin);
        }

        String merged = joiner.toString();
        return merged.isEmpty() ? null : merged;
    }

    private record CustomerImportRow(String name, String phone, String email, String address) {}
    private record ImportResult(int totalRecords, int imported, int skipped) {}

    @FXML
    private void handleAdd() {
        workspaceManager.openDialog("Add Customer", "/fxml/people/customer-form-view.fxml");
    }

    private java.util.List<javafx.scene.control.MenuItem> buildActionsMenu(Customer customer) {
        java.util.List<javafx.scene.control.MenuItem> items = new java.util.ArrayList<>();

        if (com.possum.ui.common.UIPermissionUtil.hasPermission(com.possum.application.auth.Permissions.CUSTOMERS_MANAGE)) {
            javafx.scene.control.MenuItem editItem = new javafx.scene.control.MenuItem("✏️ Edit");
            editItem.setOnAction(e -> workspaceManager.openDialog("Edit Customer: " + customer.name(), "/fxml/people/customer-form-view.fxml", Map.of("customerId", customer.id(), "mode", "edit")));
            items.add(editItem);

            javafx.scene.control.MenuItem deleteItem = new javafx.scene.control.MenuItem("🗑️ Delete");
            deleteItem.setStyle("-fx-text-fill: red;");
            deleteItem.setOnAction(e -> handleDelete(customer));
            items.add(new javafx.scene.control.SeparatorMenuItem());
            items.add(deleteItem);
        }

        return items;
    }

    private void handleDelete(Customer customer) {
        Alert confirm = new Alert(Alert.AlertType.CONFIRMATION);
        DialogStyler.apply(confirm);
        confirm.setTitle("Confirm Deletion");
        confirm.setHeaderText("Delete customer '" + customer.name() + "'?");
        confirm.setContentText("Are you sure you want to delete this customer? This action is permanent and cannot be undone.");
        
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
