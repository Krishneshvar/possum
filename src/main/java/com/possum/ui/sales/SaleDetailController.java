package com.possum.ui.sales;

import com.possum.application.sales.SalesService;
import com.possum.application.sales.dto.SaleResponse;
import com.possum.domain.model.Sale;
import com.possum.domain.model.SaleItem;
import com.possum.domain.model.Transaction;
import com.possum.infrastructure.filesystem.SettingsStore;
import com.possum.infrastructure.printing.BillRenderer;
import com.possum.infrastructure.printing.PrinterService;
import com.possum.ui.navigation.Parameterizable;
import com.possum.ui.workspace.WorkspaceManager;
import com.possum.ui.common.controls.NotificationService;
import javafx.beans.property.SimpleObjectProperty;
import javafx.beans.property.SimpleStringProperty;
import javafx.collections.FXCollections;
import javafx.fxml.FXML;
import javafx.scene.control.TableCell;
import javafx.scene.control.TableColumn;
import javafx.scene.control.Label;
import javafx.scene.control.TableView;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Priority;
import javafx.scene.layout.VBox;
import java.util.List;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.format.DateTimeFormatter;
import com.possum.shared.util.TimeUtil;
import java.util.Locale;
import java.util.Map;

public class SaleDetailController implements Parameterizable {

    @FXML private Label invoiceLabel;
    @FXML private Label statusBadge;
    @FXML private Label dateLabel;
    @FXML private Label customerNameLabel;
    @FXML private Label customerContactLabel;
    @FXML private Label paymentMethodLabel;
    @FXML private Label billerLabel;
    
    @FXML private TableView<SaleItem> itemsTable;
    @FXML private TableColumn<SaleItem, String> productCol;
    @FXML private TableColumn<SaleItem, String> skuCol;
    @FXML private TableColumn<SaleItem, Integer> qtyCol;
    @FXML private TableColumn<SaleItem, BigDecimal> priceCol;
    @FXML private TableColumn<SaleItem, BigDecimal> taxCol;
    @FXML private TableColumn<SaleItem, BigDecimal> discountCol;
    @FXML private TableColumn<SaleItem, BigDecimal> totalCol;

    @FXML private VBox returnedItemsContainer;
    @FXML private TableView<SaleItem> returnedItemsTable;
    @FXML private TableColumn<SaleItem, String> retProductCol;
    @FXML private TableColumn<SaleItem, String> retSkuCol;
    @FXML private TableColumn<SaleItem, Integer> retQtyCol;
    @FXML private TableColumn<SaleItem, BigDecimal> retPriceCol;
    @FXML private TableColumn<SaleItem, BigDecimal> retRefundCol;
    
    @FXML private Label subtotalLabel;
    @FXML private Label taxTotalLabel;
    @FXML private Label discountTotalLabel;
    @FXML private Label grandTotalLabel;
    @FXML private Label paidAmountLabel;
    @FXML private Label balanceTypeLabel;
    @FXML private Label balanceAmountLabel;
    @FXML private javafx.scene.control.Button editButton;
    @FXML private javafx.scene.control.Button returnButton;

    private final SalesService salesService;
    private final WorkspaceManager workspaceManager;
    private final SettingsStore settingsStore;
    private final PrinterService printerService;
    private final NumberFormat currencyFormat = NumberFormat.getCurrencyInstance(Locale.US);

    private Sale currentSale;
    private SaleResponse saleDetails;

    public SaleDetailController(SalesService salesService, 
                                WorkspaceManager workspaceManager,
                                SettingsStore settingsStore,
                                PrinterService printerService) {
        this.salesService = salesService;
        this.workspaceManager = workspaceManager;
        this.settingsStore = settingsStore;
        this.printerService = printerService;
    }

    @FXML
    public void initialize() {
        if (editButton != null) {
            com.possum.ui.common.UIPermissionUtil.requirePermission(editButton, com.possum.application.auth.Permissions.SALES_MANAGE);
        }
        if (returnButton != null) {
            com.possum.ui.common.UIPermissionUtil.requirePermission(returnButton, com.possum.application.auth.Permissions.SALES_REFUND);
        }
        setupActiveItemsTable();
        setupReturnedItemsTable();
    }

