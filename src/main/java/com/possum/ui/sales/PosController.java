package com.possum.ui.sales;

import com.possum.application.auth.AuthContext;
import com.possum.application.sales.SalesService;
import com.possum.application.sales.TaxEngine;
import com.possum.application.sales.dto.*;
import com.possum.domain.model.Customer;
import com.possum.domain.model.PaymentMethod;
import com.possum.domain.model.Variant;
import com.possum.infrastructure.printing.PrinterService;
import com.possum.ui.common.controls.NotificationService;
import javafx.application.Platform;
import javafx.beans.property.*;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.fxml.FXML;
import javafx.scene.control.*;
import javafx.scene.layout.*;
import javafx.scene.paint.Color;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.NumberFormat;
import java.util.*;

public class PosController {

    @FXML private TableView<CartItem> cartTable;
    @FXML private TableColumn<CartItem, Integer> colSno;
    @FXML private TableColumn<CartItem, String> colProduct;
    @FXML private TableColumn<CartItem, CartItem> colQty;
    @FXML private TableColumn<CartItem, String> colPrice;
    @FXML private TableColumn<CartItem, String> colDiscount;
    @FXML private TableColumn<CartItem, String> colTotal;
    @FXML private TableColumn<CartItem, CartItem> colAction;

    @FXML private TextField searchField;
    @FXML private Label totalQtyLabel;
    @FXML private Label bottomTotalLabel;

    @FXML private ComboBox<Customer> customerCombo;
    @FXML private ComboBox<PaymentMethod> paymentMethodCombo;
    
    @FXML private ToggleButton btnFullPayment;
    @FXML private ToggleButton btnPartialPayment;
    @FXML private TextField discountField;
    @FXML private ToggleButton btnDiscountFixed;
    @FXML private ToggleButton btnDiscountPercent;

    @FXML private Label subtotalLabel;
    @FXML private Label taxLabel;
    @FXML private Label totalLabel;

    @FXML private TextField tenderedField;
    @FXML private Label balanceTypeLabel;
    @FXML private Label balanceLabel;
    
    @FXML private Button completeButton;
    @FXML private FlowPane billsFlowPane;

    private final SalesService salesService;
    private final ProductSearchIndex searchIndex;
    private final TaxEngine taxEngine;
    private final PrinterService printerService;
    
    private final NumberFormat currencyFormat = NumberFormat.getCurrencyInstance(Locale.US);

    private static final int MAX_BILLS = 9;
    private final List<BillState> bills = new ArrayList<>();
    private BillState currentBill;

    public PosController(SalesService salesService, ProductSearchIndex searchIndex,
                          TaxEngine taxEngine, PrinterService printerService) {
        this.salesService = salesService;
        this.searchIndex = searchIndex;
        this.taxEngine = taxEngine;
        this.printerService = printerService;
    }

    @FXML
    public void initialize() {
        // Init Bills
        for (int i = 0; i < MAX_BILLS; i++) {
            bills.add(new BillState(i));
        }
        currentBill = bills.get(0);

        setupTable();
        loadCombos();
        setupBillingToggles();
        setupListeners();
        renderBillsFlowPane();
        switchBill(0);
        
        Platform.runLater(() -> {
            cartTable.getScene().setOnKeyPressed(e -> {
                if (e.isControlDown() || e.isMetaDown()) {
                    if (e.getCode().isDigitKey()) {
                        int digit = e.getText().charAt(0) - '1';
                        if (digit >= 0 && digit < MAX_BILLS) {
                            switchBill(digit);
                        }
                    } else if (e.getCode().toString().equals("K")) { // Ctrl+K
                        searchField.requestFocus();
                    }
                }
            });
        });
    }

