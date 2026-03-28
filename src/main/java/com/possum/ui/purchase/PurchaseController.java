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
import javafx.geometry.Pos;
import javafx.scene.control.*;
import javafx.scene.layout.HBox;
import javafx.scene.paint.Color;
import javafx.scene.shape.Circle;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import com.possum.shared.util.TimeUtil;
import java.util.HashMap;
import java.util.Map;

public class PurchaseController {
    
    @FXML private FilterBar filterBar;
    @FXML private DataTableView<PurchaseOrder> purchaseTable;
    @FXML private PaginationBar paginationBar;
    @FXML private javafx.scene.control.Button createButton;
    
    private PurchaseService purchaseService;
    private WorkspaceManager workspaceManager;
    private String currentSearch = "";
    private String currentStatus = null;
    private java.time.LocalDate currentFromDate = null;
    private java.time.LocalDate currentToDate = null;

    public PurchaseController(PurchaseService purchaseService, WorkspaceManager workspaceManager) {
        this.purchaseService = purchaseService;
        this.workspaceManager = workspaceManager;
    }

    @FXML
    public void initialize() {
        if (createButton != null) {
            com.possum.ui.common.UIPermissionUtil.requirePermission(createButton, com.possum.application.auth.Permissions.PURCHASE_MANAGE);
        }
        setupTable();
        setupFilters();
        loadPurchaseOrders();
    }

    private void setupTable() {
        TableColumn<PurchaseOrder, String> idCol = new TableColumn<>("PO Number");
        idCol.setCellValueFactory(cellData -> new SimpleStringProperty("#" + cellData.getValue().id()));
        idCol.setPrefWidth(100);
        idCol.setCellFactory(col -> new TableCell<>() {
            @Override
            protected void updateItem(String item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || item == null) {
                    setText(null);
                } else {
                    setText(item);
                    setStyle("-fx-font-weight: bold; -fx-text-fill: #1976d2;");
                }
            }
        });
        