    private void setupActiveItemsTable() {
        productCol.setCellValueFactory(data -> new SimpleStringProperty(
            data.getValue().productName() + (data.getValue().variantName() != null ? " - " + data.getValue().variantName() : "")
        ));
        skuCol.setCellValueFactory(data -> new SimpleStringProperty(data.getValue().sku()));
        
        qtyCol.setCellValueFactory(data -> {
            SaleItem item = data.getValue();
            int activeQty = item.quantity() - (item.returnedQuantity() != null ? item.returnedQuantity() : 0);
            return new SimpleObjectProperty<>(activeQty);
        });
        
        priceCol.setCellValueFactory(data -> new SimpleObjectProperty<>(data.getValue().pricePerUnit()));
        setupCurrencyCell(priceCol);
        
        taxCol.setCellValueFactory(data -> {
            SaleItem item = data.getValue();
            int qty = item.quantity() != null ? item.quantity() : 1;
            int returned = item.returnedQuantity() != null ? item.returnedQuantity() : 0;
            int activeQty = qty - returned;
            
            BigDecimal totalTax = item.appliedTaxAmount() != null ? item.appliedTaxAmount() : BigDecimal.ZERO;
            BigDecimal unitTax = totalTax.divide(new BigDecimal(qty), 4, java.math.RoundingMode.HALF_UP);
            return new SimpleObjectProperty<>(unitTax.multiply(new BigDecimal(activeQty)));
        });
        setupCurrencyCell(taxCol);
        
        discountCol.setCellValueFactory(data -> {
            SaleItem item = data.getValue();
            int qty = item.quantity() != null ? item.quantity() : 1;
            int returned = item.returnedQuantity() != null ? item.returnedQuantity() : 0;
            int activeQty = qty - returned;
            
            BigDecimal totalDiscount = item.discountAmount() != null ? item.discountAmount() : BigDecimal.ZERO;
            BigDecimal unitDiscount = totalDiscount.divide(new BigDecimal(qty), 4, java.math.RoundingMode.HALF_UP);
            return new SimpleObjectProperty<>(unitDiscount.multiply(new BigDecimal(activeQty)));
        });
        setupCurrencyCell(discountCol);
        
        totalCol.setCellValueFactory(data -> {
            SaleItem item = data.getValue();
            int qty = item.quantity() != null ? item.quantity() : 1;
            int returned = item.returnedQuantity() != null ? item.returnedQuantity() : 0;
            int activeQty = qty - returned;
            
            BigDecimal price = item.pricePerUnit() != null ? item.pricePerUnit() : BigDecimal.ZERO;
            BigDecimal totalTax = item.appliedTaxAmount() != null ? item.appliedTaxAmount() : BigDecimal.ZERO;
            BigDecimal totalDiscount = item.discountAmount() != null ? item.discountAmount() : BigDecimal.ZERO;
            
            BigDecimal unitTax = totalTax.divide(new BigDecimal(qty), 4, java.math.RoundingMode.HALF_UP);
            BigDecimal unitDiscount = totalDiscount.divide(new BigDecimal(qty), 4, java.math.RoundingMode.HALF_UP);
            
            BigDecimal lineTotal = price.multiply(new BigDecimal(activeQty))
                .add(unitTax.multiply(new BigDecimal(activeQty)))
                .subtract(unitDiscount.multiply(new BigDecimal(activeQty)));
            return new SimpleObjectProperty<>(lineTotal);
        });
        setupCurrencyCell(totalCol);
    }

    private void setupReturnedItemsTable() {
        retProductCol.setCellValueFactory(data -> new SimpleStringProperty(
            data.getValue().productName() + (data.getValue().variantName() != null ? " - " + data.getValue().variantName() : "")
        ));
        
        retSkuCol.setCellValueFactory(data -> new SimpleStringProperty(data.getValue().sku()));
        
        retQtyCol.setCellValueFactory(data -> new SimpleObjectProperty<>(data.getValue().returnedQuantity()));
        
        retPriceCol.setCellValueFactory(data -> new SimpleObjectProperty<>(data.getValue().pricePerUnit()));
        setupCurrencyCell(retPriceCol);
        
        retRefundCol.setCellValueFactory(data -> {
            SaleItem item = data.getValue();
            BigDecimal price = item.pricePerUnit() != null ? item.pricePerUnit() : BigDecimal.ZERO;
            BigDecimal qty = BigDecimal.valueOf(item.returnedQuantity() != null ? item.returnedQuantity() : 0);
            return new SimpleObjectProperty<>(price.multiply(qty));
        });
        setupCurrencyCell(retRefundCol);
    }

    private void setupCurrencyCell(TableColumn<SaleItem, BigDecimal> column) {
        column.setCellFactory(col -> new TableCell<>() {
            @Override
            protected void updateItem(BigDecimal item, boolean empty) {
                super.updateItem(item, empty);
                setText(empty || item == null ? null : currencyFormat.format(item));
            }
        });
    }

    @Override
    public void setParameters(Map<String, Object> params) {
        if (params != null && params.containsKey("sale")) {
            this.currentSale = (Sale) params.get("sale");
            loadSaleDetails();
        }
    }

