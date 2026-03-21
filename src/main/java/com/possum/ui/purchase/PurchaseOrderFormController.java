package com.possum.ui.purchase;

import com.possum.application.auth.AuthContext;
import com.possum.application.purchase.PurchaseService;
import com.possum.domain.model.PurchaseOrder;
import com.possum.domain.model.PurchaseOrderItem;
import com.possum.domain.model.Supplier;
import com.possum.domain.model.Variant;
import com.possum.persistence.repositories.interfaces.SupplierRepository;
import com.possum.persistence.repositories.interfaces.VariantRepository;
import com.possum.shared.dto.PagedResult;
import com.possum.ui.common.controls.NotificationService;
import com.possum.ui.navigation.Parameterizable;
import com.possum.ui.workspace.WorkspaceManager;
import javafx.application.Platform;
import javafx.collections.FXCollections;
import javafx.fxml.FXML;
import javafx.scene.control.*;
import javafx.scene.layout.HBox;
import javafx.scene.layout.VBox;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class PurchaseOrderFormController implements Parameterizable {

    @FXML private Label titleLabel;
    @FXML private ComboBox<Supplier> supplierCombo;
    @FXML private VBox itemsBox;

    private PurchaseService purchaseService;
    private SupplierRepository supplierRepository;
    private VariantRepository variantRepository;
    private WorkspaceManager workspaceManager;

    private PurchaseOrder existingPo;
    private Runnable onSaveCallback;
    private List<PurchaseItemRow> itemRows = new ArrayList<>();

    public PurchaseOrderFormController(PurchaseService purchaseService, SupplierRepository supplierRepository,
                                       VariantRepository variantRepository, WorkspaceManager workspaceManager) {
        this.purchaseService = purchaseService;
        this.supplierRepository = supplierRepository;
        this.variantRepository = variantRepository;
        this.workspaceManager = workspaceManager;
    }

    @Override
    public void setParameters(Map<String, Object> params) {
        if (params != null) {
            if (params.containsKey("order")) {
                existingPo = (PurchaseOrder) params.get("order");
                Platform.runLater(() -> titleLabel.setText("Edit Purchase Order"));
            } else {
                existingPo = null;
                Platform.runLater(() -> titleLabel.setText("Create Purchase Order"));
            }
            if (params.containsKey("onSave")) {
                onSaveCallback = (Runnable) params.get("onSave");
            }
        } else {
            existingPo = null;
            Platform.runLater(() -> titleLabel.setText("Create Purchase Order"));
        }
        loadData();
    }

    @FXML
    public void initialize() {
        if (existingPo == null) {
            handleAddItem();
        }
    }

    private void loadData() {
        Platform.runLater(() -> {
            try {
                PagedResult<Supplier> suppliers = supplierRepository.getAllSuppliers(new com.possum.shared.dto.SupplierFilter(0, 100, null, null, "name", "ASC"));
                supplierCombo.setItems(FXCollections.observableArrayList(suppliers.items()));
                
                if (existingPo != null) {
                    Supplier existingSupplier = suppliers.items().stream()
                        .filter(s -> s.id().equals(existingPo.supplierId()))
                        .findFirst().orElse(null);
                    supplierCombo.setValue(existingSupplier);

                    PurchaseService.PurchaseOrderDetail detail = purchaseService.getPurchaseOrderById(existingPo.id());
                    for (PurchaseOrderItem item : detail.items()) {
                        PurchaseItemRow row = new PurchaseItemRow();
                        row.setVariant(item.variantId());
                        row.setQuantity(item.quantity());
                        row.setUnitCost(item.unitCost());
                        itemRows.add(row);
                        itemsBox.getChildren().add(row.getRow());
                    }
                }
            } catch (Exception e) {
                NotificationService.error("Failed to load data for PO Form");
            }
        });
    }

    @FXML
    private void handleAddItem() {
        PurchaseItemRow row = new PurchaseItemRow();
        itemRows.add(row);
        itemsBox.getChildren().add(row.getRow());
    }

    @FXML
    private void handleCancel() {
        workspaceManager.closeActiveWindow();
    }

    @FXML
    private void handleSave() {
        try {
            Supplier supplier = supplierCombo.getValue();
            if (supplier == null) {
                NotificationService.error("Select a supplier");
                return;
            }
            
            List<PurchaseService.PurchaseOrderItemRequest> items = itemRows.stream()
                .filter(row -> row.getVariantId() != null)
                .map(row -> new PurchaseService.PurchaseOrderItemRequest(
                    row.getVariantId(),
                    row.getQuantity(),
                    row.getUnitCost()
                ))
                .toList();
            
            if (items.isEmpty()) {
                NotificationService.error("Add at least one valid item");
                return;
            }
            
            long userId = AuthContext.getCurrentUser().id();
            
            if (existingPo == null) {
                purchaseService.createPurchaseOrder(supplier.id(), userId, items);
            } else {
                purchaseService.updatePurchaseOrder(existingPo.id(), supplier.id(), userId, items);
            }
            
            NotificationService.success("Purchase order saved");
            if (onSaveCallback != null) {
                onSaveCallback.run();
            }
            workspaceManager.closeActiveWindow();
        } catch (Exception e) {
            NotificationService.error("Failed: " + e.getMessage());
        }
    }

    private class PurchaseItemRow {
        private ComboBox<Variant> variantCombo;
        private TextField quantityField;
        private TextField costField;
        private HBox row;
        
        PurchaseItemRow() {
            variantCombo = new ComboBox<>();
            variantCombo.setPromptText("Select variant");
            variantCombo.setPrefWidth(200);
            
            quantityField = new TextField();
            quantityField.setPromptText("Qty");
            quantityField.setPrefWidth(60);
            
            costField = new TextField();
            costField.setPromptText("Cost");
            costField.setPrefWidth(80);
            
            Button searchBtn = new Button("Search");
            searchBtn.setOnAction(e -> searchVariants());

            Button removeBtn = new Button("Remove");
            removeBtn.setStyle("-fx-text-fill: red;");
            removeBtn.setOnAction(e -> {
                itemRows.remove(this);
                itemsBox.getChildren().remove(row);
            });
            
            row = new HBox(10, variantCombo, searchBtn, quantityField, costField, removeBtn);
            row.setAlignment(javafx.geometry.Pos.CENTER_LEFT);
        }
        
        private void searchVariants() {
            TextInputDialog dialog = new TextInputDialog();
            dialog.setTitle("Search Variants");
            dialog.setHeaderText("Enter product name or SKU:");
            dialog.showAndWait().ifPresent(query -> {
                PagedResult<Variant> result = variantRepository.findVariants(
                    query, null, null, null, null, "name", "ASC", 0, 50
                );
                variantCombo.setItems(FXCollections.observableArrayList(result.items()));
            });
        }
        
        HBox getRow() { return row; }
        
        void setVariant(Long variantId) {
            variantRepository.findVariantByIdSync(variantId).ifPresent(variantCombo::setValue);
        }
        
        void setQuantity(int qty) { quantityField.setText(String.valueOf(qty)); }
        void setUnitCost(BigDecimal cost) { costField.setText(cost.toString()); }
        
        Long getVariantId() {
            Variant v = variantCombo.getValue();
            return v != null ? v.id() : null;
        }
        
        int getQuantity() {
            try { return Integer.parseInt(quantityField.getText()); }
            catch (Exception e) { return 0; }
        }
        
        BigDecimal getUnitCost() {
            try { return new BigDecimal(costField.getText()); }
            catch (Exception e) { return BigDecimal.ZERO; }
        }
    }
}
