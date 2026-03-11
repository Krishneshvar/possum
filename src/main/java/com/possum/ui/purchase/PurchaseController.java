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
import com.possum.shared.dto.PurchaseOrderFilter;
import com.possum.ui.common.controls.*;
import javafx.application.Platform;
import javafx.collections.FXCollections;
import javafx.fxml.FXML;
import javafx.beans.property.SimpleObjectProperty;
import javafx.beans.property.SimpleStringProperty;
import javafx.beans.property.SimpleIntegerProperty;
import javafx.geometry.Insets;
import javafx.scene.control.*;
import javafx.scene.control.cell.PropertyValueFactory;
import javafx.scene.layout.HBox;
import javafx.scene.layout.VBox;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDateTime;
import java.util.*;

public class PurchaseController {
    
    @FXML private FilterBar filterBar;
    @FXML private DataTableView<PurchaseOrder> purchaseTable;
    @FXML private PaginationBar paginationBar;
    
    private PurchaseService purchaseService;
    private SupplierRepository supplierRepository;
    private VariantRepository variantRepository;
    private String currentSearch = "";
    private final NumberFormat currencyFormat = NumberFormat.getCurrencyInstance(Locale.US);

    public PurchaseController(PurchaseService purchaseService, SupplierRepository supplierRepository,
                          VariantRepository variantRepository) {
this.purchaseService = purchaseService;
        this.supplierRepository = supplierRepository;
        this.variantRepository = variantRepository;
    }

    @FXML
    public void initialize() {
        
        setupTable();
        setupFilters();
        loadPurchaseOrders();
    }

    private void setupTable() {
        TableColumn<PurchaseOrder, String> supplierCol = new TableColumn<>("Supplier");
        supplierCol.setCellValueFactory(cellData -> new SimpleStringProperty(cellData.getValue().supplierName()));
        
        TableColumn<PurchaseOrder, String> statusCol = new TableColumn<>("Status");
        statusCol.setCellValueFactory(cellData -> new SimpleStringProperty(cellData.getValue().status()));
        
        TableColumn<PurchaseOrder, LocalDateTime> dateCol = new TableColumn<>("Order Date");
        dateCol.setCellValueFactory(cellData -> new SimpleObjectProperty<>(cellData.getValue().orderDate()));
        
        TableColumn<PurchaseOrder, Integer> itemsCol = new TableColumn<>("Items");
        itemsCol.setCellValueFactory(cellData -> new SimpleObjectProperty<>(cellData.getValue().itemCount()));
        
        purchaseTable.getTableView().getColumns().addAll(supplierCol, statusCol, dateCol, itemsCol);
        
        purchaseTable.addActionColumn("Actions", this::showActions);
    }

    private void setupFilters() {
        filterBar.setOnFilterChange(filters -> {
            currentSearch = (String) filters.get("search");
            loadPurchaseOrders();
        });
        
        paginationBar.setOnPageChange((page, size) -> loadPurchaseOrders());
    }

    private void loadPurchaseOrders() {
        purchaseTable.setLoading(true);
        
        Platform.runLater(() -> {
            try {
                PurchaseOrderFilter filter = new PurchaseOrderFilter(
                    paginationBar.getCurrentPage(),
                    paginationBar.getPageSize(),
                    currentSearch.isEmpty() ? null : currentSearch,
                    null,
                    null,
                    null,
                    "order_date",
                    "DESC"
                );
                
                PagedResult<PurchaseOrder> result = purchaseService.getAllPurchaseOrders(filter);
                
                purchaseTable.setItems(FXCollections.observableArrayList(result.items()));
                paginationBar.setTotalItems(result.totalCount());
                purchaseTable.setLoading(false);
            } catch (Exception e) {
                purchaseTable.setLoading(false);
                NotificationService.error("Failed to load purchase orders");
            }
        });
    }

    @FXML
    private void handleCreate() {
        showPurchaseOrderDialog(null);
    }

    private void showActions(PurchaseOrder po) {
        Alert alert = new Alert(Alert.AlertType.CONFIRMATION);
        alert.setTitle("Purchase Order Actions");
        alert.setHeaderText("PO #" + po.id() + " - " + po.supplierName());
        alert.setContentText("Choose action:");
        
        ButtonType editBtn = new ButtonType("Edit");
        ButtonType receiveBtn = new ButtonType("Receive");
        ButtonType cancelBtn = ButtonType.CANCEL;
        
        alert.getButtonTypes().setAll(editBtn, receiveBtn, cancelBtn);
        
        alert.showAndWait().ifPresent(type -> {
            if (type == editBtn) {
                handleEdit(po);
            } else if (type == receiveBtn) {
                handleReceive(po);
            }
        });
    }

