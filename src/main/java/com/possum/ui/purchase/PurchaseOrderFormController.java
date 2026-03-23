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
    @FXML private TextField searchVariantField;
    @FXML private VBox itemsBox;
    @FXML private Button saveButton;
    @FXML private Label totalCostLabel;

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
        boolean isView = false;
        if (params != null) {
            isView = "view".equals(params.get("mode"));
            if (params.containsKey("order")) {
                existingPo = (PurchaseOrder) params.get("order");
                final boolean finalIsView = isView;
                Platform.runLater(() -> titleLabel.setText(finalIsView ? "View Purchase Order" : "Edit Purchase Order"));
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
        final boolean finalIsView = isView;
        Platform.runLater(() -> {
            if (finalIsView) {
                saveButton.setVisible(false);
                saveButton.setManaged(false);
                if (searchVariantField != null) {
                    searchVariantField.setVisible(false);
                    searchVariantField.setManaged(false);
                }
                supplierCombo.setDisable(true);
            }
        });
        loadData(isView);
    }

    @FXML
    public void initialize() {
        if (searchVariantField != null) {
            searchVariantField.setOnAction(e -> {
                String query = searchVariantField.getText().trim();
                if (query.isEmpty()) return;
                try {
                    PagedResult<Variant> result = variantRepository.findVariants(
                        query, null, null, null, null, "name", "ASC", 0, 10
                    );
                    if (!result.items().isEmpty()) {
                        Variant v = result.items().get(0);
                        addVariantToCart(v);
                        searchVariantField.clear();
                    } else {
                        NotificationService.warning("No product matching: " + query);
                    }
                } catch (Exception ex) {}
            });
        }
    }

    private void loadData(boolean isView) {
        Platform.runLater(() -> {
            try {
                PagedResult<Supplier> suppliers = supplierRepository.getAllSuppliers(new com.possum.shared.dto.SupplierFilter(0, 1000, null, null, "name", "ASC"));
                makeSupplierComboSearchable(suppliers.items());
                
                if (existingPo != null) {
                    Supplier existingSupplier = suppliers.items().stream()
                        .filter(s -> s.id().equals(existingPo.supplierId()))
                        .findFirst().orElse(null);
                    supplierCombo.setValue(existingSupplier);

                    PurchaseService.PurchaseOrderDetail detail = purchaseService.getPurchaseOrderById(existingPo.id());
                    for (PurchaseOrderItem item : detail.items()) {
                        variantRepository.findVariantByIdSync(item.variantId()).ifPresent(v -> {
                            PurchaseItemRow row = new PurchaseItemRow(v);
                            row.setQuantity(item.quantity());
                            row.setUnitCost(item.unitCost());
                            if (isView) row.disableInputs();
                            itemRows.add(row);
                            itemsBox.getChildren().add(row.getRow());
                        });
                    }
                }
                if (totalCostLabel != null) recalculateTotal();
            } catch (Exception e) {
                NotificationService.error("Failed to load data for PO Form");
            }
        });
    }

    private void makeSupplierComboSearchable(List<Supplier> allSuppliers) {
        supplierCombo.setItems(FXCollections.observableArrayList(allSuppliers));
        supplierCombo.setConverter(new javafx.util.StringConverter<Supplier>() {
            @Override
            public String toString(Supplier s) { return s == null ? "" : s.name(); }
            @Override
            public Supplier fromString(String string) {
                return allSuppliers.stream().filter(s -> s.name().equals(string)).findFirst().orElse(null);
            }
        });
        supplierCombo.setEditable(true);
        supplierCombo.getEditor().textProperty().addListener((obs, oldV, newV) -> {
            if (newV == null || newV.isEmpty()) {
                supplierCombo.setItems(FXCollections.observableArrayList(allSuppliers));
            } else {
                Supplier selected = supplierCombo.getSelectionModel().getSelectedItem();
                if (selected != null && selected.name().equals(newV)) return;
                
                List<Supplier> filtered = allSuppliers.stream()
                        .filter(s -> s.name().toLowerCase().contains(newV.toLowerCase()))
                        .toList();
                supplierCombo.setItems(FXCollections.observableArrayList(filtered));
                if (!filtered.isEmpty()) supplierCombo.show();
            }
        });
    }

    private void recalculateTotal() {
        BigDecimal total = BigDecimal.ZERO;
        for (PurchaseItemRow row : itemRows) {
            BigDecimal cost = row.getUnitCost();
            BigDecimal qty = new BigDecimal(row.getQuantity());
            total = total.add(cost.multiply(qty));
        }
        final BigDecimal finalTotal = total;
        Platform.runLater(() -> {
            if (totalCostLabel != null) {
                totalCostLabel.setText(String.format("$%.2f", finalTotal));
            }
        });
    }

    private void addVariantToCart(Variant variant) {
        for (PurchaseItemRow row : itemRows) {
            if (row.getVariantId() != null && row.getVariantId().equals(variant.id())) {
                row.setQuantity(row.getQuantity() + 1);
                recalculateTotal();
                return;
            }
        }
        PurchaseItemRow row = new PurchaseItemRow(variant);
        itemRows.add(row);
        itemsBox.getChildren().add(row.getRow());
        recalculateTotal();
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
        private Variant variant;
        private TextField quantityField;
        private TextField costField;
        private HBox row;
        private Button removeBtn;
        
        PurchaseItemRow(Variant variant) {
            this.variant = variant;
            
            Label variantNameLabel = new Label(variant.productName() + " - " + variant.name() + " (" + variant.sku() + ")");
            variantNameLabel.setPrefWidth(250);
            
            quantityField = new TextField("1");
            quantityField.setPromptText("Qty");
            quantityField.setPrefWidth(60);
            quantityField.textProperty().addListener((o, old, val) -> recalculateTotal());
            
            costField = new TextField(variant.costPrice() != null ? variant.costPrice().toString() : "0.00");
            costField.setPromptText("Cost");
            costField.setPrefWidth(80);
            costField.textProperty().addListener((o, old, val) -> recalculateTotal());
            
            removeBtn = new Button("x");
            removeBtn.setStyle("-fx-text-fill: red; -fx-background-color: transparent; -fx-cursor: hand; -fx-font-weight: bold;");
            removeBtn.setOnAction(e -> {
                itemRows.remove(this);
                itemsBox.getChildren().remove(row);
                recalculateTotal();
            });
            
            row = new HBox(10, variantNameLabel, quantityField, costField, removeBtn);
            row.setAlignment(javafx.geometry.Pos.CENTER_LEFT);
        }
        
        void disableInputs() {
            quantityField.setDisable(true);
            costField.setDisable(true);
            removeBtn.setVisible(false);
        }
        
        HBox getRow() { return row; }
        
        void setQuantity(int qty) { quantityField.setText(String.valueOf(qty)); }
        void setUnitCost(BigDecimal cost) { costField.setText(cost.toString()); }
        
        Long getVariantId() { return variant != null ? variant.id() : null; }
        
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
