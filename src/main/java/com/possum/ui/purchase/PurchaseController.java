package com.possum.ui.purchase;

import com.possum.application.auth.AuthContext;
import com.possum.application.purchase.PurchaseService;
import com.possum.domain.model.PurchaseOrder;
import com.possum.shared.dto.PagedResult;
import com.possum.shared.dto.PurchaseOrderFilter;
import com.possum.ui.common.controls.*;
import com.possum.ui.workspace.WorkspaceManager;
import javafx.application.Platform;
import javafx.collections.FXCollections;
import javafx.fxml.FXML;
import javafx.beans.property.SimpleObjectProperty;
import javafx.beans.property.SimpleStringProperty;
import javafx.scene.control.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

public class PurchaseController {
    
    @FXML private FilterBar filterBar;
    @FXML private DataTableView<PurchaseOrder> purchaseTable;
    @FXML private PaginationBar paginationBar;
    
    private PurchaseService purchaseService;
    private WorkspaceManager workspaceManager;
    private String currentSearch = "";

    public PurchaseController(PurchaseService purchaseService, WorkspaceManager workspaceManager) {
        this.purchaseService = purchaseService;
        this.workspaceManager = workspaceManager;
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
        Map<String, Object> params = new HashMap<>();
        params.put("onSave", (Runnable) this::loadPurchaseOrders);
        workspaceManager.openWindow("Create Purchase Order", "/fxml/purchase/purchase-order-form-view.fxml", params);
    }

    private void showActions(PurchaseOrder po) {
        Alert alert = new Alert(Alert.AlertType.CONFIRMATION);
        alert.setTitle("Purchase Order Actions");
        alert.setHeaderText("PO #" + po.id() + " - " + po.supplierName());
        alert.setContentText("Choose action:");
        
        ButtonType editBtn = new ButtonType("Edit");
        ButtonType receiveBtn = new ButtonType("Receive");
        ButtonType refreshBtn = new ButtonType("Refresh List");
        ButtonType cancelBtn = ButtonType.CANCEL;
        
        alert.getButtonTypes().setAll(editBtn, receiveBtn, refreshBtn, cancelBtn);
        
        alert.showAndWait().ifPresent(type -> {
            if (type == editBtn) {
                handleEdit(po);
            } else if (type == receiveBtn) {
                handleReceive(po);
            } else if (type == refreshBtn) {
                loadPurchaseOrders();
            }
        });
    }

    private void handleEdit(PurchaseOrder po) {
        if (!"pending".equals(po.status())) {
            NotificationService.warning("Only pending orders can be edited");
            return;
        }
        Map<String, Object> params = new HashMap<>();
        params.put("order", po);
        params.put("onSave", (Runnable) this::loadPurchaseOrders);
        workspaceManager.openWindow("Edit Purchase Order", "/fxml/purchase/purchase-order-form-view.fxml", params);
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
}