    private void setupTable() {
        colSno.setCellValueFactory(cell -> new SimpleIntegerProperty(cartTable.getItems().indexOf(cell.getValue()) + 1).asObject());
        colProduct.setCellValueFactory(cell -> new SimpleStringProperty(
            cell.getValue().variant.productName() + " - " + cell.getValue().variant.name() + "\n" + cell.getValue().variant.sku()
        ));
        
        // Qty cell with +/-
        colQty.setCellValueFactory(cell -> new SimpleObjectProperty<>(cell.getValue()));
        colQty.setCellFactory(col -> new TableCell<>() {
            @Override
            protected void updateItem(CartItem item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || item == null) {
                    setGraphic(null);
                } else {
                    HBox box = new HBox(5);
                    box.setAlignment(javafx.geometry.Pos.CENTER);
                    Button minus = new Button("-");
                    minus.setStyle("-fx-padding: 0 4;");
                    Button plus = new Button("+");
                    plus.setStyle("-fx-padding: 0 4;");
                    Label qty = new Label(String.valueOf(item.quantity));
                    qty.setStyle("-fx-font-weight: bold;");
                    
                    minus.setOnAction(e -> adjustQuantity(item, -1));
                    plus.setOnAction(e -> adjustQuantity(item, 1));
                    
                    box.getChildren().addAll(minus, qty, plus);
                    setGraphic(box);
                }
            }
        });

        colPrice.setCellValueFactory(cell -> new SimpleStringProperty(currencyFormat.format(cell.getValue().pricePerUnit)));
        
        colDiscount.setCellValueFactory(cell -> new SimpleStringProperty(currencyFormat.format(cell.getValue().discountAmount)));
        
        colTotal.setCellValueFactory(cell -> new SimpleStringProperty(currencyFormat.format(cell.getValue().netLineTotal)));