    private void showPurchaseOrderDialog(PurchaseOrder existingPo) {
        Dialog<PurchaseService.PurchaseOrderDetail> dialog = new Dialog<>();
        dialog.setTitle(existingPo == null ? "Create Purchase Order" : "Edit Purchase Order");
        
        VBox content = new VBox(10);
        content.setPadding(new Insets(20));
        
        ComboBox<Supplier> supplierCombo = new ComboBox<>();
        PagedResult<Supplier> suppliers = supplierRepository.getAllSuppliers(new com.possum.shared.dto.SupplierFilter(0, 100, null, null, "name", "ASC"));
        supplierCombo.setItems(FXCollections.observableArrayList(suppliers.items()));
        supplierCombo.setPromptText("Select supplier");
        
        VBox itemsBox = new VBox(10);
        List<PurchaseItemRow> itemRows = new ArrayList<>();
        
        Button addItemBtn = new Button("+ Add Item");
        addItemBtn.setOnAction(e -> {
            PurchaseItemRow row = new PurchaseItemRow();
            itemRows.add(row);
            itemsBox.getChildren().add(row.getRow());
        });
        
        if (existingPo != null) {
            PurchaseService.PurchaseOrderDetail detail = purchaseService.getPurchaseOrderById(existingPo.id());
            supplierCombo.setValue(suppliers.items().stream()
                .filter(s -> s.id().equals(existingPo.supplierId()))
                .findFirst().orElse(null));
            
            for (PurchaseOrderItem item : detail.items()) {
                PurchaseItemRow row = new PurchaseItemRow();
                row.setVariant(item.variantId());
                row.setQuantity(item.quantity());
                row.setUnitCost(item.unitCost());
                itemRows.add(row);
                itemsBox.getChildren().add(row.getRow());
            }
        }
        
        ScrollPane scroll = new ScrollPane(itemsBox);
        scroll.setFitToWidth(true);
        scroll.setPrefHeight(300);
        
        content.getChildren().addAll(
            new Label("Supplier:"), supplierCombo,
            new Label("Items:"), scroll, addItemBtn
        );
        
        dialog.getDialogPane().setContent(content);
        dialog.getDialogPane().getButtonTypes().addAll(ButtonType.OK, ButtonType.CANCEL);
        
        dialog.setResultConverter(btn -> {
            if (btn == ButtonType.OK) {
                try {
                    Supplier supplier = supplierCombo.getValue();
                    if (supplier == null) {
                        NotificationService.error("Select a supplier");
                        return null;
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
                        NotificationService.error("Add at least one item");
                        return null;
                    }
                    
                    long userId = AuthContext.getCurrentUser().id();
                    
                    if (existingPo == null) {
                        return purchaseService.createPurchaseOrder(supplier.id(), userId, items);
                    } else {
                        return purchaseService.updatePurchaseOrder(existingPo.id(), supplier.id(), userId, items);
                    }
                } catch (Exception e) {
                    NotificationService.error("Failed: " + e.getMessage());
                    return null;
                }
            }
            return null;
        });
        
        dialog.showAndWait().ifPresent(result -> {
            NotificationService.success("Purchase order saved");
            loadPurchaseOrders();
        });
    }

    private void handleEdit(PurchaseOrder po) {
        if (!"pending".equals(po.status())) {
            NotificationService.warning("Only pending orders can be edited");
            return;
        }
        showPurchaseOrderDialog(po);
    }

    private void handleReceive(PurchaseOrder po) {
        if (!"pending".equals(po.status())) {
            NotificationService.warning("Only pending orders can be received");
            return;
        }
        
        Alert confirm = new Alert(Alert.AlertType.CONFIRMATION);
        confirm.setTitle("Receive Purchase Order");
        confirm.setHeaderText("Receive PO #" + po.id() + "?");
        confirm.setContentText("This will create inventory lots and update stock levels.");
        
        confirm.showAndWait().ifPresent(response -> {
            if (response == ButtonType.OK) {
                try {
                    long userId = AuthContext.getCurrentUser().id();
                    purchaseService.receivePurchaseOrder(po.id(), userId);
                    NotificationService.success("Purchase order received");
                    loadPurchaseOrders();
                } catch (Exception e) {
                    NotificationService.error("Failed to receive: " + e.getMessage());
                }
            }
        });
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
            
            row = new HBox(5, variantCombo, searchBtn, quantityField, costField);
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
