package com.possum.ui.purchase;

import com.possum.domain.model.PaymentPolicy;
import com.possum.domain.model.Supplier;
import com.possum.persistence.repositories.interfaces.SupplierRepository;
import com.possum.shared.dto.PagedResult;
import com.possum.shared.dto.SupplierFilter;
import com.possum.ui.common.controls.DataTableView;
import com.possum.ui.common.controls.FilterBar;
import com.possum.ui.common.controls.PaginationBar;
import com.possum.ui.common.controls.NotificationService;
import com.possum.ui.workspace.WorkspaceManager;
import javafx.application.Platform;
import javafx.beans.property.SimpleStringProperty;
import javafx.collections.FXCollections;
import javafx.fxml.FXML;
import javafx.scene.control.Alert;
import javafx.scene.control.ButtonType;
import javafx.scene.control.TableColumn;

import java.util.List;
import java.util.HashMap;
import java.util.Map;

public class SuppliersController {
    @FXML private FilterBar filterBar;
    @FXML private DataTableView<Supplier> suppliersTable;
    @FXML private PaginationBar paginationBar;
    @FXML private javafx.scene.control.Button createButton;
    
    private SupplierRepository supplierRepository;
    private WorkspaceManager workspaceManager;
    private String currentSearch = "";
    private List<Long> currentPolicyIds = null;

    public SuppliersController(SupplierRepository supplierRepository, WorkspaceManager workspaceManager) {
        this.supplierRepository = supplierRepository;
        this.workspaceManager = workspaceManager;
    }

    @FXML
    public void initialize() {
        if (createButton != null) {
            com.possum.ui.common.UIPermissionUtil.requirePermission(createButton, com.possum.application.auth.Permissions.SUPPLIERS_MANAGE);
        }
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

        TableColumn<Supplier, String> policyCol = new TableColumn<>("Policy");
        policyCol.setCellValueFactory(cellData -> new SimpleStringProperty(cellData.getValue().paymentPolicyName() != null ? cellData.getValue().paymentPolicyName() : "-"));

        suppliersTable.getTableView().getColumns().addAll(nameCol, contactCol, phoneCol, emailCol, policyCol);
        
        suppliersTable.addActionColumn("Actions", this::showActions);
    }

    private void setupFilters() {
        try {
            List<PaymentPolicy> policies = supplierRepository.getPaymentPolicies();
            filterBar.addMultiSelectFilter("policy", "All Policies", policies, PaymentPolicy::name, false);
        } catch(Exception e) {}

        filterBar.setOnFilterChange(filters -> {
            currentSearch = (String) filters.get("search");
            List<PaymentPolicy> selectedPolicies = (List<PaymentPolicy>) filters.get("policy");
            if (selectedPolicies == null || selectedPolicies.isEmpty()) {
                currentPolicyIds = null;
            } else {
                currentPolicyIds = selectedPolicies.stream()
                        .map(PaymentPolicy::id)
                        .toList();
            }
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
                    currentPolicyIds,
                    "name",
                    "ASC"
                );
                
                PagedResult<Supplier> result = supplierRepository.getAllSuppliers(filter);
                
                suppliersTable.setItems(FXCollections.observableArrayList(result.items()));
                paginationBar.setTotalItems(result.totalCount());
                suppliersTable.setLoading(false);
            } catch (Exception e) {
                suppliersTable.setLoading(false);
                NotificationService.error("Failed to load suppliers");
            }
        });
    }

    @FXML
    private void handleRefresh() {
        loadSuppliers();
    }

    @FXML
    private void handleCreate() {
        com.possum.application.auth.ServiceSecurity.requirePermission(com.possum.application.auth.Permissions.SUPPLIERS_MANAGE);
        Map<String, Object> params = new HashMap<>();
        params.put("onSave", (Runnable) this::loadSuppliers);
        workspaceManager.openWindow("Add Supplier", "/fxml/purchase/supplier-form-view.fxml", params);
    }

    private void showActions(Supplier supplier) {
        Alert alert = new Alert(Alert.AlertType.CONFIRMATION);
        alert.setTitle("Supplier Actions");
        alert.setHeaderText(supplier.name());
        alert.setContentText("Choose action:");
        
        ButtonType editBtn = new ButtonType("Edit");
        ButtonType deleteBtn = new ButtonType("Delete");
        ButtonType refreshBtn = new ButtonType("Refresh List");
        ButtonType cancelBtn = ButtonType.CANCEL;
        
        alert.getButtonTypes().setAll(editBtn, deleteBtn, refreshBtn, cancelBtn);
        
        alert.showAndWait().ifPresent(type -> {
            if (type == editBtn) {
                handleEdit(supplier);
            } else if (type == deleteBtn) {
                handleDelete(supplier);
            } else if (type == refreshBtn) {
                loadSuppliers();
            }
        });
    }

    private void handleEdit(Supplier supplier) {
        com.possum.application.auth.ServiceSecurity.requirePermission(com.possum.application.auth.Permissions.SUPPLIERS_MANAGE);
        Map<String, Object> params = new HashMap<>();
        params.put("supplierId", supplier.id());
        params.put("onSave", (Runnable) this::loadSuppliers);
        workspaceManager.openWindow("Edit Supplier", "/fxml/purchase/supplier-form-view.fxml", params);
    }

    private void handleDelete(Supplier supplier) {
        com.possum.application.auth.ServiceSecurity.requirePermission(com.possum.application.auth.Permissions.SUPPLIERS_MANAGE);
        Alert confirm = new Alert(Alert.AlertType.CONFIRMATION);
        confirm.setTitle("Delete Supplier");
        confirm.setHeaderText("Delete " + supplier.name() + "?");
        confirm.setContentText("This will delete the supplier.");
        
        confirm.showAndWait().ifPresent(response -> {
            if (response == ButtonType.OK) {
                try {
                    supplierRepository.deleteSupplier(supplier.id());
                    NotificationService.success("Supplier deleted");
                    loadSuppliers();
                } catch (Exception e) {
                    NotificationService.error("Failed to delete: " + e.getMessage());
                }
            }
        });
    }
}
