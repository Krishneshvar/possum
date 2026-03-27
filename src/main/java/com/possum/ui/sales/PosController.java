package com.possum.ui.sales;

import com.possum.application.auth.AuthContext;
import com.possum.application.sales.SalesService;
import com.possum.application.sales.TaxEngine;
import com.possum.application.sales.dto.*;
import com.possum.domain.model.Customer;
import com.possum.domain.model.PaymentMethod;
import com.possum.domain.model.Variant;
import com.possum.infrastructure.filesystem.SettingsStore;
import com.possum.infrastructure.printing.BillRenderer;
import com.possum.infrastructure.printing.PrinterService;
import com.possum.ui.common.dialogs.BillPreviewDialog;
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
import java.util.Locale;
import java.util.Collections;
import javafx.beans.binding.Bindings;
import javafx.scene.input.KeyEvent;
import javafx.stage.Popup;
import javafx.scene.input.KeyCode;

public class PosController {

    @FXML private VBox leftVBox;
    @FXML private TableView<CartItem> cartTable;
    @FXML private TableColumn<CartItem, String> colSno;
    @FXML private TableColumn<CartItem, String> colSku;
    @FXML private TableColumn<CartItem, String> colProduct;
    @FXML private TableColumn<CartItem, CartItem> colQty;
    @FXML private TableColumn<CartItem, CartItem> colPrice;
    @FXML private TableColumn<CartItem, CartItem> colDiscount;
    @FXML private TableColumn<CartItem, String> colTotal;
    @FXML private TableColumn<CartItem, String> colMrp;

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
    @FXML private StackPane rootPane;

    private Popup searchPopup = new Popup();
    private ListView<Variant> searchResultsView = new ListView<>();

    private final SalesService salesService;
    private final ProductSearchIndex searchIndex;
    private final TaxEngine taxEngine;
    private final PrinterService printerService;
    private final SettingsStore settingsStore;
    
    private final NumberFormat currencyFormat = NumberFormat.getCurrencyInstance(Locale.US);

    private static final int MAX_BILLS = 9;
    private final List<BillState> bills = new ArrayList<>();
    private BillState currentBill;

    public PosController(SalesService salesService, ProductSearchIndex searchIndex,
                          TaxEngine taxEngine, PrinterService printerService, SettingsStore settingsStore) {
        this.salesService = salesService;
        this.searchIndex = searchIndex;
        this.taxEngine = taxEngine;
        this.printerService = printerService;
        this.settingsStore = settingsStore;
    }

