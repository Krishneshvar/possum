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
import com.possum.ui.common.controls.DataTableView;
import com.possum.ui.common.controls.NotificationService;
import javafx.beans.property.SimpleObjectProperty;
import javafx.beans.property.SimpleStringProperty;
import javafx.collections.FXCollections;
import javafx.fxml.FXML;
import javafx.scene.control.TableCell;
import javafx.scene.control.TableColumn;
import javafx.scene.control.Label;
import javafx.scene.layout.VBox;
import java.math.BigDecimal;
import java.text.NumberFormat;
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
    
    @FXML private DataTableView<SaleItem> itemsTable;
    @FXML private VBox returnedItemsContainer;
    @FXML private DataTableView<SaleItem> returnedItemsTable;
    
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
        TableColumn<SaleItem, String> productCol = new TableColumn<>("Product / Variant");
        TableColumn<SaleItem, String> skuCol = new TableColumn<>("SKU");
        TableColumn<SaleItem, Integer> qtyCol = new TableColumn<>("Qty");
        TableColumn<SaleItem, BigDecimal> priceCol = new TableColumn<>("Unit Price");
        TableColumn<SaleItem, BigDecimal> taxCol = new TableColumn<>("Tax");
        TableColumn<SaleItem, BigDecimal> discountCol = new TableColumn<>("Discount");
        TableColumn<SaleItem, BigDecimal> totalCol = new TableColumn<>("Line Total");
        
        itemsTable.getTableView().getColumns().setAll(productCol, skuCol, qtyCol, priceCol, taxCol, discountCol, totalCol);
        itemsTable.setEmptyMessage("No active items in this bill");

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
        TableColumn<SaleItem, String> retProductCol = new TableColumn<>("Product / Variant");
        TableColumn<SaleItem, String> retSkuCol = new TableColumn<>("SKU");
        TableColumn<SaleItem, Integer> retQtyCol = new TableColumn<>("Returned Qty");
        TableColumn<SaleItem, BigDecimal> retPriceCol = new TableColumn<>("Unit Price");
        TableColumn<SaleItem, BigDecimal> retRefundCol = new TableColumn<>("Refund Amount");

        returnedItemsTable.getTableView().getColumns().setAll(retProductCol, retSkuCol, retQtyCol, retPriceCol, retRefundCol);
        returnedItemsTable.setEmptyMessage("No returned items recorded");

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
        
        BigDecimal lineItemDiscount = saleDetails.items().stream()
                .map(i -> i.discountAmount() != null ? i.discountAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal billDiscount = currentSale.discount() != null ? currentSale.discount() : BigDecimal.ZERO;
        BigDecimal totalDiscount = lineItemDiscount.add(billDiscount);
        
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
        try {
            java.util.List<com.possum.domain.model.PaymentMethod> methods = salesService.getPaymentMethods();
            if (methods.isEmpty()) {
                NotificationService.warning("No payment methods available");
                return;
            }

            javafx.scene.control.ChoiceDialog<com.possum.domain.model.PaymentMethod> dialog = new javafx.scene.control.ChoiceDialog<>(
                methods.get(0), methods
            );
            dialog.setTitle("Change Payment Method");
            dialog.setHeaderText("Correcting Payment Method for #" + currentSale.invoiceNumber());
            dialog.setContentText("Select the correct payment method:");
            dialog.initOwner(itemsTable.getScene().getWindow());

            // Get current method to pre-select
            long currentMethodId = saleDetails.transactions().stream()
                    .filter(t -> "payment".equals(t.type()))
                    .map(com.possum.domain.model.Transaction::paymentMethodId)
                    .findFirst()
                    .orElse(-1L);
            
            methods.stream()
                .filter(m -> m.id() == currentMethodId)
                .findFirst()
                .ifPresent(dialog::setSelectedItem);

            dialog.showAndWait().ifPresent(newMethod -> {
                try {
                    com.possum.application.auth.AuthUser currentUser = com.possum.application.auth.AuthContext.getCurrentUser();
                    salesService.changeSalePaymentMethod(currentSale.id(), newMethod.id(), currentUser.id());
                    NotificationService.success("Payment method updated to " + newMethod.name());
                    loadSaleDetails(); // Refresh view
                } catch (Exception e) {
                    NotificationService.error("Failed to update payment method: " + e.getMessage());
                }
            });
        } catch (Exception e) {
            NotificationService.error("Error: " + e.getMessage());
        }
    }

    @FXML
    private void handleReturn() {
        Map<String, Object> params = Map.of("invoiceNumber", currentSale.invoiceNumber());
        workspaceManager.openDialog("Process Return", "/fxml/returns/create-return-dialog.fxml", params);
        loadSaleDetails();
    }
}
