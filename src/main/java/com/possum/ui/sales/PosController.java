package com.possum.ui.sales;

import com.possum.application.auth.AuthContext;
import com.possum.application.auth.AuthUser;
import com.possum.application.sales.SalesService;
import com.possum.application.sales.TaxEngine;
import com.possum.application.sales.dto.*;
import com.possum.domain.model.Customer;
import com.possum.domain.model.PaymentMethod;
import com.possum.domain.model.Variant;
import com.possum.domain.model.CartItem;

import com.possum.domain.model.SaleDraft;
import com.possum.domain.services.SaleCalculator;
import com.possum.infrastructure.filesystem.SettingsStore;

import com.possum.infrastructure.logging.LoggingConfig;
import com.possum.infrastructure.printing.BillRenderer;
import com.possum.infrastructure.printing.PrintOutcome;
import com.possum.infrastructure.printing.PrinterService;
import com.possum.shared.dto.BillSettings;
import com.possum.shared.dto.GeneralSettings;
import com.possum.ui.common.ErrorHandler;
import com.possum.ui.common.dialogs.BillPreviewDialog;
import com.possum.ui.common.controls.DataTableView;
import com.possum.ui.common.controls.NotificationService;
import javafx.application.Platform;
import javafx.beans.property.*;
import javafx.collections.FXCollections;
import javafx.fxml.FXML;
import javafx.scene.control.*;
import javafx.scene.layout.*;
import javafx.scene.paint.Color;
import com.possum.domain.model.Category;
import com.possum.application.products.ProductService;
import com.possum.application.categories.CategoryService;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.NumberFormat;
import java.util.*;
import java.util.Locale;
import javafx.stage.Popup;
import javafx.scene.input.KeyCode;


import com.possum.ui.sales.cells.*;

public class PosController implements com.possum.ui.sales.cells.CartCellHandler {

    @FXML private VBox leftVBox;
    @FXML private VBox cartCardVBox;
    @FXML private HBox searchDock;
    @FXML private VBox paymentCard;
    @FXML private HBox tenderedBalanceContainer;
    @FXML private StackPane rightPane;
    @FXML private DataTableView<CartItem> cartTable;
    
    // Virtual columns
    private TableColumn<CartItem, String> colSno;
    private TableColumn<CartItem, String> colSku;
    private TableColumn<CartItem, String> colProduct;
    private TableColumn<CartItem, CartItem> colQty;
    private TableColumn<CartItem, CartItem> colPrice;
    private TableColumn<CartItem, CartItem> colDiscountPct;
    private TableColumn<CartItem, CartItem> colDiscountAmt;
    private TableColumn<CartItem, String> colTotal;
    private TableColumn<CartItem, String> colMrp;

    @FXML private TextField searchField;
    @FXML private Label totalQtyLabel;
    @FXML private Label bottomTotalLabel;
    @FXML private Label bottomMrpLabel;
    @FXML private Label bottomPriceTotalLabel;

    @FXML private TextField quickProductName;
    @FXML private TextField quickVariantName;
    @FXML private TextField quickStock;
    @FXML private TextField quickPrice;
    @FXML private TextField quickCategorySearch;

    @FXML private ComboBox<Customer> customerCombo;
    @FXML private TextField customerNameField;
    @FXML private TextField customerPhoneField;
    @FXML private TextField customerEmailField;
    @FXML private TextField customerAddressField;

    @FXML private ComboBox<PaymentMethod> paymentMethodCombo;

    @FXML private ToggleButton btnFullPayment;
    @FXML private ToggleButton btnPartialPayment;
    @FXML private TextField discountField;
    @FXML private ToggleButton btnDiscountFixed;
    @FXML private ToggleButton btnDiscountPercent;

    @FXML private Label subtotalLabel;
    @FXML private Label totalDiscountLabel;
    @FXML private Label taxLabel;
    @FXML private Label totalLabel;

    @FXML private TextField tenderedField;
    @FXML private Label balanceTypeLabel;
    @FXML private Label balanceLabel;

    @FXML private Button completeButton;
    @FXML private HBox billsFlowPane;
    @FXML private StackPane rootPane;
    private boolean isAutofilling = false;
    private Long selectedProductIdForQuickAdd = null;
    private Category selectedCategoryForQuickAdd = null;

    private Popup searchPopup = new Popup();
    private ListView<Variant> searchResultsView = new ListView<>(FXCollections.observableArrayList());
    private Popup quickProductPopup = new Popup();
    private ListView<Variant> quickProductResultsView = new ListView<>(FXCollections.observableArrayList());
    private Popup quickCategoryPopup = new Popup();
    private ListView<Category> quickCategoryResultsView = new ListView<>(FXCollections.observableArrayList());

    private final SalesService salesService;
    private final com.possum.application.people.CustomerService customerService;
    private final ProductSearchIndex searchIndex;
    private final TaxEngine taxEngine;
    private final PrinterService printerService;
    private final SettingsStore settingsStore;
    private final ProductService productService;
    private final CategoryService categoryService;
    private final SaleCalculator saleCalculator;


    private final NumberFormat currencyFormat = NumberFormat.getCurrencyInstance(Locale.US);

    private static final int MAX_BILLS = 9;
    private final List<SaleDraft> bills = new ArrayList<>();
    private SaleDraft currentBill;


    public PosController(SalesService salesService, com.possum.application.people.CustomerService customerService,
            ProductSearchIndex searchIndex, TaxEngine taxEngine,
            PrinterService printerService, SettingsStore settingsStore,
            ProductService productService, CategoryService categoryService,
            SaleCalculator saleCalculator) {
        this.salesService = salesService;
        this.customerService = customerService;
        this.searchIndex = searchIndex;
        this.taxEngine = taxEngine;
        this.printerService = printerService;
        this.settingsStore = settingsStore;
        this.productService = productService;
        this.categoryService = categoryService;
        this.saleCalculator = saleCalculator;
    }