    @FXML
    public void initialize() {
        if (completeButton != null) {
            com.possum.ui.common.UIPermissionUtil.requirePermission(completeButton, com.possum.application.auth.Permissions.SALES_CREATE);
        }

        // Init Bills
        for (int i = 0; i < MAX_BILLS; i++) {
            bills.add(new BillState(i));
        }
        currentBill = bills.get(0);

        NotificationService.initialize(rootPane);
        setupTable();
        setupListeners();
        loadCombos();
        setupBillingToggles();
        
        // Cap left side at 75% of viewpoint
        Platform.runLater(() -> {
            if (rootPane.getScene() != null) {
                leftVBox.maxHeightProperty().bind(rootPane.heightProperty().multiply(0.75));
            }
        });

    renderBillsFlowPane();
        switchBill(0);
        taxEngine.init();
        setupSearchAutocomplete();
        
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
        colSno.setCellValueFactory(cell -> new SimpleStringProperty(String.valueOf(cartTable.getItems().indexOf(cell.getValue()) + 1)));
        
        colSku.setCellValueFactory(cell -> new SimpleStringProperty(cell.getValue().variant.sku()));
        
        colProduct.setCellValueFactory(cell -> new SimpleStringProperty(cell.getValue().variant.productName()));
        
        colQty.setCellValueFactory(cell -> new SimpleObjectProperty<>(cell.getValue()));
        colQty.setEditable(true);
        colQty.setCellFactory(col -> new EditableQuantityCell());

        colPrice.setCellValueFactory(cell -> new SimpleObjectProperty<>(cell.getValue()));
        colPrice.setEditable(true);
        colPrice.setCellFactory(col -> new EditablePriceCell());
        
        colMrp.setCellValueFactory(cell -> new SimpleStringProperty(currencyFormat.format(cell.getValue().variant.price())));

        colDiscount.setCellValueFactory(cell -> new SimpleObjectProperty<>(cell.getValue()));
        colDiscount.setEditable(true);
        colDiscount.setCellFactory(col -> new EditableDiscountCell());

        colTotal.setCellValueFactory(cell -> new SimpleStringProperty(currencyFormat.format(cell.getValue().netLineTotal)));

        cartTable.setEditable(true);
        cartTable.getSelectionModel().setSelectionMode(SelectionMode.SINGLE);
        cartTable.getSelectionModel().setCellSelectionEnabled(true);
        cartTable.setColumnResizePolicy(TableView.CONSTRAINED_RESIZE_POLICY);
        
        // Add total row at the bottom of Price column
        addPriceColumnTotal();
        
        // Auto-edit on cell selection for editable columns
        cartTable.getSelectionModel().selectedItemProperty().addListener((obs, old, newItem) -> {
            if (newItem != null) {
                Platform.runLater(() -> {
                    TablePosition<CartItem, ?> pos = cartTable.getFocusModel().getFocusedCell();
                    if (pos != null && pos.getTableColumn() != null) {
                        TableColumn<CartItem, ?> col = pos.getTableColumn();
                        if (col == colQty || col == colPrice || col == colDiscount) {
                            cartTable.edit(pos.getRow(), col);
                        }
                    }
                });
            }
        });
        
        cartTable.setOnKeyPressed(e -> {
            if (e.getCode() == KeyCode.DELETE || e.getCode() == KeyCode.BACK_SPACE) {
                // Delete the selected row
                CartItem selectedItem = cartTable.getSelectionModel().getSelectedItem();
                if (selectedItem != null) {
                    currentBill.items.remove(selectedItem);
                    refreshCurrentBill();
                    e.consume();
                }
            } else if (e.getCode() == KeyCode.DOWN) {
                TablePosition<CartItem, ?> pos = cartTable.getFocusModel().getFocusedCell();
                if (pos != null && pos.getRow() == cartTable.getItems().size() - 1) {
                    searchField.requestFocus();
                    searchField.selectAll();
                    e.consume();
                }
            } else if (e.getCode() == KeyCode.ENTER || e.getCode() == KeyCode.SPACE || (!e.isControlDown() && !e.isAltDown() && e.getText().length() > 0)) {
                // Start editing on Enter, Space, or any character key
                TablePosition<CartItem, ?> pos = cartTable.getFocusModel().getFocusedCell();
                if (pos != null && pos.getTableColumn() != null) {
                    TableColumn<CartItem, ?> col = pos.getTableColumn();
                    if (col == colQty || col == colPrice || col == colDiscount) {
                        cartTable.edit(pos.getRow(), col);
                        e.consume();
                    }
                }
            }
        });

        cartTable.setFixedCellSize(60);
    }



    private void addPriceColumnTotal() {
        // Create a label to display the total price
        Label totalPriceLabel = new Label();
        totalPriceLabel.setStyle("-fx-font-weight: bold; -fx-text-fill: #0f172a; -fx-font-size: 13px; -fx-padding: 8 12;");
        totalPriceLabel.setAlignment(javafx.geometry.Pos.CENTER_RIGHT);
        totalPriceLabel.setMaxWidth(Double.MAX_VALUE);
        
        // Bind the label text to the sum of all prices
        totalPriceLabel.textProperty().bind(Bindings.createStringBinding(() -> {
            BigDecimal total = currentBill.items.stream()
                .map(item -> item.pricePerUnit.multiply(BigDecimal.valueOf(item.quantity)))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            return currencyFormat.format(total);
        }, currentBill.items));
        
        // Set the label as the graphic for the Price column
        colPrice.setGraphic(totalPriceLabel);
    }