        colAction.setCellValueFactory(cell -> new SimpleObjectProperty<>(cell.getValue()));
        colAction.setCellFactory(col -> new TableCell<>() {
            @Override
            protected void updateItem(CartItem item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || item == null) {
                    setGraphic(null);
                } else {
                    Button del = new Button("x");
                    del.setStyle("-fx-text-fill: red; -fx-background-color: transparent; -fx-cursor: hand; -fx-font-weight: bold;");
                    del.setOnAction(e -> {
                        currentBill.items.remove(item);
                        refreshCurrentBill();
                    });
                    setGraphic(del);
                }
            }
        });
    }

    private void loadCombos() {
        customerCombo.setCellFactory(lv -> new ListCell<>() {
            @Override
            protected void updateItem(Customer item, boolean empty) {
                super.updateItem(item, empty);
                setText(item == null ? "Walk-in Customer" : item.name() + " (" + item.phone() + ")");
            }
        });
        customerCombo.setButtonCell(new ListCell<>() {
            @Override
            protected void updateItem(Customer item, boolean empty) {
                super.updateItem(item, empty);
                setText(item == null || empty ? "Walk-in Customer" : item.name() + " (" + item.phone() + ")");
            }
        });
        try {
            List<Customer> customers = salesService.getAllCustomers();
            customerCombo.setItems(FXCollections.observableArrayList(customers));
        } catch (Exception e) {}

        paymentMethodCombo.setCellFactory(lv -> new ListCell<>() {
            @Override
            protected void updateItem(PaymentMethod item, boolean empty) {
                super.updateItem(item, empty);
                setText(item == null ? "Select Method" : item.name());
            }
        });
        paymentMethodCombo.setButtonCell(new ListCell<>() {
            @Override
            protected void updateItem(PaymentMethod item, boolean empty) {
                super.updateItem(item, empty);
                setText(item == null || empty ? "Select Method" : item.name());
            }
        });
        List<PaymentMethod> methods = salesService.getPaymentMethods();
        paymentMethodCombo.setItems(FXCollections.observableArrayList(methods));
        if (!methods.isEmpty()) paymentMethodCombo.setValue(methods.get(0));
    }

    private void setupBillingToggles() {
        ToggleGroup paymentTypeGroup = new ToggleGroup();
        btnFullPayment.setToggleGroup(paymentTypeGroup);
        btnPartialPayment.setToggleGroup(paymentTypeGroup);
        
        ToggleGroup discountTypeGroup = new ToggleGroup();
        btnDiscountFixed.setToggleGroup(discountTypeGroup);
        btnDiscountPercent.setToggleGroup(discountTypeGroup);

        paymentTypeGroup.selectedToggleProperty().addListener((obs, oldVal, newVal) -> {
            if (newVal == null) {
                oldVal.setSelected(true); // Prevent unselecting both
                return;
            }
            boolean isFull = newVal == btnFullPayment;
            btnFullPayment.setStyle(isFull ? "-fx-background-color: #0f172a; -fx-text-fill: white;" : "-fx-background-color: white; -fx-text-fill: #64748b;");
            btnPartialPayment.setStyle(!isFull ? "-fx-background-color: #0f172a; -fx-text-fill: white;" : "-fx-background-color: white; -fx-text-fill: #64748b;");
            currentBill.fullPayment = isFull;
            refreshCurrentBill();
        });

        discountTypeGroup.selectedToggleProperty().addListener((obs, oldVal, newVal) -> {
            if (newVal == null) {
                oldVal.setSelected(true);
                return;
            }
            boolean isFixed = newVal == btnDiscountFixed;
            btnDiscountFixed.setStyle(isFixed ? "-fx-background-color: #0f172a; -fx-text-fill: white;" : "-fx-background-color: white; -fx-text-fill: #64748b;");
            btnDiscountPercent.setStyle(!isFixed ? "-fx-background-color: #0f172a; -fx-text-fill: white;" : "-fx-background-color: white; -fx-text-fill: #64748b;");
            currentBill.isDiscountFixed = isFixed;
            recalculateTotals();
        });
    }

    private void setupListeners() {
        searchField.setOnAction(e -> {
            String query = searchField.getText().trim();
            if (query.isEmpty()) return;
            try {
                Optional<Variant> bySku = searchIndex.findBySku(query);
                if (bySku.isPresent()) {
                    addToCart(bySku.get());
                    searchField.clear();
                    return;
                }
                Optional<Variant> byBarcode = searchIndex.findByBarcode(query);
                if (byBarcode.isPresent()) {
                    addToCart(byBarcode.get());
                    searchField.clear();
                    return;
                }
                List<Variant> results = searchIndex.searchByName(query);
                if (!results.isEmpty()) {
                    addToCart(results.get(0));
                    searchField.clear();
                } else {
                    NotificationService.warning("No product found");
                }
            } catch (Exception ex) {}
        });

        discountField.textProperty().addListener((obs, oldVal, newVal) -> {
            try {
                if (newVal.isEmpty()) currentBill.overallDiscountValue = BigDecimal.ZERO;
                else currentBill.overallDiscountValue = new BigDecimal(newVal);
                recalculateTotals();
            } catch (Exception e) {}
        });

        tenderedField.textProperty().addListener((obs, oldVal, newVal) -> {
            try {
                if (newVal.isEmpty()) currentBill.amountTendered = BigDecimal.ZERO;
                else currentBill.amountTendered = new BigDecimal(newVal);
                updateBalanceLabel();
            } catch (Exception e) {}
        });

        customerCombo.valueProperty().addListener((obs, old, val) -> currentBill.selectedCustomer = val);
        paymentMethodCombo.valueProperty().addListener((obs, old, val) -> currentBill.selectedPaymentMethod = val);
    }

    private void renderBillsFlowPane() {
        billsFlowPane.getChildren().clear();
        for (int i = 0; i < MAX_BILLS; i++) {
            BillState bill = bills.get(i);
            Button btn = new Button(String.valueOf(i + 1));
            
            boolean isActive = currentBill.index == i;
            boolean hasItems = !bill.items.isEmpty();
            
            String style = "-fx-font-weight: bold; -fx-background-radius: 8; -fx-border-radius: 8; -fx-min-width: 32; -fx-min-height: 32; ";
            if (isActive) {
                style += "-fx-background-color: #0f172a; -fx-text-fill: white; -fx-border-color: #0f172a; -fx-border-width: 2;";
            } else if (hasItems) {
                style += "-fx-background-color: #fef3c7; -fx-text-fill: #d97706; -fx-border-color: #fcd34d; -fx-border-width: 1;";
            } else {
                style += "-fx-background-color: transparent; -fx-text-fill: #94a3b8; -fx-border-color: transparent;";
            }
            btn.setStyle(style);
            
            int idx = i;
            btn.setOnAction(e -> switchBill(idx));
            billsFlowPane.getChildren().add(btn);
        }
    }

    private void switchBill(int index) {
        currentBill = bills.get(index);
        
        cartTable.setItems(currentBill.items);
        btnFullPayment.setSelected(currentBill.fullPayment);
        btnPartialPayment.setSelected(!currentBill.fullPayment);
        discountField.setText(currentBill.overallDiscountValue.compareTo(BigDecimal.ZERO) > 0 ? currentBill.overallDiscountValue.toString() : "");
        btnDiscountFixed.setSelected(currentBill.isDiscountFixed);
        btnDiscountPercent.setSelected(!currentBill.isDiscountFixed);
        tenderedField.setText(currentBill.amountTendered.compareTo(BigDecimal.ZERO) > 0 ? currentBill.amountTendered.toString() : "");
        customerCombo.setValue(currentBill.selectedCustomer);
        if (currentBill.selectedPaymentMethod != null) paymentMethodCombo.setValue(currentBill.selectedPaymentMethod);
        
        refreshCurrentBill();
    }

    private void addToCart(Variant variant) {
        Optional<CartItem> existing = currentBill.items.stream()
            .filter(item -> item.variant.id().equals(variant.id()))
            .findFirst();
        
        if (existing.isPresent()) {
            existing.get().quantity++;
        } else {
            currentBill.items.add(new CartItem(variant, 1));
        }
        
        refreshCurrentBill();
    }

    private void adjustQuantity(CartItem item, int delta) {
        item.quantity += delta;
        if (item.quantity <= 0) {
            currentBill.items.remove(item);
        }
        refreshCurrentBill();
    }

    private void refreshCurrentBill() {
        cartTable.refresh();
        renderBillsFlowPane();
        recalculateTotals();
    }

    private void recalculateTotals() {
        BigDecimal subtotal = BigDecimal.ZERO;
        int qty = 0;
        
        for (CartItem item : currentBill.items) {
            BigDecimal lineTotal = item.pricePerUnit.multiply(BigDecimal.valueOf(item.quantity));
            BigDecimal lineDiscount = item.discountType.equals("fixed") ? item.discountValue : lineTotal.multiply(item.discountValue).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            item.discountAmount = lineDiscount;
            item.netLineTotal = lineTotal.subtract(lineDiscount).max(BigDecimal.ZERO);
            
            subtotal = subtotal.add(item.netLineTotal);
            qty += item.quantity;
        }
        
        currentBill.subtotal = subtotal;
        
        BigDecimal overallDiscountAmount = BigDecimal.ZERO;
        if (currentBill.overallDiscountValue.compareTo(BigDecimal.ZERO) > 0) {
            if (currentBill.isDiscountFixed) {
                overallDiscountAmount = currentBill.overallDiscountValue;
            } else {
                overallDiscountAmount = subtotal.multiply(currentBill.overallDiscountValue).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            }
        }
        
        BigDecimal amountAfterTax = subtotal.subtract(overallDiscountAmount).max(BigDecimal.ZERO);
        // Note: Simple Tax for UI preview
        BigDecimal taxAmount = amountAfterTax.multiply(new BigDecimal("0.10")); // Assuming 10%
        currentBill.taxAmount = taxAmount;
        currentBill.total = amountAfterTax.add(taxAmount);
        
        subtotalLabel.setText(currencyFormat.format(currentBill.subtotal));
        taxLabel.setText(currencyFormat.format(currentBill.taxAmount));
        totalLabel.setText(currencyFormat.format(currentBill.total));
        bottomTotalLabel.setText(currencyFormat.format(currentBill.total));
        totalQtyLabel.setText(String.valueOf(qty));
        
        updateBalanceLabel();
    }

    private void updateBalanceLabel() {
        BigDecimal diff = currentBill.amountTendered.subtract(currentBill.total);
        if (diff.compareTo(BigDecimal.ZERO) >= 0) {
            balanceTypeLabel.setText("Change");
            balanceTypeLabel.setTextFill(Color.web("#16a34a")); // success
            balanceLabel.setText(currencyFormat.format(diff));
            balanceLabel.setStyle("-fx-background-color: #dcfce7; -fx-text-fill: #16a34a; -fx-border-color: #bbf7d0; -fx-border-radius: 6; -fx-padding: 7 10; -fx-font-weight: bold; -fx-font-size: 14px;");
        } else {
            balanceTypeLabel.setText("Balance");
            balanceTypeLabel.setTextFill(Color.web("#64748b"));
            balanceLabel.setText(currencyFormat.format(diff.abs()));
            balanceLabel.setStyle("-fx-background-color: #f1f5f9; -fx-text-fill: #64748b; -fx-border-color: #e2e8f0; -fx-border-radius: 6; -fx-padding: 7 10; -fx-font-weight: bold; -fx-font-size: 14px;");
        }

        if (!currentBill.items.isEmpty() && currentBill.selectedPaymentMethod != null) {
            boolean validPayment;
            if (currentBill.fullPayment) {
                validPayment = currentBill.amountTendered.compareTo(currentBill.total) >= 0;
            } else {
                validPayment = currentBill.amountTendered.compareTo(BigDecimal.ZERO) > 0;
            }
            completeButton.setDisable(!validPayment);
        } else {
            completeButton.setDisable(true);
        }
    }

    @FXML
    private void handleCompleteSale() {
        if (currentBill.items.isEmpty()) return;
        
        try {
            List<CreateSaleItemRequest> items = currentBill.items.stream()
                .map(item -> new CreateSaleItemRequest(
                    item.variant.id(),
                    item.quantity,
                    item.discountAmount,
                    item.pricePerUnit
                ))
                .toList();
            
            BigDecimal discount = currentBill.isDiscountFixed ? currentBill.overallDiscountValue : currentBill.subtotal.multiply(currentBill.overallDiscountValue).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            BigDecimal paidAmt = currentBill.fullPayment ? currentBill.total : currentBill.amountTendered;

            CreateSaleRequest request = new CreateSaleRequest(
                items,
                currentBill.selectedCustomer != null ? currentBill.selectedCustomer.id() : null,
                discount.compareTo(BigDecimal.ZERO) > 0 ? discount : null,
                List.of(new PaymentRequest(paidAmt, currentBill.selectedPaymentMethod.id()))
            );
            
            long userId = AuthContext.getCurrentUser().id();
            SaleResponse response = salesService.createSale(request, userId);
            
            printReceipt(response);
            
            NotificationService.success("Sale completed successfully! Total: " + currencyFormat.format(currentBill.total));
            handleClearCart();
            
        } catch (Exception e) {
            NotificationService.error("Sale failed: " + e.getMessage());
        }
    }

    private void printReceipt(SaleResponse sale) {
        StringBuilder html = new StringBuilder("<html><body style='font-family: monospace;'>");
        html.append("<h2>RECEIPT</h2>");
        html.append("<p>Invoice: ").append(sale.sale().invoiceNumber()).append("</p>");
        html.append("<p>Date: ").append(sale.sale().saleDate()).append("</p>");
        html.append("<hr>");
        for (var item : sale.items()) {
            html.append("<p>").append(item.quantity()).append(" x Item - ")
                .append(currencyFormat.format(item.pricePerUnit())).append("</p>");
        }
        html.append("<hr>");
        html.append("<p>Total: ").append(currencyFormat.format(sale.sale().totalAmount())).append("</p>");
        html.append("</body></html>");
        
        printerService.printInvoice(html.toString())
            .thenAccept(success -> {
                if (!success) Platform.runLater(() -> NotificationService.warning("Print failed"));
            });
    }

    @FXML
    private void handleClearCart() {
        currentBill.reset();
        refreshCurrentBill();
        switchBill(currentBill.index);
    }

    private static class BillState {
        int index;
        ObservableList<CartItem> items = FXCollections.observableArrayList();
        Customer selectedCustomer;
        PaymentMethod selectedPaymentMethod;
        boolean fullPayment = true;
        BigDecimal overallDiscountValue = BigDecimal.ZERO;
        boolean isDiscountFixed = true;
        BigDecimal amountTendered = BigDecimal.ZERO;
        
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal taxAmount = BigDecimal.ZERO;
        BigDecimal total = BigDecimal.ZERO;
        
        BillState(int index) { this.index = index; }
        
        void reset() {
            items.clear();
            selectedCustomer = null;
            fullPayment = true;
            overallDiscountValue = BigDecimal.ZERO;
            isDiscountFixed = true;
            amountTendered = BigDecimal.ZERO;
            subtotal = BigDecimal.ZERO;
            taxAmount = BigDecimal.ZERO;
            total = BigDecimal.ZERO;
        }
    }

    private static class CartItem {
        Variant variant;
        int quantity;
        BigDecimal pricePerUnit;
        String discountType = "fixed"; // fixed or pct
        BigDecimal discountValue = BigDecimal.ZERO;
        BigDecimal discountAmount = BigDecimal.ZERO;
        BigDecimal netLineTotal = BigDecimal.ZERO;
        
        CartItem(Variant variant, int quantity) {
            this.variant = variant;
            this.quantity = quantity;
            this.pricePerUnit = variant.price();
        }
    }
}