    @FXML
    public void initialize() {
        setupQuickAdd();
        if (completeButton != null) {
            com.possum.ui.common.UIPermissionUtil.requirePermission(completeButton,
                    com.possum.application.auth.Permissions.SALES_CREATE);
        }

        for (int i = 0; i < MAX_BILLS; i++) {
            SaleDraft d = new SaleDraft();
            d.setIndex(i);
            bills.add(d);
        }

        currentBill = bills.get(0);


        NotificationService.initialize(rootPane);
        setupTable();
        setupListeners();
        loadCombos();
        setupBillingToggles();

        renderBillsFlowPane();
        switchBill(0);
        taxEngine.init();
        setupSearchAutocomplete();
        setupQuickAddAutocomplete();
        setupCategoryAutocomplete();

        setupKeyboardShortcuts();
        updatePaymentSectionState();
        setupLayoutSizing();
    }

    private void setupTable() {
        colSno = new TableColumn<>("#");
        colSku = new TableColumn<>("SKU");
        colProduct = new TableColumn<>("Product");
        colQty = new TableColumn<>("Qty");
        colPrice = new TableColumn<>("Price");
        colMrp = new TableColumn<>("MRP");
        colDiscountPct = new TableColumn<>("Disc %");
        colDiscountAmt = new TableColumn<>("Disc Amt");
        colTotal = new TableColumn<>("Total");

        cartTable.getTableView().getColumns().clear();
        cartTable.getTableView().getColumns().addAll(List.of(
            colSno, colSku, colProduct, colQty, colPrice, colMrp, colDiscountPct, colDiscountAmt, colTotal
        ));

        colSno.setPrefWidth(48);
        colSno.setResizable(false);
        colSno.setCellValueFactory(cell -> new SimpleStringProperty(String.valueOf(cartTable.getTableView().getItems().indexOf(cell.getValue()) + 1)));

        colSku.setPrefWidth(95);
        colSku.setCellValueFactory(cell -> new SimpleStringProperty(cell.getValue().getVariant().sku()));


        colProduct.setPrefWidth(180);
        colProduct.setCellValueFactory(cell -> {
            Variant v = cell.getValue().getVariant();

            String disp = v.productName();
            if (v.name() != null && !v.name().equalsIgnoreCase("Standard")) {
                disp += " (" + v.name() + ")";
            }
            return new SimpleStringProperty(disp);
        });

        colQty.setPrefWidth(78);
        colQty.setCellValueFactory(cell -> new SimpleObjectProperty<>(cell.getValue()));
        colQty.setCellFactory(col -> new EditableQuantityCell(this, col));

        colPrice.setPrefWidth(96);
        colPrice.setCellValueFactory(cell -> new SimpleObjectProperty<>(cell.getValue()));
        colPrice.setCellFactory(col -> new EditablePriceCell(this, col));

        colMrp.setPrefWidth(96);
        colMrp.setCellValueFactory(cell -> new SimpleStringProperty(currencyFormat.format(cell.getValue().getVariant().price())));


        colDiscountPct.setPrefWidth(90);
        colDiscountPct.setCellValueFactory(cell -> new SimpleObjectProperty<>(cell.getValue()));
        colDiscountPct.setCellFactory(col -> new EditableDiscountPctCell(this, col));

        colDiscountAmt.setPrefWidth(98);
        colDiscountAmt.setCellValueFactory(cell -> new SimpleObjectProperty<>(cell.getValue()));
        colDiscountAmt.setCellFactory(col -> new EditableDiscountAmtCell(this, col));

        colTotal.setPrefWidth(115);
        colTotal.setCellValueFactory(cell -> new SimpleStringProperty(currencyFormat.format(cell.getValue().getNetLineTotal())));


        cartTable.getTableView().setEditable(true);
        cartTable.getTableView().getSelectionModel().setSelectionMode(SelectionMode.SINGLE);
        cartTable.getTableView().getSelectionModel().setCellSelectionEnabled(true);
        
        cartTable.setEmptyMessage("Your cart is empty");
        cartTable.setEmptySubtitle("Search for products or scan a barcode to add items.");

        cartTable.getTableView().setOnKeyPressed(e -> {
            if (e.getCode() == KeyCode.DELETE || e.getCode() == KeyCode.BACK_SPACE) {
                CartItem selectedItem = cartTable.getTableView().getSelectionModel().getSelectedItem();
                if (selectedItem != null) {
                    currentBill.getItems().remove(selectedItem);

                    refreshCurrentBill();
                    e.consume();
                }
            } else if (e.getCode() == KeyCode.ENTER || e.getCode() == KeyCode.SPACE
                    || (!e.isControlDown() && !e.isAltDown() && e.getText().length() > 0)) {
                @SuppressWarnings("unchecked")
                TablePosition<CartItem, ?> pos = cartTable.getTableView().getFocusModel().getFocusedCell();
                if (pos != null && pos.getTableColumn() != null) {
                    TableColumn<CartItem, ?> col = pos.getTableColumn();
                    if (col == colQty || col == colPrice || col == colDiscountAmt || col == colDiscountPct) {
                        cartTable.getTableView().edit(pos.getRow(), col);
                        e.consume();
                    }
                }
            }
        });

        cartTable.getTableView().setFixedCellSize(60);
    }