    private void bindTableHeight() {
        // Remove fixed height binding - let table grow to fill available space
        cartTable.prefHeightProperty().unbind();
        cartTable.setMaxHeight(Double.MAX_VALUE);
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
            
            // Try Barcode first
            Optional<Variant> byBarcode = searchIndex.findByBarcode(query);
            if (byBarcode.isPresent()) {
                addToCart(byBarcode.get());
                searchField.clear();
                searchPopup.hide();
                return;
            }

            // Otherwise take first from current results if popup is visible
            if (searchPopup.isShowing() && !searchResultsView.getItems().isEmpty()) {
                addToCart(searchResultsView.getItems().get(0));
                searchField.clear();
                searchPopup.hide();
            } else {
                // Last ditch search
                List<Variant> results = searchIndex.searchByName(query);
                if (!results.isEmpty()) {
                    addToCart(results.get(0));
                    searchField.clear();
                } else {
                    NotificationService.warning("No product found");
                }
            }
        });

        searchResultsView.setOnKeyPressed(e -> {
            if (e.getCode() == KeyCode.ENTER) {
                Variant v = searchResultsView.getSelectionModel().getSelectedItem();
                if (v != null) {
                    addToCart(v);
                    searchField.clear();
                    searchPopup.hide();
                }
            } else if (e.getCode() == KeyCode.UP && searchResultsView.getSelectionModel().getSelectedIndex() == 0) {
                searchField.requestFocus();
            }
        });

        searchResultsView.setOnMouseClicked(e -> {
            Variant v = searchResultsView.getSelectionModel().getSelectedItem();
            if (v != null) {
                addToCart(v);
                searchField.clear();
                searchPopup.hide();
            }
        });

        searchField.setOnKeyPressed(e -> {
            if (e.getCode() == KeyCode.UP) {
                if (!cartTable.getItems().isEmpty()) {
                    cartTable.requestFocus();
                    int lastRow = cartTable.getItems().size() - 1;
                    // Focus on SKU column (second column after #)
                    cartTable.getSelectionModel().select(lastRow, colSku);
                    cartTable.getFocusModel().focus(lastRow, colSku);
                }
            }
        });

        searchField.setOnMouseClicked(e -> {
            String query = searchField.getText().trim();
            showAutocompletePopup(query);
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
        paymentMethodCombo.setValue(currentBill.selectedPaymentMethod);
        
        bindTableHeight();
        refreshCurrentBill();
    }

    private void addToCart(Variant variant) {
        Optional<CartItem> existing = currentBill.items.stream()
            .filter(item -> item.variant.id().equals(variant.id()))
            .findFirst();
        
        int newQty = existing.map(cartItem -> cartItem.quantity + 1).orElse(1);

        if (variant.stock() != null && newQty > variant.stock()) {
            NotificationService.warning("Insufficient stock! Available: " + variant.stock());
            return;
        }

        if (existing.isPresent()) {
            existing.get().quantity = newQty;
        } else {
            currentBill.items.add(new CartItem(variant, 1));
        }
        
        refreshCurrentBill();
        searchField.requestFocus();
    }

    private void adjustQuantity(CartItem item, int delta) {
        int newQty = item.quantity + delta;
        
        if (delta > 0 && item.variant.stock() != null && newQty > item.variant.stock()) {
            NotificationService.warning("Cannot exceed available stock (" + item.variant.stock() + ")");
            return;
        }

        item.quantity = newQty;
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
        if (currentBill.items.isEmpty()) {
            currentBill.subtotal = BigDecimal.ZERO;
            currentBill.taxAmount = BigDecimal.ZERO;
            currentBill.total = BigDecimal.ZERO;
            updateUI();
            return;
        }

        BigDecimal grossTotal = BigDecimal.ZERO;
        for (CartItem item : currentBill.items) {
            BigDecimal lineTotal = item.pricePerUnit.multiply(BigDecimal.valueOf(item.quantity));
            BigDecimal lineDiscount = "fixed".equals(item.discountType) 
                ? item.discountValue 
                : lineTotal.multiply(item.discountValue).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            
            item.discountAmount = lineDiscount;
            item.netLineTotal = lineTotal.subtract(lineDiscount).max(BigDecimal.ZERO);
            grossTotal = grossTotal.add(item.netLineTotal);
        }

        BigDecimal overallDiscountAmount = BigDecimal.ZERO;
        if (currentBill.overallDiscountValue.compareTo(BigDecimal.ZERO) > 0) {
            if (currentBill.isDiscountFixed) {
                overallDiscountAmount = currentBill.overallDiscountValue;
            } else {
                overallDiscountAmount = grossTotal.multiply(currentBill.overallDiscountValue).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            }
        }

        List<TaxableItem> taxableItems = new ArrayList<>();
        BigDecimal distributedGlobalDiscount = BigDecimal.ZERO;

        for (int i = 0; i < currentBill.items.size(); i++) {
            CartItem item = currentBill.items.get(i);
            BigDecimal itemGlobalDiscount = BigDecimal.ZERO;
            if (grossTotal.compareTo(BigDecimal.ZERO) > 0 && overallDiscountAmount.compareTo(BigDecimal.ZERO) > 0) {
                if (i == currentBill.items.size() - 1) {
                    itemGlobalDiscount = overallDiscountAmount.subtract(distributedGlobalDiscount);
                } else {
                    itemGlobalDiscount = item.netLineTotal
                            .divide(grossTotal, 10, RoundingMode.HALF_UP)
                            .multiply(overallDiscountAmount);
                    distributedGlobalDiscount = distributedGlobalDiscount.add(itemGlobalDiscount);
                }
            }

            BigDecimal finalTaxableAmount = item.netLineTotal.subtract(itemGlobalDiscount).max(BigDecimal.ZERO);
            BigDecimal effectiveUnitPrice = item.quantity > 0
                    ? finalTaxableAmount.divide(BigDecimal.valueOf(item.quantity), 10, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;

            TaxableItem taxable = new TaxableItem(
                item.variant.productName(),
                item.variant.name(),
                effectiveUnitPrice,
                item.quantity,
                null, // taxCategoryId not easily available here
                item.variant.id(),
                item.variant.productId()
            );
            taxableItems.add(taxable);
        }
        
        TaxCalculationResult taxResult = taxEngine.calculate(new TaxableInvoice(taxableItems), currentBill.selectedCustomer);
        currentBill.subtotal = grossTotal;
        currentBill.taxAmount = taxResult.totalTax();
        currentBill.total = taxResult.grandTotal();

        updateUI();
    }

    private void updateUI() {
        subtotalLabel.setText(currencyFormat.format(currentBill.subtotal));
        taxLabel.setText(currencyFormat.format(currentBill.taxAmount));
        totalLabel.setText(currencyFormat.format(currentBill.total));
        bottomTotalLabel.setText(currencyFormat.format(currentBill.total));
        
        int qty = currentBill.items.stream().mapToInt(i -> i.quantity).sum();
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
                // Full payment: either exactly the total OR any amount >= total (to allow for cash change)
                // We also allow 0 (default) to represent paying exactly the total.
                validPayment = currentBill.amountTendered.compareTo(BigDecimal.ZERO) == 0 
                            || currentBill.amountTendered.compareTo(currentBill.total) >= 0;
            } else {
                // Partial payment: tendered must be > 0 and < total
                validPayment = currentBill.amountTendered.compareTo(BigDecimal.ZERO) > 0 
                            && currentBill.amountTendered.compareTo(currentBill.total) < 0;
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
        String billHtml = BillRenderer.renderBill(sale, settingsStore.loadGeneralSettings(), settingsStore.loadBillSettings());
        
        printerService.printInvoice(billHtml)
            .thenAccept(success -> {
                if (!success) Platform.runLater(() -> NotificationService.warning("Print failed"));
            });

        // Also show preview
        Platform.runLater(() -> {
            BillPreviewDialog dialog = new BillPreviewDialog(billHtml, rootPane.getScene().getWindow());
            dialog.showAndWait();
        });
    }

    @FXML
    private void handleClearCart() {
        currentBill.reset();
        refreshCurrentBill();
        switchBill(currentBill.index);
    }

    private void setupSearchAutocomplete() {
        searchResultsView.getStyleClass().add("search-results-list");
        searchPopup.getContent().add(searchResultsView);
        searchPopup.setAutoHide(true);

        searchResultsView.setCellFactory(lv -> new ListCell<>() {
            @Override
            protected void updateItem(Variant item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || item == null) {
                    setText(null);
                    setGraphic(null);
                    setStyle("-fx-background-color: transparent;");
                } else {
                    VBox box = new VBox(2);
                    box.setPadding(new javafx.geometry.Insets(8, 12, 8, 12));
                    
                    Label name = new Label(item.productName() + (item.name().equals("Default") ? "" : " - " + item.name()));
                    name.getStyleClass().add("search-item-name");
                    name.setStyle("-fx-font-weight: bold; -fx-text-fill: #1e293b; -fx-font-size: 13px;");
                    
                    Label details = new Label(item.sku() + " • " + currencyFormat.format(item.price()) + " • Stock: " + (item.stock() != null ? item.stock() : "∞"));
                    details.getStyleClass().add("search-item-details");
                    details.setStyle("-fx-font-size: 11px; -fx-text-fill: #64748b;");
                    
                    box.getChildren().addAll(name, details);
                    setGraphic(box);
                }
            }
        });

        searchField.textProperty().addListener((obs, old, query) -> {
            showAutocompletePopup(query != null ? query.trim() : "");
        });
        
        searchField.focusedProperty().addListener((obs, old, isFocused) -> {
            if (!isFocused) {
                Platform.runLater(() -> {
                    if (!searchResultsView.isFocused()) searchPopup.hide();
                });
            }
        });
    }

    private void showAutocompletePopup(String query) {
        List<Variant> results;
        if (query.isEmpty()) {
            // Show top results/all
            results = searchIndex.searchByName(""); // Assuming empty string returns all/top
            if (results.isEmpty()) results = searchIndex.searchByName(" "); 
        } else {
            results = searchIndex.searchByName(query);
        }

        if (!results.isEmpty()) {
            searchResultsView.setItems(FXCollections.observableArrayList(results));
            searchResultsView.setPrefHeight(Math.min(results.size() * 52 + 10, 400));
            searchResultsView.setPrefWidth(Math.max(searchField.getWidth(), 300));
            
            javafx.geometry.Point2D pos = searchField.localToScreen(0, searchField.getHeight() + 5);
            if (pos != null) {
                // Ensure the popup doesn't go off screen bottom
                double screenHeight = searchField.getScene().getWindow().getHeight();
                if (pos.getY() + searchResultsView.getPrefHeight() > screenHeight) {
                    // Show above instead
                    searchPopup.show(searchField, pos.getX(), pos.getY() - searchField.getHeight() - searchResultsView.getPrefHeight() - 10);
                } else {
                    searchPopup.show(searchField, pos.getX(), pos.getY());
                }
            }
        } else {
            searchPopup.hide();
        }
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

    private class EditableQuantityCell extends TableCell<CartItem, CartItem> {
        private TextField textField;

        @Override
        public void startEdit() {
            super.startEdit();
            if (textField == null) createTextField();
            setText(null);
            setGraphic(textField);
            textField.selectAll();
            textField.requestFocus();
        }

        @Override
        public void cancelEdit() {
            super.cancelEdit();
            setText(String.valueOf(getItem().quantity));
            setGraphic(null);
        }

        @Override
        public void updateItem(CartItem item, boolean empty) {
            super.updateItem(item, empty);
            if (empty || item == null) {
                setText(null);
                setGraphic(null);
            } else {
                if (isEditing()) {
                    if (textField != null) textField.setText(String.valueOf(item.quantity));
                    setText(null);
                    setGraphic(textField);
                } else {
                    setText(String.valueOf(item.quantity));
                    setGraphic(null);
                }
            }
        }

        private void createTextField() {
            textField = new TextField();
            textField.getStyleClass().add("table-input");
            textField.setAlignment(javafx.geometry.Pos.CENTER);
            textField.setPrefWidth(60);
            textField.setOnAction(e -> commitEdit(getItem()));
            textField.focusedProperty().addListener((obs, old, focused) -> {
                if (!focused && isEditing()) commitEdit(getItem());
            });
            textField.setOnKeyPressed(e -> {
                if (e.getCode() == KeyCode.ESCAPE) cancelEdit();
                else if (e.getCode() == KeyCode.ENTER) {
                    commitEdit(getItem());
                    moveDown();
                    e.consume();
                } else if (e.getCode() == KeyCode.TAB) {
                    commitEdit(getItem());
                    if (e.isShiftDown()) moveToPrevious();
                    else moveToNext();
                    e.consume();
                }
            });
        }

        @Override
        public void commitEdit(CartItem item) {
            if (textField != null && item != null) {
                try {
                    int newQty = Integer.parseInt(textField.getText().trim());
                    if (newQty < 1) newQty = 1;
                    item.quantity = newQty;
                    refreshCurrentBill();
                } catch (NumberFormatException e) {}
            }
            super.commitEdit(item);
        }
    }

    private class EditablePriceCell extends TableCell<CartItem, CartItem> {
        private TextField textField;

        @Override
        public void startEdit() {
            super.startEdit();
            if (textField == null) createTextField();
            setText(null);
            setGraphic(textField);
            textField.selectAll();
            textField.requestFocus();
        }

        @Override
        public void cancelEdit() {
            super.cancelEdit();
            setText(getItem().pricePerUnit.toString());
            setGraphic(null);
        }

        @Override
        public void updateItem(CartItem item, boolean empty) {
            super.updateItem(item, empty);
            if (empty || item == null) {
                setText(null);
                setGraphic(null);
            } else {
                if (isEditing()) {
                    if (textField != null) textField.setText(item.pricePerUnit.toString());
                    setText(null);
                    setGraphic(textField);
                } else {
                    setText(item.pricePerUnit.toString());
                    setGraphic(null);
                }
            }
        }

        private void createTextField() {
            textField = new TextField();
            textField.getStyleClass().add("table-input");
            textField.setAlignment(javafx.geometry.Pos.CENTER_RIGHT);
            textField.setOnAction(e -> commitEdit(getItem()));
            textField.focusedProperty().addListener((obs, old, focused) -> {
                if (!focused && isEditing()) commitEdit(getItem());
            });
            textField.setOnKeyPressed(e -> {
                if (e.getCode() == KeyCode.ESCAPE) cancelEdit();
                else if (e.getCode() == KeyCode.ENTER) {
                    commitEdit(getItem());
                    moveDown();
                    e.consume();
                } else if (e.getCode() == KeyCode.TAB) {
                    commitEdit(getItem());
                    if (e.isShiftDown()) moveToPrevious();
                    else moveToNext();
                    e.consume();
                }
            });
        }

        @Override
        public void commitEdit(CartItem item) {
            if (textField != null && item != null) {
                try {
                    BigDecimal val = new BigDecimal(textField.getText().replace("$", "").replace(",", "").trim());
                    val = val.max(BigDecimal.ZERO);
                    
                    // Validate: Price should not exceed MRP
                    BigDecimal mrp = item.variant.price();
                    if (val.compareTo(mrp) > 0) {
                        NotificationService.warning("Price cannot exceed MRP (" + currencyFormat.format(mrp) + ")");
                        val = mrp;
                    }
                    
                    item.pricePerUnit = val;
                    refreshCurrentBill();
                } catch (Exception e) {}
            }
            super.commitEdit(item);
        }
    }

    private class EditableDiscountCell extends TableCell<CartItem, CartItem> {
        private TextField textField;
        private ToggleButton btnPct;
        private ToggleButton btnAmt;
        private HBox box;

        @Override
        public void startEdit() {
            super.startEdit();
            if (textField == null) createControls();
            setText(null);
            setGraphic(box);
            textField.selectAll();
            textField.requestFocus();
        }

        @Override
        public void cancelEdit() {
            super.cancelEdit();
            updateDisplay();
        }

        @Override
        public void updateItem(CartItem item, boolean empty) {
            super.updateItem(item, empty);
            if (empty || item == null) {
                setText(null);
                setGraphic(null);
            } else {
                if (isEditing()) {
                    if (textField != null) {
                        textField.setText(item.discountValue.compareTo(BigDecimal.ZERO) == 0 ? "" : item.discountValue.toString());
                        if ("pct".equals(item.discountType)) btnPct.setSelected(true);
                        else btnAmt.setSelected(true);
                    }
                    setText(null);
                    setGraphic(box);
                } else {
                    updateDisplay();
                }
            }
        }

        private void updateDisplay() {
            CartItem item = getItem();
            if (item != null) {
                String display = item.discountValue.compareTo(BigDecimal.ZERO) == 0 ? "0" 
                    : item.discountValue + ("pct".equals(item.discountType) ? "%" : "$");
                setText(display);
            }
            setGraphic(null);
        }

        private void createControls() {
            textField = new TextField();
            textField.getStyleClass().add("table-input");
            textField.setPrefWidth(80);
            textField.setAlignment(javafx.geometry.Pos.CENTER_RIGHT);
            
            btnPct = new ToggleButton("%");
            btnAmt = new ToggleButton("$");
            ToggleGroup group = new ToggleGroup();
            btnPct.setToggleGroup(group);
            btnAmt.setToggleGroup(group);
            btnPct.getStyleClass().add("toggle-btn-neon");
            btnAmt.getStyleClass().add("toggle-btn-neon");
            
            HBox toggleBox = new HBox(btnAmt, btnPct);
            toggleBox.getStyleClass().add("toggle-group-neon");
            
            box = new HBox(4, textField, toggleBox);
            box.setAlignment(javafx.geometry.Pos.CENTER_RIGHT);
            
            textField.setOnAction(e -> commitEdit(getItem()));
            textField.focusedProperty().addListener((obs, old, focused) -> {
                if (!focused && isEditing()) commitEdit(getItem());
            });
            textField.setOnKeyPressed(e -> {
                if (e.getCode() == KeyCode.ESCAPE) cancelEdit();
                else if (e.getCode() == KeyCode.ENTER) {
                    commitEdit(getItem());
                    moveDown();
                    e.consume();
                } else if (e.getCode() == KeyCode.TAB) {
                    commitEdit(getItem());
                    if (e.isShiftDown()) moveToPrevious();
                    else moveToNext();
                    e.consume();
                }
            });
            
            // Allow toggle switching during edit without committing
            group.selectedToggleProperty().addListener((obs, old, val) -> {
                if (val == null && old != null) {
                    old.setSelected(true);
                } else if (val != null && isEditing()) {
                    // Update the item's discount type immediately for real-time feedback
                    CartItem item = getItem();
                    if (item != null) {
                        item.discountType = btnPct.isSelected() ? "pct" : "fixed";
                    }
                }
            });
        }

        @Override
        public void commitEdit(CartItem item) {
            if (textField != null && item != null) {
                try {
                    String text = textField.getText().trim();
                    BigDecimal discountValue = text.isEmpty() ? BigDecimal.ZERO : new BigDecimal(text);
                    String discountType = btnPct.isSelected() ? "pct" : "fixed";
                    
                    // Validate discount
                    if (discountValue.compareTo(BigDecimal.ZERO) > 0) {
                        if ("pct".equals(discountType)) {
                            // Percentage should not exceed 100%
                            if (discountValue.compareTo(BigDecimal.valueOf(100)) > 0) {
                                NotificationService.warning("Discount percentage cannot exceed 100%");
                                discountValue = BigDecimal.valueOf(100);
                            }
                        } else {
                            // Fixed discount should not exceed line total
                            BigDecimal lineTotal = item.pricePerUnit.multiply(BigDecimal.valueOf(item.quantity));
                            if (discountValue.compareTo(lineTotal) > 0) {
                                NotificationService.warning("Discount cannot exceed line total (" + currencyFormat.format(lineTotal) + ")");
                                discountValue = lineTotal;
                            }
                        }
                    }
                    
                    item.discountValue = discountValue;
                    item.discountType = discountType;
                    refreshCurrentBill();
                } catch (Exception e) {}
            }
            super.commitEdit(item);
        }
    }

    private void moveDown() {
        TablePosition<CartItem, ?> pos = cartTable.getFocusModel().getFocusedCell();
        if (pos != null && pos.getRow() < cartTable.getItems().size() - 1) {
            cartTable.getSelectionModel().select(pos.getRow() + 1, pos.getTableColumn());
            cartTable.edit(pos.getRow() + 1, pos.getTableColumn());
        }
    }

    private void moveToNext() {
        TablePosition<CartItem, ?> pos = cartTable.getFocusModel().getFocusedCell();
        if (pos != null) {
            int col = cartTable.getVisibleLeafIndex(pos.getTableColumn());
            if (col < cartTable.getVisibleLeafColumns().size() - 1) {
                cartTable.getSelectionModel().select(pos.getRow(), cartTable.getVisibleLeafColumn(col + 1));
                cartTable.edit(pos.getRow(), cartTable.getVisibleLeafColumn(col + 1));
            } else if (pos.getRow() < cartTable.getItems().size() - 1) {
                cartTable.getSelectionModel().select(pos.getRow() + 1, cartTable.getVisibleLeafColumn(0));
                cartTable.edit(pos.getRow() + 1, cartTable.getVisibleLeafColumn(0));
            }
        }
    }

    private void moveToPrevious() {
        TablePosition<CartItem, ?> pos = cartTable.getFocusModel().getFocusedCell();
        if (pos != null) {
            int col = cartTable.getVisibleLeafIndex(pos.getTableColumn());
            if (col > 0) {
                cartTable.getSelectionModel().select(pos.getRow(), cartTable.getVisibleLeafColumn(col - 1));
                cartTable.edit(pos.getRow(), cartTable.getVisibleLeafColumn(col - 1));
            } else if (pos.getRow() > 0) {
                int lastCol = cartTable.getVisibleLeafColumns().size() - 1;
                cartTable.getSelectionModel().select(pos.getRow() - 1, cartTable.getVisibleLeafColumn(lastCol));
                cartTable.edit(pos.getRow() - 1, cartTable.getVisibleLeafColumn(lastCol));
            }
        }
    }
}
