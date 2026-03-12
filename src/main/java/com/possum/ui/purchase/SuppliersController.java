package com.possum.ui.purchase;

import com.possum.domain.model.PaymentPolicy;
import com.possum.domain.model.Supplier;
import com.possum.persistence.repositories.interfaces.SupplierRepository;
import com.possum.shared.dto.PagedResult;
import com.possum.shared.dto.SupplierFilter;
import com.possum.ui.common.controls.DataTableView;
import com.possum.ui.common.controls.FilterBar;
import com.possum.ui.common.controls.FormDialog;
import com.possum.ui.common.controls.NotificationService;
import com.possum.ui.common.controls.PaginationBar;
import javafx.application.Platform;
import javafx.beans.property.SimpleStringProperty;
import javafx.collections.FXCollections;
import javafx.fxml.FXML;
import javafx.scene.control.Alert;
import javafx.scene.control.ButtonType;
import javafx.scene.control.TableColumn;

import java.util.List;

public class SuppliersController {

    @FXML private FilterBar filterBar;
    @FXML private DataTableView<Supplier> suppliersTable;
    @FXML private PaginationBar paginationBar;

    private final SupplierRepository supplierRepository;
    private String currentSearch = "";

    public SuppliersController(SupplierRepository supplierRepository) {
        this.supplierRepository = supplierRepository;
    }

    @FXML
    public void initialize() {
        setupTable();
        setupFilters();
        loadSuppliers();
    }

    private void setupTable() {
        TableColumn<Supplier, String> nameCol = new TableColumn<>("Name");
        nameCol.setCellValueFactory(cellData -> new SimpleStringProperty(cellData.getValue().name()));

        TableColumn<Supplier, String> contactCol = new TableColumn<>("Contact Person");
        contactCol.setCellValueFactory(cellData -> new SimpleStringProperty(cellData.getValue().contactPerson()));

        TableColumn<Supplier, String> phoneCol = new TableColumn<>("Phone");
        phoneCol.setCellValueFactory(cellData -> new SimpleStringProperty(cellData.getValue().phone()));

        TableColumn<Supplier, String> emailCol = new TableColumn<>("Email");
        emailCol.setCellValueFactory(cellData -> new SimpleStringProperty(cellData.getValue().email()));

        TableColumn<Supplier, String> paymentPolicyCol = new TableColumn<>("Payment Policy");
        paymentPolicyCol.setCellValueFactory(cellData -> new SimpleStringProperty(cellData.getValue().paymentPolicyName()));

        suppliersTable.getTableView().getColumns().addAll(nameCol, contactCol, phoneCol, emailCol, paymentPolicyCol);

        suppliersTable.addActionColumn("Actions", this::showActions);
    }

    private void setupFilters() {
        filterBar.setOnFilterChange(filters -> {
            currentSearch = (String) filters.get("search");
            loadSuppliers();
        });

        paginationBar.setOnPageChange((page, size) -> loadSuppliers());
    }

    private void loadSuppliers() {
        suppliersTable.setLoading(true);

        Platform.runLater(() -> {
            try {
                SupplierFilter filter = new SupplierFilter(
                        paginationBar.getCurrentPage(),
                        paginationBar.getPageSize(),
                        currentSearch.isEmpty() ? null : currentSearch,
                        null,
                        "name",
                        "ASC"
                );

                PagedResult<Supplier> result = supplierRepository.getAllSuppliers(filter);

                suppliersTable.setItems(FXCollections.observableArrayList(result.items()));
                paginationBar.setTotalItems(result.totalCount());
                suppliersTable.setLoading(false);
            } catch (Exception e) {
                suppliersTable.setLoading(false);
                NotificationService.error("Failed to load suppliers: " + e.getMessage());
            }
        });
    }