        TableColumn<PurchaseOrder, String> supplierCol = new TableColumn<>("Supplier");
        supplierCol.setCellValueFactory(cellData -> new SimpleStringProperty(cellData.getValue().supplierName()));
        supplierCol.setPrefWidth(200);
        supplierCol.setCellFactory(col -> new TableCell<>() {
            @Override
            protected void updateItem(String item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || item == null) {
                    setText(null);
                } else {
                    setText(item);
                    setStyle("-fx-font-weight: bold;");
                }
            }
        });
        
        TableColumn<PurchaseOrder, LocalDateTime> dateCol = new TableColumn<>("Order Date");
        dateCol.setCellValueFactory(cellData -> new SimpleObjectProperty<>(TimeUtil.toLocal(cellData.getValue().orderDate())));
        dateCol.setPrefWidth(150);
        dateCol.setCellFactory(col -> new TableCell<>() {
            @Override
            protected void updateItem(LocalDateTime item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || item == null) {
                    setText(null);
                } else {
                    setText(TimeUtil.formatStandard(item));
                    setStyle("-fx-text-fill: gray;");
                }
            }
        });
        
        TableColumn<PurchaseOrder, Integer> itemsCol = new TableColumn<>("Items");
        itemsCol.setCellValueFactory(cellData -> new SimpleObjectProperty<>(cellData.getValue().itemCount()));
        itemsCol.setPrefWidth(80);
        itemsCol.setStyle("-fx-alignment: CENTER;");
        
        TableColumn<PurchaseOrder, String> statusCol = new TableColumn<>("Status");
        statusCol.setCellValueFactory(cellData -> new SimpleStringProperty(cellData.getValue().status()));
        statusCol.setPrefWidth(120);
        statusCol.setCellFactory(col -> new TableCell<>() {
            @Override
            protected void updateItem(String item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || item == null) {
                    setGraphic(null);
                } else {
                    HBox box = new HBox(5);
                    box.setAlignment(Pos.CENTER);
                    
                    Circle indicator = new Circle(4);
                    Label label = new Label(item.toUpperCase());
                    label.setStyle("-fx-font-size: 10px; -fx-font-weight: bold;");
                    
                    switch (item.toLowerCase()) {
                        case "pending" -> {
                            indicator.setFill(Color.ORANGE);
                            label.setStyle(label.getStyle() + "-fx-text-fill: orange;");
                        }
                        case "received" -> {
                            indicator.setFill(Color.GREEN);
                            label.setStyle(label.getStyle() + "-fx-text-fill: green;");
                        }
                        case "cancelled" -> {
                            indicator.setFill(Color.RED);
                            label.setStyle(label.getStyle() + "-fx-text-fill: red;");
                        }
                    }
                    
                    box.getChildren().addAll(indicator, label);
                    setGraphic(box);
                }
            }
        });
        
        purchaseTable.getTableView().getColumns().addAll(idCol, supplierCol, dateCol, itemsCol, statusCol);
        purchaseTable.addActionColumn("Actions", this::showActions);
    }

    private void setupFilters() {
        ComboBox<String> statusFilter = filterBar.addFilter("status", "Filter by Status");
        statusFilter.setItems(FXCollections.observableArrayList("pending", "received", "cancelled"));
        
        filterBar.addDateFilter("fromDate", "From Date");
        filterBar.addDateFilter("toDate", "To Date");

        filterBar.setOnFilterChange(filters -> {
            currentSearch = (String) filters.get("search");
            currentStatus = (String) filters.get("status");
            currentFromDate = (java.time.LocalDate) filters.get("fromDate");
            currentToDate = (java.time.LocalDate) filters.get("toDate");
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
                    currentStatus,
                    currentFromDate != null ? currentFromDate.atStartOfDay().toString() : null,
                    currentToDate != null ? currentToDate.atTime(23, 59, 59).toString() : null,
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
    private void handleRefresh() {
        loadPurchaseOrders();
    }

    @FXML
    private void handleCreate() {
        Map<String, Object> params = new HashMap<>();
        params.put("onSave", (Runnable) this::loadPurchaseOrders);
        workspaceManager.openWindow("Create Purchase Order", "/fxml/purchase/purchase-order-form-view.fxml", params);
    }

    private void showActions(PurchaseOrder po) {
        ContextMenu menu = new ContextMenu();
        
        MenuItem viewItem = new MenuItem("👁 View Details");
        viewItem.setOnAction(e -> handleView(po));
        menu.getItems().add(viewItem);
        
        if ("pending".equals(po.status())) {
            MenuItem editItem = new MenuItem("✏ Edit Order");
            editItem.setOnAction(e -> handleEdit(po));
            
            MenuItem receiveItem = new MenuItem("✅ Receive Order");
            receiveItem.setStyle("-fx-text-fill: green;");
            receiveItem.setOnAction(e -> handleReceive(po));
            
            MenuItem cancelItem = new MenuItem("❌ Cancel Order");
            cancelItem.setStyle("-fx-text-fill: red;");
            cancelItem.setOnAction(e -> handleCancelOrder(po));
            
            menu.getItems().addAll(new SeparatorMenuItem(), editItem, receiveItem, new SeparatorMenuItem(), cancelItem);
        }
        
        MenuItem refreshItem = new MenuItem("⟳ Refresh List");
        refreshItem.setOnAction(e -> loadPurchaseOrders());
        menu.getItems().addAll(new SeparatorMenuItem(), refreshItem);
        
        menu.show(purchaseTable.getTableView().getScene().getWindow());
    }

    private void handleView(PurchaseOrder po) {
        Map<String, Object> params = new HashMap<>();
        params.put("orderId", po.id());
        params.put("onAction", (Runnable) this::loadPurchaseOrders);
        workspaceManager.openWindow("Purchase Order PO-" + po.id(), "/fxml/purchase/purchase-order-detail-view.fxml", params);
    }
    
    private void handleCancelOrder(PurchaseOrder po) {
        Alert confirm = new Alert(Alert.AlertType.CONFIRMATION);
        confirm.setTitle("Cancel Purchase Order");
        confirm.setHeaderText("Cancel PO #" + po.id() + "?");
        confirm.setContentText("This action cannot be undone.");
        
        confirm.showAndWait().ifPresent(response -> {
            if (response == ButtonType.OK) {
                try {
                    long userId = AuthContext.getCurrentUser().id();
                    purchaseService.cancelPurchaseOrder(po.id(), userId);
                    NotificationService.success("Purchase order cancelled");
                    loadPurchaseOrders();
                } catch (Exception e) {
                    NotificationService.error("Failed to cancel: " + e.getMessage());
                }
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