    private void loadSaleDetails() {
        try {
            this.saleDetails = salesService.getSaleDetails(currentSale.id());
            
            invoiceLabel.setText("#" + currentSale.invoiceNumber());
            statusBadge.setText(currentSale.status().toUpperCase());
            applyStatusStyle(currentSale.status());
            
            dateLabel.setText("Processed on " + TimeUtil.formatStandard(TimeUtil.toLocal(currentSale.saleDate())));
            customerNameLabel.setText(currentSale.customerName() != null ? currentSale.customerName() : "Walk-in Customer");
            customerContactLabel.setText(currentSale.customerPhone() != null ? currentSale.customerPhone() : "No contact info");
            
            billerLabel.setText("Biller: " + (currentSale.billerName() != null ? currentSale.billerName() : "System"));
            
            if (!saleDetails.transactions().isEmpty()) {
                Transaction tx = saleDetails.transactions().get(0);
                paymentMethodLabel.setText(tx.paymentMethodName() != null ? tx.paymentMethodName() : "External Payment");
            } else {
                paymentMethodLabel.setText("N/A");
            }

            java.util.List<SaleItem> activeItems = saleDetails.items().stream()
                .filter(i -> (i.quantity() - (i.returnedQuantity() != null ? i.returnedQuantity() : 0)) > 0)
                .toList();
            
            java.util.List<SaleItem> returnedItems = saleDetails.items().stream()
                .filter(i -> i.returnedQuantity() != null && i.returnedQuantity() > 0)
                .toList();

            itemsTable.setItems(FXCollections.observableArrayList(activeItems));
            returnedItemsTable.setItems(FXCollections.observableArrayList(returnedItems));
            returnedItemsContainer.setVisible(!returnedItems.isEmpty());
            returnedItemsContainer.setManaged(!returnedItems.isEmpty());
            
            updateSummary();
        } catch (Exception e) {
            NotificationService.error("Failed to load sale details: " + e.getMessage());
        }
    }

    private void applyStatusStyle(String status) {
        statusBadge.getStyleClass().removeAll("badge-success", "badge-error", "badge-warning", "badge-neutral");
        statusBadge.getStyleClass().add("badge-status");
        if ("paid".equalsIgnoreCase(status)) {
            statusBadge.getStyleClass().add("badge-success");
        } else if ("cancelled".equalsIgnoreCase(status) || "refunded".equalsIgnoreCase(status)) {
            statusBadge.getStyleClass().add("badge-error");
        } else if ("partially_refunded".equalsIgnoreCase(status) || "partially_paid".equalsIgnoreCase(status) || "draft".equalsIgnoreCase(status)) {
            statusBadge.getStyleClass().add("badge-warning");
        } else {
            statusBadge.getStyleClass().add("badge-neutral");
        }
    }

    private void updateSummary() {
        BigDecimal subtotal = saleDetails.items().stream()
                .map(i -> {
                    BigDecimal price = i.pricePerUnit() != null ? i.pricePerUnit() : BigDecimal.ZERO;
                    BigDecimal qty = BigDecimal.valueOf(i.quantity() != null ? i.quantity() : 0);
                    return price.multiply(qty);
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal totalTax = saleDetails.items().stream()
                .map(i -> i.appliedTaxAmount() != null ? i.appliedTaxAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal totalDiscount = currentSale.discount() != null ? currentSale.discount() : BigDecimal.ZERO;
        BigDecimal grandTotal = currentSale.totalAmount() != null ? currentSale.totalAmount() : BigDecimal.ZERO;
        BigDecimal paidAmount = currentSale.paidAmount() != null ? currentSale.paidAmount() : BigDecimal.ZERO;
        
        subtotalLabel.setText(currencyFormat.format(subtotal));
        taxTotalLabel.setText(currencyFormat.format(totalTax));
        discountTotalLabel.setText("-" + currencyFormat.format(totalDiscount));
        grandTotalLabel.setText(currencyFormat.format(grandTotal));
        paidAmountLabel.setText(currencyFormat.format(paidAmount));
        
        BigDecimal totalRefunded = saleDetails.transactions().stream()
                .filter(t -> "refund".equals(t.type()) && "completed".equals(t.status()))
                .map(t -> t.amount().abs())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal effectiveGrandTotal = grandTotal.subtract(totalRefunded).max(BigDecimal.ZERO);
        BigDecimal balance = paidAmount.subtract(effectiveGrandTotal);
        
        if (balance.compareTo(BigDecimal.ZERO) >= 0) {
            balanceTypeLabel.setText("Change");
            balanceAmountLabel.setText(currencyFormat.format(balance));
            balanceAmountLabel.setStyle("-fx-font-weight: 600; -fx-text-fill: #16a34a;");
        } else {
            balanceTypeLabel.setText("Due Amount");
            balanceAmountLabel.setText(currencyFormat.format(balance.abs()));
            balanceAmountLabel.setStyle("-fx-font-weight: 600; -fx-text-fill: #dc2626;");
        }
    }

    @FXML
    private void handlePrint() {
        String billHtml = BillRenderer.renderBill(saleDetails, settingsStore.loadGeneralSettings(), settingsStore.loadBillSettings());
        printerService.printInvoice(billHtml);
        NotificationService.success("Invoice sent to printer");
    }

    @FXML
    private void handleEdit() {
        // In a real POS, editing a finalized bill is usually restricted.
        // We'll provide a hint that they should create a return or void it.
        NotificationService.info("To edit a finalized bill, please process a return or void the sale.");
    }

    @FXML
    private void handleReturn() {
        // Open return dialog pre-filtered
        Map<String, Object> params = Map.of("invoiceNumber", currentSale.invoiceNumber());
        workspaceManager.openDialog("Process Return", "/fxml/returns/create-return-dialog.fxml", params);
        
        // Refresh after dialog closes
        loadSaleDetails();
    }
}