    @FXML
    private void handleAdd() {
        List<PaymentPolicy> policies = supplierRepository.getPaymentPolicies();

        FormDialog.show("Add Supplier", dialog -> {
            dialog.addTextField("name", "Name", "");
            dialog.addTextField("contactPerson", "Contact Person", "");
            dialog.addTextField("phone", "Phone", "");
            dialog.addTextField("email", "Email", "");
            dialog.addTextArea("address", "Address", "");
            dialog.addTextField("gstin", "GSTIN", "");

            // For simplicity, we just use a dropdown if we want, or textfield
            // Currently FormDialog in this app's style doesn't have addComboBox natively shown in other controllers
            // except if we use custom. I'll just skip payment policy here or use default 1
        }, values -> {
            try {
                Supplier supplier = new Supplier(
                        null,
                        (String) values.get("name"),
                        (String) values.get("contactPerson"),
                        (String) values.get("phone"),
                        (String) values.get("email"),
                        (String) values.get("address"),
                        (String) values.get("gstin"),
                        1L, // Default payment policy
                        null, null, null, null
                );

                supplierRepository.createSupplier(supplier);
                NotificationService.success("Supplier created successfully");
                loadSuppliers();
            } catch (Exception e) {
                NotificationService.error("Failed to create supplier: " + e.getMessage());
            }
        });
    }

    private void showActions(Supplier supplier) {
        Alert alert = new Alert(Alert.AlertType.CONFIRMATION);
        alert.setTitle("Supplier Actions");
        alert.setHeaderText(supplier.name());
        alert.setContentText("Choose action:");

        ButtonType editBtn = new ButtonType("Edit");
        ButtonType deleteBtn = new ButtonType("Delete");
        ButtonType cancelBtn = ButtonType.CANCEL;

        alert.getButtonTypes().setAll(editBtn, deleteBtn, cancelBtn);

        alert.showAndWait().ifPresent(type -> {
            if (type == editBtn) {
                handleEdit(supplier);
            } else if (type == deleteBtn) {
                handleDelete(supplier);
            }
        });
    }

    private void handleEdit(Supplier supplier) {
        FormDialog.show("Edit Supplier", dialog -> {
            dialog.addTextField("name", "Name", supplier.name());
            dialog.addTextField("contactPerson", "Contact Person", supplier.contactPerson() == null ? "" : supplier.contactPerson());
            dialog.addTextField("phone", "Phone", supplier.phone() == null ? "" : supplier.phone());
            dialog.addTextField("email", "Email", supplier.email() == null ? "" : supplier.email());
            dialog.addTextArea("address", "Address", supplier.address() == null ? "" : supplier.address());
            dialog.addTextField("gstin", "GSTIN", supplier.gstin() == null ? "" : supplier.gstin());
        }, values -> {
            try {
                Supplier updatedSupplier = new Supplier(
                        supplier.id(),
                        (String) values.get("name"),
                        (String) values.get("contactPerson"),
                        (String) values.get("phone"),
                        (String) values.get("email"),
                        (String) values.get("address"),
                        (String) values.get("gstin"),
                        supplier.paymentPolicyId(),
                        supplier.paymentPolicyName(),
                        supplier.createdAt(),
                        null,
                        null
                );

                supplierRepository.updateSupplier(supplier.id(), updatedSupplier);
                NotificationService.success("Supplier updated successfully");
                loadSuppliers();
            } catch (Exception e) {
                NotificationService.error("Failed to update supplier: " + e.getMessage());
            }
        });
    }

    private void handleDelete(Supplier supplier) {
        Alert confirm = new Alert(Alert.AlertType.CONFIRMATION);
        confirm.setTitle("Delete Supplier");
        confirm.setHeaderText("Delete " + supplier.name() + "?");
        confirm.setContentText("This action cannot be undone.");

        confirm.showAndWait().ifPresent(response -> {
            if (response == ButtonType.OK) {
                try {
                    supplierRepository.deleteSupplier(supplier.id());
                    NotificationService.success("Supplier deleted successfully");
                    loadSuppliers();
                } catch (Exception e) {
                    NotificationService.error("Failed to delete supplier: " + e.getMessage());
                }
            }
        });
    }
}