    private void loadCombos() {
        customerCombo.setCellFactory(lv -> new ListCell<>() {
            @Override
            protected void updateItem(Customer item, boolean empty) {
                super.updateItem(item, empty);
                setText(item == null || empty ? "Walk-in Customer" : item.name() + " (" + item.phone() + ")");
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
            customerCombo.getItems().setAll(customers);
        } catch (Exception e) {}

        paymentMethodCombo.setCellFactory(lv -> new ListCell<>() {
            @Override
            protected void updateItem(PaymentMethod item, boolean empty) {
                super.updateItem(item, empty);
                setText(item == null || empty ? "Select Method" : item.name());
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
        paymentMethodCombo.getItems().setAll(methods);
        if (!methods.isEmpty())
            paymentMethodCombo.setValue(methods.get(0));
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
                oldVal.setSelected(true);
                return;
            }
            boolean isFull = newVal == btnFullPayment;
            currentBill.setFullPayment(isFull);
            updateBalanceLabel();
            refreshCurrentBill();

        });

        discountTypeGroup.selectedToggleProperty().addListener((obs, oldVal, newVal) -> {
            if (newVal == null) {
                oldVal.setSelected(true);
                return;
            }
            boolean isFixed = newVal == btnDiscountFixed;
            currentBill.setDiscountFixed(isFixed);
            recalculateTotals();

        });
    }

    private void setupListeners() {
        searchField.setOnAction(e -> {
            String query = searchField.getText().trim();
            if (query.isEmpty()) return;
            Optional<Variant> byBarcode = searchIndex.findByBarcode(query);
            if (byBarcode.isPresent()) {
                addToCart(byBarcode.get());
                searchField.clear();
                searchPopup.hide();
                return;
            }
            if (searchPopup.isShowing() && !searchResultsView.getItems().isEmpty()) {
                addToCart(searchResultsView.getItems().get(0));
                searchField.clear();
                searchPopup.hide();
            } else {
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
                if (v != null) { addToCart(v); searchField.clear(); searchPopup.hide(); }
            } else if (e.getCode() == KeyCode.UP && searchResultsView.getSelectionModel().getSelectedIndex() == 0) {
                searchField.requestFocus();
            }
        });

        searchResultsView.setOnMouseClicked(e -> {
            Variant v = searchResultsView.getSelectionModel().getSelectedItem();
            if (v != null) {
                addToCart(v);
                Platform.runLater(() -> { searchField.clear(); searchPopup.hide(); });
            }
        });

        searchField.setOnKeyPressed(e -> {
            if (e.getCode() == KeyCode.DOWN) {
                if (!cartTable.getTableView().getItems().isEmpty()) {
                    cartTable.getTableView().requestFocus();
                    cartTable.getTableView().getSelectionModel().select(0, colSku);
                    cartTable.getTableView().getFocusModel().focus(0, colSku);
                }
            }
        });

        searchField.setOnMouseClicked(e -> showAutocompletePopup(searchField.getText().trim()));

        discountField.textProperty().addListener((obs, oldVal, newVal) -> {
            try {
                currentBill.setOverallDiscountValue(newVal.isEmpty() ? BigDecimal.ZERO : new BigDecimal(newVal));
                recalculateTotals();
            } catch (Exception e) {}
        });

        tenderedField.textProperty().addListener((obs, oldVal, newVal) -> {
            try {
                currentBill.setAmountTendered(newVal.isEmpty() ? BigDecimal.ZERO : new BigDecimal(newVal));
                updateBalanceLabel();
            } catch (Exception e) {}
        });


        customerCombo.valueProperty().addListener((obs, old, val) -> {
            if (isAutofilling) return;
            isAutofilling = true;
            try {
                currentBill.setSelectedCustomer(val);
                if (val != null) {
                    customerNameField.setText(val.name());
                    customerPhoneField.setText(val.phone());
                    customerEmailField.setText(val.email() != null ? val.email() : "");
                    customerAddressField.setText(val.address() != null ? val.address() : "");
                } else if (old != null && old.name().equals(customerNameField.getText().trim())
                            && old.phone().equals(customerPhoneField.getText().trim())) {
                    customerNameField.clear(); customerPhoneField.clear(); customerEmailField.clear(); customerAddressField.clear();
                }
            } finally { isAutofilling = false; }

        });

        customerNameField.textProperty().addListener((obs, old, val) -> { if (!isAutofilling) { currentBill.setCustomerName(val); checkCustomerMatch(); recalculateTotals(); } });
        customerPhoneField.textProperty().addListener((obs, old, val) -> { if (!isAutofilling) { currentBill.setCustomerPhone(val); checkCustomerMatch(); recalculateTotals(); } });
        customerEmailField.textProperty().addListener((obs, old, val) -> { if (!isAutofilling) currentBill.setCustomerEmail(val); });
        customerAddressField.textProperty().addListener((obs, old, val) -> { if (!isAutofilling) { currentBill.setCustomerAddress(val); recalculateTotals(); } });

        paymentMethodCombo.valueProperty().addListener((obs, old, val) -> { currentBill.setSelectedPaymentMethod(val); updateBalanceLabel(); });

    }

    private void setupKeyboardShortcuts() {
        Platform.runLater(() -> {
            if (rootPane == null || rootPane.getScene() == null) return;
            rootPane.getScene().addEventFilter(javafx.scene.input.KeyEvent.KEY_PRESSED, e -> {
                if ((e.isControlDown() || e.isMetaDown()) && e.getCode() == KeyCode.K) { focusSearchAndOpen(true); e.consume(); return; }
                if ((e.isControlDown() || e.isMetaDown()) && e.getCode() == KeyCode.ENTER) { if (!completeButton.isDisabled()) handleCompleteSale(); e.consume(); return; }
                if ((e.isControlDown() || e.isMetaDown()) && e.getCode() == KeyCode.N) { openOrSwitchToNextBill(); e.consume(); return; }
                if ((e.isControlDown() || e.isMetaDown()) && e.getCode().isDigitKey()) {
                    String t = e.getText();
                    if (t != null && !t.isEmpty()) {
                        int d = t.charAt(0) - '1';
                        if (d >= 0 && d < MAX_BILLS) { switchBill(d); e.consume(); }
                    }
                    return;
                }
                if (e.getCode() == KeyCode.F12) {
                    if (currentBill.getItems().isEmpty()) { NotificationService.warning("Add items to cart first"); e.consume(); return; }
                    if (tenderedField.isFocused()) {
                        if (!completeButton.isDisabled()) handleCompleteSale();
                        else NotificationService.warning(currentBill.isFullPayment() ? "Tendered amount must be >= total" : "Partial payment must be between 0 and total");
                    } else { tenderedField.requestFocus(); tenderedField.selectAll(); }
                    e.consume();
                    return;
                }

                if (e.getCode() == KeyCode.ESCAPE) { searchPopup.hide(); quickProductPopup.hide(); quickCategoryPopup.hide(); rootPane.requestFocus(); e.consume(); return; }
                if (!e.isControlDown() && !e.isMetaDown() && e.getCode() == KeyCode.SLASH && e.isShiftDown()) {
                    NotificationService.info("POS shortcuts: Ctrl+K Search, Ctrl+Enter Complete, Ctrl+N New Bill, Ctrl+1..9 Switch Bill, Esc Close popups");
                    e.consume();
                }
            });
        });
    }

    private void setupLayoutSizing() {
        Platform.runLater(() -> {
            if (rootPane == null || leftVBox == null || rightPane == null) return;
            leftVBox.prefWidthProperty().bind(rootPane.widthProperty().multiply(0.60));
            rightPane.prefWidthProperty().bind(rootPane.widthProperty().multiply(0.40));
        });
    }

    private void focusSearchAndOpen(boolean openPopup) {
        searchField.requestFocus(); searchField.selectAll();
        if (openPopup) showAutocompletePopup(searchField.getText() != null ? searchField.getText().trim() : "");
    }

    private void openOrSwitchToNextBill() {
        for (SaleDraft bill : bills) if (bill.getItems().isEmpty() && bill.getIndex() != currentBill.getIndex()) { switchBill(bill.getIndex()); return; }
        int next = (currentBill.getIndex() + 1) % MAX_BILLS;
        if (next == currentBill.getIndex()) return;

        bills.get(next).reset();
        switchBill(next);
        NotificationService.info("Switched to a fresh bill tab");
    }

    @FXML
    private void handleResetCustomer() {
        isAutofilling = true;
        try {
            customerCombo.setValue(null); customerNameField.clear(); customerPhoneField.clear();
            customerEmailField.clear(); customerAddressField.clear();
            currentBill.setSelectedCustomer(null); currentBill.setCustomerName(""); currentBill.setCustomerPhone("");
            currentBill.setCustomerEmail(""); currentBill.setCustomerAddress("");
            recalculateTotals();
        } finally { isAutofilling = false; }

    }

    private void checkCustomerMatch() {
        if (isAutofilling) return;
        Customer sel = customerCombo.getValue();
        if (sel != null) {
            String n = customerNameField.getText().trim(); String p = customerPhoneField.getText().trim();
            if (!n.equalsIgnoreCase(sel.name()) || !p.equals(sel.phone())) {
                Platform.runLater(() -> { if (customerCombo.getValue() != null) customerCombo.setValue(null); });
            }
        }
    }

    private void renderBillsFlowPane() {
        billsFlowPane.getChildren().clear();
        for (int i = 0; i < MAX_BILLS; i++) {
            SaleDraft bill = bills.get(i);
            Button btn = new Button(String.valueOf(i + 1));
            boolean act = currentBill.getIndex() == i;
            boolean has = !bill.getItems().isEmpty();
            String s = "-fx-font-weight: bold; -fx-background-radius: 8; -fx-border-radius: 8; -fx-min-width: 30; -fx-min-height: 30; -fx-font-size: 11px; ";
            if (act) s += "-fx-background-color: #0f172a; -fx-text-fill: white; -fx-border-color: #0f172a; -fx-border-width: 1;";
            else if (has) s += "-fx-background-color: #fef3c7; -fx-text-fill: #d97706; -fx-border-color: #fcd34d; -fx-border-width: 1;";
            else s += "-fx-background-color: #f8fafc; -fx-text-fill: #94a3b8; -fx-border-color: #e2e8f0; -fx-border-width: 1;";

            btn.setStyle(s); btn.setCursor(javafx.scene.Cursor.HAND);
            int idx = i; btn.setOnAction(e -> switchBill(idx));
            billsFlowPane.getChildren().add(btn);
        }
    }

    private void switchBill(int index) {
        currentBill = bills.get(index);
        cartTable.getTableView().setItems(FXCollections.observableArrayList(currentBill.getItems()));
        btnFullPayment.setSelected(currentBill.isFullPayment());
        btnPartialPayment.setSelected(!currentBill.isFullPayment());
        discountField.setText(currentBill.getOverallDiscountValue().compareTo(BigDecimal.ZERO) > 0 ? currentBill.getOverallDiscountValue().toString() : "");
        btnDiscountFixed.setSelected(currentBill.isDiscountFixed()); btnDiscountPercent.setSelected(!currentBill.isDiscountFixed());
        tenderedField.setText(currentBill.getAmountTendered().compareTo(BigDecimal.ZERO) > 0 ? currentBill.getAmountTendered().toString() : "");
        isAutofilling = true;
        try {
            customerCombo.setValue(currentBill.getSelectedCustomer());
            customerNameField.setText(currentBill.getCustomerName() != null ? currentBill.getCustomerName() : "");
            customerPhoneField.setText(currentBill.getCustomerPhone() != null ? currentBill.getCustomerPhone() : "");
            customerEmailField.setText(currentBill.getCustomerEmail() != null ? currentBill.getCustomerEmail() : "");
            customerAddressField.setText(currentBill.getCustomerAddress() != null ? currentBill.getCustomerAddress() : "");
        } finally { isAutofilling = false; }
        paymentMethodCombo.setValue(currentBill.getSelectedPaymentMethod());
        if (currentBill.getSelectedPaymentMethod() == null && !paymentMethodCombo.getItems().isEmpty()) {
            currentBill.setSelectedPaymentMethod(paymentMethodCombo.getItems().get(0));
            paymentMethodCombo.setValue(currentBill.getSelectedPaymentMethod());
        }

        refreshCurrentBill(); focusSearchAndOpen(false);
    }

    private void setupQuickAdd() {}

    @FXML
    private void handleQuickAddProduct() {
        String pN = quickProductName.getText().trim(); String vN = quickVariantName.getText().trim();
        String pS = quickPrice.getText().trim(); String sS = quickStock.getText().trim();
        String cN = quickCategorySearch.getText().trim();
        if (pN.isEmpty() || pS.isEmpty() || cN.isEmpty()) { NotificationService.error("Please enter product name, price and select a category."); return; }
        Category cat = selectedCategoryForQuickAdd;
        if (cat == null) cat = categoryService.getAllCategories().stream().filter(c -> c.name().equalsIgnoreCase(cN)).findFirst().orElse(null);
        if (cat == null) { NotificationService.error("Please select a valid category."); return; }
        try {
            BigDecimal price = new BigDecimal(pS); int stock = sS.isEmpty() ? 1 : Integer.parseInt(sS);
            if (stock < 0) stock = 0;
            AuthUser cur = AuthContext.getCurrentUser(); long uId = cur != null ? cur.id() : 1L;
            Variant vCart = null; Long pId = selectedProductIdForQuickAdd;
            if (pId == null) {
                Optional<Variant> m = searchIndex.searchByName(pN).stream().filter(v -> v.productName().equalsIgnoreCase(pN)).findFirst();
                if (m.isPresent()) pId = m.get().productId();
            }
            if (pId != null) {
                final String fvN = vN; final Long fId = pId;
                Optional<Variant> ex = searchIndex.searchByName(pN).stream().filter(v -> v.productId().equals(fId) && v.name().equalsIgnoreCase(fvN)).findFirst();
                if (ex.isPresent()) {
                    vCart = ex.get();
                    productService.updateProduct(fId, new ProductService.UpdateProductCommand(null, null, null, null, null, List.of(new ProductService.VariantCommand(vCart.id(), vCart.name(), vCart.sku(), price, vCart.costPrice(), vCart.stockAlertCap(), vCart.defaultVariant(), vCart.status(), stock, "Quick add adjustment")), null, uId));
                    searchIndex.refresh();
                    vCart = searchIndex.searchByName(pN).stream().filter(v -> v.productId().equals(fId) && v.name().equalsIgnoreCase(fvN)).findFirst().orElse(null);
                } else {
                    productService.updateProduct(fId, new ProductService.UpdateProductCommand(null, null, null, null, null, List.of(new ProductService.VariantCommand(null, vN, null, price, BigDecimal.ZERO, 0, false, "active", stock, null)), null, uId));
                    searchIndex.refresh();
                    vCart = searchIndex.searchByName(pN).stream().filter(v -> v.productId().equals(fId) && v.name().equalsIgnoreCase(fvN)).findFirst().orElse(null);
                }
            } else {
                productService.createProductWithVariants(new ProductService.CreateProductCommand(pN, "Quick added from POS", cat.id(), "active", null, List.of(new ProductService.VariantCommand(null, vN, null, price, BigDecimal.ZERO, 0, true, "active", stock, null)), null, uId));
                searchIndex.refresh(); final String fvN = vN;
                vCart = searchIndex.searchByName(pN).stream().filter(v -> v.productName().equalsIgnoreCase(pN) && v.name().equalsIgnoreCase(fvN)).findFirst().orElse(null);
            }
            if (vCart != null) {
                addToCart(vCart); quickProductName.clear(); quickVariantName.clear(); quickPrice.clear(); quickStock.clear(); quickCategorySearch.clear();
                selectedProductIdForQuickAdd = null; selectedCategoryForQuickAdd = null; NotificationService.success("Added to cart.");
            } else NotificationService.error("Failed to process quick add.");
        } catch (NumberFormatException e) { NotificationService.error("Please enter a valid numeric price/stock."); }
        catch (Exception e) { 
            LoggingConfig.getLogger().error("Quick add failed", e);
            NotificationService.error("Quick add failed: " + ErrorHandler.toUserMessage(e)); 
        }
    }

    private void addToCart(Variant variant) {
        Optional<CartItem> exists = currentBill.getItems().stream().filter(it -> it.getVariant().id().equals(variant.id())).findFirst();
        int nQty = exists.map(it -> it.getQuantity() + 1).orElse(1);
        if (isInventoryRestrictionsEnabled() && variant.stock() != null && nQty > variant.stock()) {
            NotificationService.warning("Insufficient stock! Available: " + variant.stock());
            return;
        }
        if (exists.isPresent()) exists.get().setQuantity(nQty);
        else currentBill.getItems().add(new CartItem(variant, 1));
        refreshCurrentBill();
        final CartItem target = exists.orElse(currentBill.getItems().get(currentBill.getItems().size() - 1));
        Platform.runLater(() -> {
            int i = currentBill.getItems().indexOf(target);
            if (i >= 0) {
                cartTable.getTableView().getSelectionModel().select(i, colQty);
                cartTable.getTableView().getFocusModel().focus(i, colQty);
                cartTable.getTableView().edit(i, colQty);
            }
        });
    }


    public void refreshCurrentBill() { cartTable.getTableView().refresh(); renderBillsFlowPane(); updatePaymentSectionState(); recalculateTotals(); }

    private void updatePaymentSectionState() {
        boolean has = currentBill != null && !currentBill.getItems().isEmpty();
        if (paymentCard != null) { paymentCard.setDisable(!has); paymentCard.setOpacity(has ? 1.0 : 0.52); }
    }


    private void recalculateTotals() {
        saleCalculator.recalculate(currentBill);
        updateUI();
    }


    private void updateUI() {
        subtotalLabel.setText(currencyFormat.format(currentBill.getSubtotal())); totalDiscountLabel.setText(currencyFormat.format(currentBill.getDiscountTotal()));
        taxLabel.setText(currencyFormat.format(currentBill.getTaxAmount())); totalLabel.setText(currencyFormat.format(currentBill.getTotal()));
        bottomTotalLabel.setText(currencyFormat.format(currentBill.getTotal())); bottomMrpLabel.setText(currencyFormat.format(currentBill.getTotalMrp()));
        bottomPriceTotalLabel.setText(currencyFormat.format(currentBill.getTotalPrice()));
        totalQtyLabel.setText(String.valueOf(currentBill.getItems().stream().mapToInt(CartItem::getQuantity).sum())); updateBalanceLabel();
    }


    private void updateBalanceLabel() {
        BigDecimal d = currentBill.getAmountTendered().subtract(currentBill.getTotal());

        if (d.compareTo(BigDecimal.ZERO) >= 0) {
            balanceTypeLabel.setText("Change"); balanceTypeLabel.setTextFill(Color.web("#16a34a"));
            balanceLabel.setText(currencyFormat.format(d));
            balanceLabel.setStyle("-fx-background-color: #dcfce7; -fx-text-fill: #16a34a; -fx-border-color: #bbf7d0; -fx-border-radius: 6; -fx-padding: 7 10; -fx-font-weight: bold; -fx-font-size: 14px;");
        } else {
            balanceTypeLabel.setText("Balance"); balanceTypeLabel.setTextFill(Color.web("#64748b"));
            balanceLabel.setText(currencyFormat.format(d.abs()));
            balanceLabel.setStyle("-fx-background-color: #f1f5f9; -fx-text-fill: #64748b; -fx-border-color: #e2e8f0; -fx-border-radius: 6; -fx-padding: 7 10; -fx-font-weight: bold; -fx-font-size: 14px;");
        }
        if (!currentBill.getItems().isEmpty() && currentBill.getSelectedPaymentMethod() != null) {
            boolean vP = currentBill.isFullPayment() ? d.compareTo(BigDecimal.ZERO) >= 0 : (currentBill.getAmountTendered().compareTo(BigDecimal.ZERO) > 0 && currentBill.getAmountTendered().compareTo(currentBill.getTotal()) < 0);
            completeButton.setDisable(!vP);

        } else completeButton.setDisable(true);
        updateTenderedVisibility();
    }

    private void updateTenderedVisibility() {
        if (tenderedBalanceContainer == null) return;
        PaymentMethod m = currentBill.getSelectedPaymentMethod(); boolean fP = currentBill.isFullPayment();
        if (m == null) { tenderedBalanceContainer.setVisible(true); tenderedBalanceContainer.setManaged(true); return; }
        String n = m.name().toUpperCase(); boolean isD = n.contains("DEBIT") || n.contains("CREDIT") || n.contains("UPI") || n.contains("CARD");
        boolean hide = isD && fP; tenderedBalanceContainer.setVisible(!hide); tenderedBalanceContainer.setManaged(!hide);
        if (hide) currentBill.setAmountTendered(currentBill.getTotal());
    }


    @FXML
    private void handleCompleteSale() {
        if (currentBill.getItems().isEmpty()) return;
        if (currentBill.getSelectedPaymentMethod() == null) {

            NotificationService.error("Please select a payment method");
            return;
        }

        // Prepare data for the background task
        final List<CreateSaleItemRequest> items = currentBill.getItems().stream()
                .map(it -> new CreateSaleItemRequest(it.getVariant().id(), it.getQuantity(), it.getDiscountAmount(), it.getPricePerUnit()))
                .toList();
        final BigDecimal discount = currentBill.isDiscountFixed() ? currentBill.getOverallDiscountValue() 
                : currentBill.getSubtotal().multiply(currentBill.getOverallDiscountValue()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        final BigDecimal paidAmount = currentBill.isFullPayment() ? currentBill.getTotal() : currentBill.getAmountTendered();
        final Long paymentMethodId = currentBill.getSelectedPaymentMethod().id();

        final long userId = AuthContext.getCurrentUser().id();
        
        final String customerName = currentBill.getCustomerName().trim();
        final String customerPhone = currentBill.getCustomerPhone().trim();
        final String customerEmail = currentBill.getCustomerEmail().trim();
        final String customerAddress = currentBill.getCustomerAddress().trim();
        final Long existingCustomerId = currentBill.getSelectedCustomer() != null ? currentBill.getSelectedCustomer().id() : null;
        final BigDecimal totalToDisplay = currentBill.getTotal();

        final AuthUser taskUser = AuthContext.getCurrentUser();

        if (taskUser == null) {
            NotificationService.error("You are not logged in. Please log in again.");
            return;
        }

        completeButton.setDisable(true);
        completeButton.setText("Processing...");

        javafx.concurrent.Task<SaleResponse> task = new javafx.concurrent.Task<>() {
            @Override
            protected SaleResponse call() throws Exception {
                // Background thread must inherit AuthContext from parent thread
                AuthContext.setCurrentUser(taskUser);
                try {
                    Long cId = existingCustomerId;
                    
                    // 1. Handle Customer logic (Service calls)
                    if (cId == null && (!customerName.isEmpty() || !customerPhone.isEmpty())) {
                        try {
                            Optional<Customer> ex = customerService.getCustomers(
                                    new com.possum.shared.dto.CustomerFilter(customerPhone, 1, 1, 0, 10, "name", "asc")
                            ).items().stream().filter(c -> c.phone().equals(customerPhone)).findFirst();
                            
                            if (ex.isPresent()) {
                                cId = ex.get().id();
                            } else {
                                Customer nC = customerService.createCustomer(customerName, customerPhone, customerEmail, customerAddress);
                                cId = nC.id();
                                final String createdName = nC.name();
                                Platform.runLater(() -> {
                                    NotificationService.success("New customer added: " + createdName);
                                    loadCombos();
                                });
                            }
                        } catch (Exception e) {
                            Platform.runLater(() -> NotificationService.warning("Failed to automatically add customer: " + e.getMessage()));
                        }
                    }

                    // 2. Create the Sale
                    CreateSaleRequest request = new CreateSaleRequest(
                            items, 
                            cId, 
                            discount.compareTo(BigDecimal.ZERO) > 0 ? discount : null, 
                            List.of(new PaymentRequest(paidAmount, paymentMethodId))
                    );
                    return salesService.createSale(request, userId);
                } finally {
                    AuthContext.clear();
                }
            }
        };

        task.setOnSucceeded(e -> {
            SaleResponse resp = task.getValue();
            completeButton.setText("Complete Sale");
            
            // Handle Printing UI Confirmation
            if (confirmPrint()) {
                printReceipt(resp);
            }
            
            NotificationService.success("Sale completed successfully! Total: " + currencyFormat.format(totalToDisplay));
            handleClearCart();
            completeButton.setDisable(false);
        });

        task.setOnFailed(e -> {
            Throwable ex = task.getException();
            LoggingConfig.getLogger().error("Sale completion failed", ex);
            NotificationService.error("Sale failed: " + ErrorHandler.toUserMessage(ex));
            completeButton.setText("Complete Sale");
            completeButton.setDisable(false);
        });

        new Thread(task).start();
    }

    private boolean confirmPrint() {
        Alert a = new Alert(Alert.AlertType.CONFIRMATION); a.setTitle("Print Receipt"); a.setHeaderText(null); a.setContentText("Do you want to print the bill?"); a.initOwner(rootPane.getScene().getWindow());
        ButtonType bY = new ButtonType("Yes", ButtonBar.ButtonData.YES), bN = new ButtonType("No", ButtonBar.ButtonData.NO);
        a.getButtonTypes().setAll(bY, bN); return a.showAndWait().filter(r -> r == bY).isPresent();
    }

    private void printReceipt(SaleResponse sale) {
        try {
            GeneralSettings generalSettings = settingsStore.loadGeneralSettings();
            BillSettings billSettings = settingsStore.loadBillSettings();
            String html = BillRenderer.renderBill(sale, generalSettings, billSettings);
            String configuredPrinter = generalSettings.getDefaultPrinterName();

            printerService.printInvoiceDetailed(html, configuredPrinter, billSettings.getPaperWidth())
                    .thenAccept(this::handlePrintOutcome)
                    .exceptionally(ex -> {
                        Platform.runLater(() -> NotificationService.error("Print error: " + ex.getMessage()));
                        return null;
                    });

            Platform.runLater(() -> { new BillPreviewDialog(html, rootPane.getScene().getWindow()).showAndWait(); });
        } catch (Exception ex) {
            NotificationService.error("Failed to prepare receipt for printing: " + ex.getMessage());
        }
    }

    private void handlePrintOutcome(PrintOutcome outcome) {
        if (outcome.success()) {
            return;
        }
        Platform.runLater(() -> NotificationService.warning("Print failed: " + outcome.message()));
    }

    @FXML private void handleClearCart() { currentBill.reset(); refreshCurrentBill(); switchBill(currentBill.getIndex()); }


    private void setupSearchAutocomplete() {
        searchResultsView.getStyleClass().add("search-results-list"); applyPopupListStyles(searchResultsView);
        searchPopup.getContent().add(searchResultsView); searchPopup.setAutoHide(true);
        searchResultsView.setCellFactory(lv -> new ListCell<>() {
            @Override protected void updateItem(Variant item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || item == null) { setText(null); setGraphic(null); }
                else {
                    VBox b = new VBox(2); b.getStyleClass().add("search-item-box");
                    Label n = new Label(item.productName() + (item.name().equals("Default") ? "" : " - " + item.name())); n.getStyleClass().add("search-item-name");
                    Label d = new Label(item.sku() + " • " + currencyFormat.format(item.price()) + " • Stock: " + (item.stock() != null ? item.stock() : "∞"));
                    d.getStyleClass().add("search-item-details"); b.getChildren().addAll(n, d); setGraphic(b);
                }
            }
        });
        searchField.textProperty().addListener((o, ol, q) -> showAutocompletePopup(q != null ? q.trim() : ""));
        searchField.focusedProperty().addListener((o, ol, f) -> { if (!f) Platform.runLater(() -> { if (!searchResultsView.isFocused()) searchPopup.hide(); }); });
    }

    private void showAutocompletePopup(String query) {
        List<Variant> res = query.isEmpty() ? searchIndex.searchByName("") : searchIndex.searchByName(query);
        if (res.isEmpty() && query.isEmpty()) res = searchIndex.searchByName(" ");
        if (!res.isEmpty()) {
            searchResultsView.getItems().setAll(res); searchResultsView.setPrefHeight(Math.min(res.size() * 52 + 10, 400)); searchResultsView.setPrefWidth(Math.max(searchField.getWidth(), 300));
            javafx.geometry.Point2D p = searchField.localToScreen(0, searchField.getHeight() + 5);
            if (p != null) {
                if (p.getY() + searchResultsView.getPrefHeight() > searchField.getScene().getWindow().getHeight()) searchPopup.show(searchField, p.getX(), p.getY() - searchField.getHeight() - searchResultsView.getPrefHeight() - 10);
                else searchPopup.show(searchField, p.getX(), p.getY());
            }
        } else searchPopup.hide();
    }

    // Internal BillState and CartItem removed. Using domain models instead.




    public void moveFocusNext(int row, TableColumn<CartItem, ?> cur) {
        Platform.runLater(() -> {
            if (cur == colQty) { cartTable.getTableView().getSelectionModel().select(row, colPrice); cartTable.getTableView().edit(row, colPrice); }
            else if (cur == colPrice) { cartTable.getTableView().getSelectionModel().select(row, colDiscountPct); cartTable.getTableView().edit(row, colDiscountPct); }
            else if (cur == colDiscountPct) { cartTable.getTableView().getSelectionModel().select(row, colDiscountAmt); cartTable.getTableView().edit(row, colDiscountAmt); }
            else if (cur == colDiscountAmt) { searchField.requestFocus(); searchField.selectAll(); }
        });
    }

    public void moveToNext() {
        @SuppressWarnings("unchecked")
        TablePosition<CartItem, ?> pos = cartTable.getTableView().getFocusModel().getFocusedCell();
        if (pos != null) {
            int c = cartTable.getTableView().getVisibleLeafIndex(pos.getTableColumn());
            if (c < cartTable.getTableView().getVisibleLeafColumns().size() - 1) { cartTable.getTableView().getSelectionModel().select(pos.getRow(), cartTable.getTableView().getVisibleLeafColumn(c + 1)); cartTable.getTableView().edit(pos.getRow(), cartTable.getTableView().getVisibleLeafColumn(c + 1)); }
            else if (pos.getRow() < cartTable.getTableView().getItems().size() - 1) { cartTable.getTableView().getSelectionModel().select(pos.getRow() + 1, cartTable.getTableView().getVisibleLeafColumn(0)); cartTable.getTableView().edit(pos.getRow() + 1, cartTable.getTableView().getVisibleLeafColumn(0)); }
        }
    }

    public void moveToPrevious() {
        @SuppressWarnings("unchecked")
        TablePosition<CartItem, ?> pos = cartTable.getTableView().getFocusModel().getFocusedCell();
        if (pos != null) {
            int c = cartTable.getTableView().getVisibleLeafIndex(pos.getTableColumn());
            if (c > 0) { cartTable.getTableView().getSelectionModel().select(pos.getRow(), cartTable.getTableView().getVisibleLeafColumn(c - 1)); cartTable.getTableView().edit(pos.getRow(), cartTable.getTableView().getVisibleLeafColumn(c - 1)); }
            else if (pos.getRow() > 0) { int l = cartTable.getTableView().getVisibleLeafColumns().size() - 1; cartTable.getTableView().getSelectionModel().select(pos.getRow() - 1, cartTable.getTableView().getVisibleLeafColumn(l)); cartTable.getTableView().edit(pos.getRow() - 1, cartTable.getTableView().getVisibleLeafColumn(l)); }
        }
    }

    private void setupQuickAddAutocomplete() {
        quickProductResultsView.getStyleClass().add("search-results-list"); applyPopupListStyles(quickProductResultsView);
        quickProductPopup.getContent().add(quickProductResultsView); quickProductPopup.setAutoHide(true);
        quickProductResultsView.setCellFactory(lv -> new ListCell<>() {
            @Override protected void updateItem(Variant item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || item == null) { setText(null); setGraphic(null); }
                else {
                    VBox b = new VBox(2); b.getStyleClass().add("search-item-box");
                    Label n = new Label(item.productName()); n.getStyleClass().add("search-item-name");
                    Label d = new Label(item.categoryName() != null ? item.categoryName() : "No Category"); d.getStyleClass().add("search-item-details");
                    b.getChildren().addAll(n, d); setGraphic(b);
                }
            }
        });
        quickProductName.textProperty().addListener((o, ol, q) -> { if (!isAutofilling) showQuickProductAutocompletePopup(q != null ? q.trim() : ""); });
        quickProductResultsView.setOnMouseClicked(e -> { Variant v = quickProductResultsView.getSelectionModel().getSelectedItem(); if (v != null) selectProductForQuickAdd(v); });
        quickProductResultsView.setOnKeyPressed(e -> { if (e.getCode() == KeyCode.ENTER) { Variant v = quickProductResultsView.getSelectionModel().getSelectedItem(); if (v != null) selectProductForQuickAdd(v); } });
    }

    private void selectProductForQuickAdd(Variant v) {
        isAutofilling = true;
        try { quickProductName.setText(v.productName()); selectedProductIdForQuickAdd = v.productId();
            if (v.categoryName() != null) categoryService.getAllCategories().stream().filter(c -> c.name().equalsIgnoreCase(v.categoryName())).findFirst().ifPresent(this::selectCategoryForQuickAdd);
            quickProductPopup.hide(); quickVariantName.requestFocus();
        } finally { isAutofilling = false; }
    }

    private void showQuickProductAutocompletePopup(String query) {
        if (query.isEmpty()) { quickProductPopup.hide(); selectedProductIdForQuickAdd = null; return; }
        List<Variant> res = searchIndex.searchByName(query).stream().filter(distinctByKey(Variant::productId)).limit(10).toList();
        if (!res.isEmpty()) {
            quickProductResultsView.getItems().setAll(res); quickProductResultsView.setPrefHeight(Math.min(res.size() * 52 + 10, 300)); quickProductResultsView.setPrefWidth(Math.max(quickProductName.getWidth(), 300));
            javafx.geometry.Point2D p = quickProductName.localToScreen(0, quickProductName.getHeight() + 2); if (p != null) quickProductPopup.show(quickProductName, p.getX(), p.getY());
        } else { quickProductPopup.hide(); selectedProductIdForQuickAdd = null; }
    }

    private void setupCategoryAutocomplete() {
        quickCategoryResultsView.getStyleClass().add("search-results-list"); applyPopupListStyles(quickCategoryResultsView);
        quickCategoryPopup.getContent().add(quickCategoryResultsView); quickCategoryPopup.setAutoHide(true);
        quickCategoryResultsView.setCellFactory(lv -> new ListCell<>() {
            @Override protected void updateItem(Category it, boolean e) {
                super.updateItem(it, e);
                if (e || it == null) { setText(null); setGraphic(null); }
                else { VBox b = new VBox(2); b.getStyleClass().add("search-item-box"); Label n = new Label(it.name()); n.getStyleClass().add("search-item-name"); b.getChildren().add(n); setGraphic(b); setText(null); }
            }
        });
        quickCategorySearch.textProperty().addListener((o, ol, q) -> { if (!isAutofilling) showCategoryAutocompletePopup(q != null ? q.trim() : ""); });
        quickCategoryResultsView.setOnMouseClicked(e -> { Category c = quickCategoryResultsView.getSelectionModel().getSelectedItem(); if (c != null) selectCategoryForQuickAdd(c); });
        quickCategoryResultsView.setOnKeyPressed(e -> { if (e.getCode() == KeyCode.ENTER) { Category c = quickCategoryResultsView.getSelectionModel().getSelectedItem(); if (c != null) selectCategoryForQuickAdd(c); } });
    }

    private void selectCategoryForQuickAdd(Category c) { isAutofilling = true; try { quickCategorySearch.setText(c.name()); selectedCategoryForQuickAdd = c; quickCategoryPopup.hide(); } finally { isAutofilling = false; } }

    private void showCategoryAutocompletePopup(String query) {
        if (query.isEmpty()) { quickCategoryPopup.hide(); selectedCategoryForQuickAdd = null; return; }
        List<Category> res = categoryService.getAllCategories().stream().filter(c -> c.name().toLowerCase().contains(query.toLowerCase())).limit(10).toList();
        if (!res.isEmpty()) {
            quickCategoryResultsView.getItems().setAll(res); quickCategoryResultsView.setPrefHeight(Math.min(res.size() * 36 + 10, 250)); quickCategoryResultsView.setPrefWidth(Math.max(quickCategorySearch.getWidth(), 250));
            javafx.geometry.Point2D p = quickCategorySearch.localToScreen(0, quickCategorySearch.getHeight() + 2); if (p != null) quickCategoryPopup.show(quickCategorySearch, p.getX(), p.getY());
        } else { quickCategoryPopup.hide(); selectedCategoryForQuickAdd = null; }
    }

    private static <T> java.util.function.Predicate<T> distinctByKey(java.util.function.Function<? super T, ?> k) { java.util.Set<Object> s = java.util.concurrent.ConcurrentHashMap.newKeySet(); return t -> s.add(k.apply(t)); }

    private void applyPopupListStyles(ListView<?> lv) {
        String s = Objects.requireNonNull(getClass().getResource("/styles/pos.css")).toExternalForm();
        if (!lv.getStylesheets().contains(s)) lv.getStylesheets().add(s);
    }

    public boolean isInventoryRestrictionsEnabled() {
        try {
            return settingsStore.loadGeneralSettings().isInventoryAlertsAndRestrictionsEnabled();
        } catch (Exception ex) {
            return true;
        }
    }
}
