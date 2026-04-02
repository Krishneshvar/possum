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
import javafx.scene.control.Label;
import javafx.application.Platform;
import javafx.beans.property.SimpleStringProperty;
import javafx.collections.FXCollections;
import org.kordamp.ikonli.javafx.FontIcon;
import javafx.scene.control.MenuItem;
import javafx.scene.control.SeparatorMenuItem;
import java.util.ArrayList;
import javafx.fxml.FXML;
import javafx.scene.control.Alert;
import javafx.scene.control.ButtonType;
import javafx.scene.control.TableColumn;
import com.possum.ui.common.dialogs.DialogStyler;

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
            FontIcon plusIcon = new FontIcon("bx-plus");
            plusIcon.setIconSize(16);
            plusIcon.setIconColor(javafx.scene.paint.Color.WHITE);
            createButton.setGraphic(plusIcon);
        }
        setupTable();
        setupFilters();
        loadSuppliers();
    }

    private void setupTable() {
        TableColumn<Supplier, String> gstinCol = new TableColumn<>("GSTIN");
        gstinCol.setPrefWidth(140);
        gstinCol.setCellValueFactory(cellData -> new SimpleStringProperty(cellData.getValue().gstin() != null ? cellData.getValue().gstin() : "-"));
        
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

        suppliersTable.getTableView().getColumns().addAll(gstinCol, nameCol, contactCol, phoneCol, emailCol, policyCol);
        suppliersTable.addMenuActionColumn("Actions", this::buildActionsMenu);
        suppliersTable.setEmptyMessage("No suppliers found. Click 'Create Supplier' to add one.");
    }

    private List<MenuItem> buildActionsMenu(Supplier supplier) {
        List<MenuItem> items = new ArrayList<>();

        MenuItem viewItem = new MenuItem("View Details");
        FontIcon viewIcon = new FontIcon("bx-show");
        viewIcon.setIconSize(14);
        viewIcon.getStyleClass().add("table-action-icon");
        viewItem.setGraphic(viewIcon);
        viewItem.setOnAction(e -> workspaceManager.openWindow("View Supplier: " + supplier.name(), "/fxml/purchase/supplier-form-view.fxml", Map.of("supplierId", supplier.id(), "mode", "view")));

        MenuItem editItem = new MenuItem("Edit Supplier");
        FontIcon editIcon = new FontIcon("bx-pencil");
        editIcon.setIconSize(14);
        editIcon.getStyleClass().add("table-action-icon");
        editItem.setGraphic(editIcon);
        editItem.setOnAction(e -> handleEdit(supplier));

        MenuItem deleteItem = new MenuItem("Delete Supplier");
        deleteItem.getStyleClass().add("logout-menu-item"); // Usage of standard destructive menu item style
        FontIcon deleteIcon = new FontIcon("bx-trash");
        deleteIcon.setIconSize(14);
        deleteIcon.getStyleClass().add("table-action-icon-danger");
        deleteItem.setGraphic(deleteIcon);
        deleteItem.setOnAction(e -> handleDelete(supplier));

        items.addAll(java.util.Arrays.asList(viewItem, editItem, new SeparatorMenuItem(), deleteItem));
        return items;
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
        DialogStyler.apply(confirm);
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
