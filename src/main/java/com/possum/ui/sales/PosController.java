package com.possum.ui.sales;

import com.possum.application.auth.AuthContext;
import com.possum.application.auth.AuthUser;
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

public class PosController {

    @FXML
    private VBox leftVBox;
    @FXML
    private VBox cartCardVBox;
    @FXML
    private HBox searchDock;
    @FXML
    private VBox paymentCard;
    @FXML
    private HBox tenderedBalanceContainer;
    @FXML
    private StackPane rightPane;
    @FXML
    private TableView<CartItem> cartTable;
    @FXML
    private TableColumn<CartItem, String> colSno;
    @FXML
    private TableColumn<CartItem, String> colSku;
    @FXML
    private TableColumn<CartItem, String> colProduct;
    @FXML
    private TableColumn<CartItem, CartItem> colQty;
    @FXML
    private TableColumn<CartItem, CartItem> colPrice;
    @FXML
    private TableColumn<CartItem, CartItem> colDiscountPct;
    @FXML
    private TableColumn<CartItem, CartItem> colDiscountAmt;
    @FXML
    private TableColumn<CartItem, String> colTotal;
    @FXML
    private TableColumn<CartItem, String> colMrp;

    @FXML
    private TextField searchField;
    @FXML
    private Label totalQtyLabel;
    @FXML
    private Label bottomTotalLabel;
    @FXML
    private Label bottomMrpLabel;
    @FXML
    private Label bottomPriceTotalLabel;

    @FXML
    private TextField quickProductName;
    @FXML
    private TextField quickVariantName;
    @FXML
    private TextField quickStock;
    @FXML
    private TextField quickPrice;
    @FXML
    private TextField quickCategorySearch;

    @FXML
    private ComboBox<Customer> customerCombo;
    @FXML
    private TextField customerNameField;
    @FXML
    private TextField customerPhoneField;
    @FXML
    private TextField customerEmailField;
    @FXML
    private TextField customerAddressField;

    @FXML
    private ComboBox<PaymentMethod> paymentMethodCombo;

    @FXML
    private ToggleButton btnFullPayment;
    @FXML
    private ToggleButton btnPartialPayment;
    @FXML
    private TextField discountField;
    @FXML
    private ToggleButton btnDiscountFixed;
    @FXML
    private ToggleButton btnDiscountPercent;

    @FXML
    private Label subtotalLabel;
    @FXML
    private Label totalDiscountLabel;
    @FXML
    private Label taxLabel;
    @FXML
    private Label totalLabel;

    @FXML
    private TextField tenderedField;
    @FXML
    private Label balanceTypeLabel;
    @FXML
    private Label balanceLabel;

    @FXML
    private Button completeButton;
    @FXML
    private HBox billsFlowPane;
    @FXML
    private Button btnResetCustomer;
    @FXML
    private StackPane rootPane;
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

    private final NumberFormat currencyFormat = NumberFormat.getCurrencyInstance(Locale.US);

    private static final int MAX_BILLS = 9;
    private final List<BillState> bills = new ArrayList<>();
    private BillState currentBill;

    public PosController(SalesService salesService, com.possum.application.people.CustomerService customerService,
            ProductSearchIndex searchIndex, TaxEngine taxEngine,
            PrinterService printerService, SettingsStore settingsStore,
            ProductService productService, CategoryService categoryService) {
        this.salesService = salesService;
        this.customerService = customerService;
        this.searchIndex = searchIndex;
        this.taxEngine = taxEngine;
        this.printerService = printerService;
        this.settingsStore = settingsStore;
        this.productService = productService;
        this.categoryService = categoryService;
    }

    @FXML
    public void initialize() {
        setupQuickAdd();
        if (completeButton != null) {
            com.possum.ui.common.UIPermissionUtil.requirePermission(completeButton,
                    com.possum.application.auth.Permissions.SALES_CREATE);
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
        colSno.setCellValueFactory(
                cell -> new SimpleStringProperty(String.valueOf(cartTable.getItems().indexOf(cell.getValue()) + 1)));

        colSku.setCellValueFactory(cell -> new SimpleStringProperty(cell.getValue().variant.sku()));

        colProduct.setCellValueFactory(cell -> {
            Variant v = cell.getValue().variant;
            String disp = v.productName();
            if (v.name() != null && !v.name().equalsIgnoreCase("Standard")) {
                disp += " (" + v.name() + ")";
            }
            return new SimpleStringProperty(disp);
        });

        colQty.setCellValueFactory(cell -> new SimpleObjectProperty<>(cell.getValue()));
        colQty.setEditable(true);
        colQty.setCellFactory(col -> new EditableQuantityCell());

        colPrice.setCellValueFactory(cell -> new SimpleObjectProperty<>(cell.getValue()));
        colPrice.setEditable(true);
        colPrice.setCellFactory(col -> new EditablePriceCell());

        colMrp.setCellValueFactory(
                cell -> new SimpleStringProperty(currencyFormat.format(cell.getValue().variant.price())));

        colDiscountPct.setCellValueFactory(cell -> new SimpleObjectProperty<>(cell.getValue()));
        colDiscountPct.setEditable(true);
        colDiscountPct.setCellFactory(col -> new EditableDiscountPctCell());

        colDiscountAmt.setCellValueFactory(cell -> new SimpleObjectProperty<>(cell.getValue()));
        colDiscountAmt.setEditable(true);
        colDiscountAmt.setCellFactory(col -> new EditableDiscountAmtCell());

        colTotal.setCellValueFactory(
                cell -> new SimpleStringProperty(currencyFormat.format(cell.getValue().netLineTotal)));

        cartTable.setEditable(true);
        cartTable.getSelectionModel().setSelectionMode(SelectionMode.SINGLE);
        cartTable.getSelectionModel().setCellSelectionEnabled(true);
        cartTable.setColumnResizePolicy(TableView.CONSTRAINED_RESIZE_POLICY);

        cartTable.setOnKeyPressed(e -> {
            if (e.getCode() == KeyCode.DELETE || e.getCode() == KeyCode.BACK_SPACE) {
                // Delete the selected row
                CartItem selectedItem = cartTable.getSelectionModel().getSelectedItem();
                if (selectedItem != null) {
                    currentBill.items.remove(selectedItem);
                    refreshCurrentBill();
                    e.consume();
                }
            } else if (e.getCode() == KeyCode.ENTER || e.getCode() == KeyCode.SPACE
                    || (!e.isControlDown() && !e.isAltDown() && e.getText().length() > 0)) {
                // Start editing on Enter, Space, or any character key
                TablePosition<CartItem, ?> pos = cartTable.getFocusModel().getFocusedCell();
                if (pos != null && pos.getTableColumn() != null) {
                    TableColumn<CartItem, ?> col = pos.getTableColumn();
                    if (col == colQty || col == colPrice || col == colDiscountAmt || col == colDiscountPct) {
                        cartTable.edit(pos.getRow(), col);
                        e.consume();
                    }
                }
            }
        });

        cartTable.setFixedCellSize(60);
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
            customerCombo.getItems().setAll(customers);
        } catch (Exception e) {
        }

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
                oldVal.setSelected(true); // Prevent unselecting both
                return;
            }
            boolean isFull = newVal == btnFullPayment;
            currentBill.fullPayment = isFull;
            updateBalanceLabel();
            refreshCurrentBill();
        });

        discountTypeGroup.selectedToggleProperty().addListener((obs, oldVal, newVal) -> {
            if (newVal == null) {
                oldVal.setSelected(true);
                return;
            }
            boolean isFixed = newVal == btnDiscountFixed;
            currentBill.isDiscountFixed = isFixed;
            recalculateTotals();
        });
    }

    private void setupListeners() {
        searchField.setOnAction(e -> {
            String query = searchField.getText().trim();
            if (query.isEmpty())
                return;

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
                Platform.runLater(() -> {
                    searchField.clear();
                    searchPopup.hide();
                });
            }
        });

        searchField.setOnKeyPressed(e -> {
            if (e.getCode() == KeyCode.DOWN) {
                if (!cartTable.getItems().isEmpty()) {
                    cartTable.requestFocus();
                    // Focus on first row SKU column
                    cartTable.getSelectionModel().select(0, colSku);
                    cartTable.getFocusModel().focus(0, colSku);
                }
            }
        });

        searchField.setOnMouseClicked(e -> {
            String query = searchField.getText().trim();
            showAutocompletePopup(query);
        });

        discountField.textProperty().addListener((obs, oldVal, newVal) -> {
            try {
                if (newVal.isEmpty())
                    currentBill.overallDiscountValue = BigDecimal.ZERO;
                else
                    currentBill.overallDiscountValue = new BigDecimal(newVal);
                recalculateTotals();
            } catch (Exception e) {
            }
        });

        tenderedField.textProperty().addListener((obs, oldVal, newVal) -> {
            try {
                if (newVal.isEmpty())
                    currentBill.amountTendered = BigDecimal.ZERO;
                else
                    currentBill.amountTendered = new BigDecimal(newVal);
                updateBalanceLabel();
            } catch (Exception e) {
            }
        });

        customerCombo.valueProperty().addListener((obs, old, val) -> {
            if (isAutofilling)
                return;
            isAutofilling = true;
            try {
                currentBill.selectedCustomer = val;
                if (val != null) {
                    customerNameField.setText(val.name());
                    customerPhoneField.setText(val.phone());
                    customerEmailField.setText(val.email() != null ? val.email() : "");
                    customerAddressField.setText(val.address() != null ? val.address() : "");
                } else {
                    // If switching to "Walk-in" (null selection), we don't necessarily want to
                    // clear fields
                    // because the user might be typing a NEW customer's details.
                    // However, if it was explicitly unselected by the user, clearing might be
                    // expected.
                    // Given the flow, we'll only clear if the fields currently match the OLD
                    // selection.
                    if (old != null && old.name().equals(customerNameField.getText().trim())
                            && old.phone().equals(customerPhoneField.getText().trim())) {
                        customerNameField.clear();
                        customerPhoneField.clear();
                        customerEmailField.clear();
                        customerAddressField.clear();
                    }
                }
            } finally {
                isAutofilling = false;
            }
        });

        customerNameField.textProperty().addListener((obs, old, val) -> {
            if (isAutofilling)
                return;
            currentBill.customerName = val;
            checkCustomerMatch();
            recalculateTotals();
        });
        customerPhoneField.textProperty().addListener((obs, old, val) -> {
            if (isAutofilling)
                return;
            currentBill.customerPhone = val;
            checkCustomerMatch();
            recalculateTotals();
        });
        customerEmailField.textProperty().addListener((obs, old, val) -> {
            if (isAutofilling)
                return;
            currentBill.customerEmail = val;
        });
        customerAddressField.textProperty().addListener((obs, old, val) -> {
            if (isAutofilling)
                return;
            currentBill.customerAddress = val;
            recalculateTotals();
        });

        paymentMethodCombo.valueProperty().addListener((obs, old, val) -> {
            currentBill.selectedPaymentMethod = val;
            updateBalanceLabel();
        });
    }

    private void setupKeyboardShortcuts() {
        Platform.runLater(() -> {
            if (rootPane == null || rootPane.getScene() == null) {
                return;
            }
            rootPane.getScene().addEventFilter(javafx.scene.input.KeyEvent.KEY_PRESSED, e -> {
                if ((e.isControlDown() || e.isMetaDown()) && e.getCode() == KeyCode.K) {
                    focusSearchAndOpen(true);
                    e.consume();
                    return;
                }

                if ((e.isControlDown() || e.isMetaDown()) && e.getCode() == KeyCode.ENTER) {
                    if (!completeButton.isDisabled()) {
                        handleCompleteSale();
                    }
                    e.consume();
                    return;
                }

                if ((e.isControlDown() || e.isMetaDown()) && e.getCode() == KeyCode.N) {
                    openOrSwitchToNextBill();
                    e.consume();
                    return;
                }

                if ((e.isControlDown() || e.isMetaDown()) && e.getCode().isDigitKey()) {
                    String text = e.getText();
                    if (text != null && !text.isEmpty()) {
                        int digit = text.charAt(0) - '1';
                        if (digit >= 0 && digit < MAX_BILLS) {
                            switchBill(digit);
                            e.consume();
                        }
                    }
                    return;
                }

                if (e.getCode() == KeyCode.F12) {
                    if (currentBill.items.isEmpty()) {
                        NotificationService.warning("Add items to cart first");
                        e.consume();
                        return;
                    }

                    if (tenderedField.isFocused()) {
                        if (!completeButton.isDisabled()) {
                            handleCompleteSale();
                        } else {
                            if (currentBill.fullPayment) {
                                NotificationService.warning("Tendered amount must be greater than or equal to total");
                            } else {
                                NotificationService.warning("Partial payment must be between 0 and total");
                            }
                        }
                    } else {
                        tenderedField.requestFocus();
                        tenderedField.selectAll();
                    }
                    e.consume();
                    return;
                }

                if (e.getCode() == KeyCode.ESCAPE) {
                    searchPopup.hide();
                    quickProductPopup.hide();
                    quickCategoryPopup.hide();
                    rootPane.requestFocus();
                    e.consume();
                    return;
                }

                if (!e.isControlDown() && !e.isMetaDown() && e.getCode() == KeyCode.SLASH && e.isShiftDown()) {
                    NotificationService.info(
                            "POS shortcuts: Ctrl+K Search, Ctrl+Enter Complete, Ctrl+N New Bill, Ctrl+1..9 Switch Bill, Esc Close popups");
                    e.consume();
                }
            });
        });
    }

    private void setupLayoutSizing() {
        Platform.runLater(() -> {
            if (rootPane == null || leftVBox == null || rightPane == null) {
                return;
            }
            leftVBox.prefWidthProperty().bind(rootPane.widthProperty().multiply(0.60));
            rightPane.prefWidthProperty().bind(rootPane.widthProperty().multiply(0.40));
        });
    }

    private void focusSearchAndOpen(boolean openPopup) {
        searchField.requestFocus();
        searchField.selectAll();
        if (openPopup) {
            showAutocompletePopup(searchField.getText() != null ? searchField.getText().trim() : "");
        }
    }

    private void openOrSwitchToNextBill() {
        for (BillState bill : bills) {
            if (bill.items.isEmpty() && bill.index != currentBill.index) {
                switchBill(bill.index);
                return;
            }
        }
        int next = (currentBill.index + 1) % MAX_BILLS;
        if (next == currentBill.index) {
            return;
        }
        bills.get(next).reset();
        switchBill(next);
        NotificationService.info("Switched to a fresh bill tab");
    }

    @FXML
    private void handleResetCustomer() {
        isAutofilling = true;
        try {
            customerCombo.setValue(null);
            customerNameField.clear();
            customerPhoneField.clear();
            customerEmailField.clear();
            customerAddressField.clear();

            currentBill.selectedCustomer = null;
            currentBill.customerName = "";
            currentBill.customerPhone = "";
            currentBill.customerEmail = "";
            currentBill.customerAddress = "";

            recalculateTotals();
        } finally {
            isAutofilling = false;
        }
    }

    private void checkCustomerMatch() {
        if (isAutofilling)
            return;
        Customer selected = customerCombo.getValue();
        if (selected != null) {
            String name = customerNameField.getText().trim();
            String phone = customerPhoneField.getText().trim();
            if (!name.equalsIgnoreCase(selected.name()) || !phone.equals(selected.phone())) {
                // Modified fields no longer match selected customer - unselect in combo
                Platform.runLater(() -> {
                    if (customerCombo.getValue() != null) {
                        customerCombo.setValue(null);
                    }
                });
            }
        }
    }

    private void renderBillsFlowPane() {
        billsFlowPane.getChildren().clear();
        for (int i = 0; i < MAX_BILLS; i++) {
            BillState bill = bills.get(i);
            Button btn = new Button(String.valueOf(i + 1));

            boolean isActive = currentBill.index == i;
            boolean hasItems = !bill.items.isEmpty();

            String style = "-fx-font-weight: bold; -fx-background-radius: 8; -fx-border-radius: 8; -fx-min-width: 30; -fx-min-height: 30; -fx-font-size: 11px; ";
            if (isActive) {
                style += "-fx-background-color: #0f172a; -fx-text-fill: white; -fx-border-color: #0f172a; -fx-border-width: 1;";
            } else if (hasItems) {
                style += "-fx-background-color: #fef3c7; -fx-text-fill: #d97706; -fx-border-color: #fcd34d; -fx-border-width: 1;";
            } else {
                style += "-fx-background-color: #f8fafc; -fx-text-fill: #94a3b8; -fx-border-color: #e2e8f0; -fx-border-width: 1;";
            }
            btn.setStyle(style);
            btn.setCursor(javafx.scene.Cursor.HAND);

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
        discountField.setText(currentBill.overallDiscountValue.compareTo(BigDecimal.ZERO) > 0
                ? currentBill.overallDiscountValue.toString()
                : "");
        btnDiscountFixed.setSelected(currentBill.isDiscountFixed);
        btnDiscountPercent.setSelected(!currentBill.isDiscountFixed);
        tenderedField.setText(
                currentBill.amountTendered.compareTo(BigDecimal.ZERO) > 0 ? currentBill.amountTendered.toString() : "");
        isAutofilling = true;
        try {
            customerCombo.setValue(currentBill.selectedCustomer);
            customerNameField.setText(currentBill.customerName != null ? currentBill.customerName : "");
            customerPhoneField.setText(currentBill.customerPhone != null ? currentBill.customerPhone : "");
            customerEmailField.setText(currentBill.customerEmail != null ? currentBill.customerEmail : "");
            customerAddressField.setText(currentBill.customerAddress != null ? currentBill.customerAddress : "");
        } finally {
            isAutofilling = false;
        }

        paymentMethodCombo.setValue(currentBill.selectedPaymentMethod);
        if (currentBill.selectedPaymentMethod == null && !paymentMethodCombo.getItems().isEmpty()) {
            currentBill.selectedPaymentMethod = paymentMethodCombo.getItems().get(0);
            paymentMethodCombo.setValue(currentBill.selectedPaymentMethod);
        }

        refreshCurrentBill();
        focusSearchAndOpen(false);
    }

    private void setupQuickAdd() {
    }

    @FXML
    private void handleQuickAddProduct() {
        String pName = quickProductName.getText().trim();
        String vName = quickVariantName.getText().trim();
        String priceStr = quickPrice.getText().trim();
        String stockStr = quickStock.getText().trim();
        String catName = quickCategorySearch.getText().trim();

        if (pName.isEmpty() || priceStr.isEmpty() || catName.isEmpty()) {
            NotificationService.error("Please enter product name, price and select a category.");
            return;
        }

        Category category = selectedCategoryForQuickAdd;
        if (category == null) {
            // Find by name
            category = categoryService.getAllCategories().stream()
                    .filter(c -> c.name().equalsIgnoreCase(catName))
                    .findFirst().orElse(null);
        }

        if (category == null) {
            NotificationService.error("Please select a valid category.");
            return;
        }

        try {
            BigDecimal price = new BigDecimal(priceStr);
            int stock = stockStr.isEmpty() ? 1 : Integer.parseInt(stockStr);
            if (stock < 0)
                stock = 0;

            AuthUser currentUser = AuthContext.getCurrentUser();
            long userId = currentUser != null ? currentUser.id() : 1L;

            Variant variantToCart = null;

            // 1. Try to use selected product ID or find by exact name
            Long productId = selectedProductIdForQuickAdd;
            if (productId == null) {
                Optional<Variant> productMatch = searchIndex.searchByName(pName).stream()
                        .filter(v -> v.productName().equalsIgnoreCase(pName))
                        .findFirst();
                if (productMatch.isPresent()) {
                    productId = productMatch.get().productId();
                }
            }

            if (productId != null) {
                // Product exists, now check if variant exists for this product
                final String finalVName = vName;
                final Long currentProductId = productId;
                Optional<Variant> exactVariant = searchIndex.searchByName(pName).stream()
                        .filter(v -> v.productId().equals(currentProductId) && v.name().equalsIgnoreCase(finalVName))
                        .findFirst();

                if (exactVariant.isPresent()) {
                    variantToCart = exactVariant.get();
                    // Update stock and price
                    productService.updateProduct(currentProductId, new ProductService.UpdateProductCommand(
                            null, null, null, null, null,
                            List.of(new ProductService.VariantCommand(
                                    variantToCart.id(), variantToCart.name(), variantToCart.sku(), price,
                                    variantToCart.costPrice(),
                                    variantToCart.stockAlertCap(), variantToCart.defaultVariant(),
                                    variantToCart.status(), stock, "Quick add adjustment")),
                            null, userId));
                    searchIndex.refresh();
                    variantToCart = searchIndex.searchByName(pName).stream()
                            .filter(v -> v.productId().equals(currentProductId)
                                    && v.name().equalsIgnoreCase(finalVName))
                            .findFirst().orElse(variantToCart);
                } else {
                    // Add new variant
                    productService.updateProduct(currentProductId, new ProductService.UpdateProductCommand(
                            null, null, null, null, null,
                            List.of(new ProductService.VariantCommand(
                                    null, vName, null, price, BigDecimal.ZERO, 0, false, "active", stock, null)),
                            null, userId));
                    searchIndex.refresh();
                    variantToCart = searchIndex.searchByName(pName).stream()
                            .filter(v -> v.productId().equals(currentProductId)
                                    && v.name().equalsIgnoreCase(finalVName))
                            .findFirst().orElse(null);
                }
            } else {
                // Product doesn't exist - create new product with the variant
                ProductService.CreateProductCommand cmd = new ProductService.CreateProductCommand(
                        pName,
                        "Quick added from POS",
                        category.id(),
                        "active",
                        null,
                        List.of(new ProductService.VariantCommand(
                                null, vName, null, price, BigDecimal.ZERO, 0, true, "active", stock, null)),
                        null,
                        userId);

                productService.createProductWithVariants(cmd);
                searchIndex.refresh();
                final String finalVName = vName;
                variantToCart = searchIndex.searchByName(pName).stream()
                        .filter(v -> v.productName().equalsIgnoreCase(pName) && v.name().equalsIgnoreCase(finalVName))
                        .findFirst().orElse(null);
            }

            if (variantToCart != null) {
                addToCart(variantToCart);

                // Clear fields
                quickProductName.clear();
                quickVariantName.clear();
                quickPrice.clear();
                quickStock.clear();
                quickCategorySearch.clear();
                selectedProductIdForQuickAdd = null;
                selectedCategoryForQuickAdd = null;

                NotificationService.success("Added to cart.");
            } else {
                NotificationService.error("Failed to process quick add.");
            }

        } catch (NumberFormatException e) {
            NotificationService.error("Please enter a valid numeric price/stock.");
        } catch (Exception e) {
            NotificationService.error("Quick add failed: " + e.getMessage());
            e.printStackTrace();
        }
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

        final CartItem targetItem = existing.orElse(currentBill.items.get(currentBill.items.size() - 1));
        Platform.runLater(() -> {
            int index = currentBill.items.indexOf(targetItem);
            if (index >= 0) {
                cartTable.getSelectionModel().select(index, colQty);
                cartTable.getFocusModel().focus(index, colQty);
                cartTable.edit(index, colQty);
            }
        });
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
        updatePaymentSectionState();
        recalculateTotals();
    }

    private void updatePaymentSectionState() {
        boolean hasItems = currentBill != null && !currentBill.items.isEmpty();

        if (paymentCard != null) {
            paymentCard.setDisable(!hasItems);
            paymentCard.setOpacity(hasItems ? 1.0 : 0.52);
        }
    }

    private void recalculateTotals() {
        if (currentBill.items.isEmpty()) {
            currentBill.subtotal = BigDecimal.ZERO;
            currentBill.taxAmount = BigDecimal.ZERO;
            currentBill.total = BigDecimal.ZERO;
            currentBill.totalMrp = BigDecimal.ZERO;
            updateUI();
            return;
        }

        BigDecimal grossTotal = BigDecimal.ZERO;
        BigDecimal grossMrp = BigDecimal.ZERO;
        BigDecimal grossPriceTotal = BigDecimal.ZERO;
        for (CartItem item : currentBill.items) {
            BigDecimal lineTotal = item.pricePerUnit.multiply(BigDecimal.valueOf(item.quantity));
            grossPriceTotal = grossPriceTotal.add(lineTotal);
            grossMrp = grossMrp.add(item.variant.price().multiply(BigDecimal.valueOf(item.quantity)));
            BigDecimal lineDiscount = "fixed".equals(item.discountType)
                    ? item.discountValue
                    : lineTotal.multiply(item.discountValue).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

            item.discountAmount = lineDiscount;
            item.netLineTotal = lineTotal.subtract(lineDiscount).max(BigDecimal.ZERO);
            grossTotal = grossTotal.add(item.netLineTotal);
        }
        currentBill.totalMrp = grossMrp;
        currentBill.totalPrice = grossPriceTotal;

        BigDecimal overallDiscountAmount = BigDecimal.ZERO;
        if (currentBill.overallDiscountValue.compareTo(BigDecimal.ZERO) > 0) {
            if (currentBill.isDiscountFixed) {
                overallDiscountAmount = currentBill.overallDiscountValue;
            } else {
                overallDiscountAmount = grossTotal.multiply(currentBill.overallDiscountValue)
                        .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            }
        }

        // Calculate absolute total discount (Line discounts + Overall discount)
        BigDecimal totalLineDiscounts = currentBill.items.stream()
                .map(item -> item.discountAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        currentBill.discountTotal = totalLineDiscounts.add(overallDiscountAmount);

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
                    item.variant.productId());
            taxableItems.add(taxable);
        }

        Customer taxCustomer = currentBill.selectedCustomer;
        if (taxCustomer == null && (!currentBill.customerName.isEmpty() || !currentBill.customerAddress.isEmpty())) {
            // Use dummy customer for tax calculation if fields have values
            taxCustomer = new Customer(null, currentBill.customerName, currentBill.customerPhone,
                    currentBill.customerEmail, currentBill.customerAddress, null, null, null);
        }

        TaxCalculationResult taxResult = taxEngine.calculate(new TaxableInvoice(taxableItems), taxCustomer);
        currentBill.subtotal = grossTotal;
        currentBill.taxAmount = taxResult.totalTax();
        currentBill.total = taxResult.grandTotal();

        updateUI();
    }

    private void updateUI() {
        subtotalLabel.setText(currencyFormat.format(currentBill.subtotal));
        totalDiscountLabel.setText(currencyFormat.format(currentBill.discountTotal));
        taxLabel.setText(currencyFormat.format(currentBill.taxAmount));
        totalLabel.setText(currencyFormat.format(currentBill.total));
        bottomTotalLabel.setText(currencyFormat.format(currentBill.total));
        bottomMrpLabel.setText(currencyFormat.format(currentBill.totalMrp));
        bottomPriceTotalLabel.setText(currencyFormat.format(currentBill.totalPrice));

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
            balanceLabel.setStyle(
                    "-fx-background-color: #dcfce7; -fx-text-fill: #16a34a; -fx-border-color: #bbf7d0; -fx-border-radius: 6; -fx-padding: 7 10; -fx-font-weight: bold; -fx-font-size: 14px;");
        } else {
            balanceTypeLabel.setText("Balance");
            balanceTypeLabel.setTextFill(Color.web("#64748b"));
            balanceLabel.setText(currencyFormat.format(diff.abs()));
            balanceLabel.setStyle(
                    "-fx-background-color: #f1f5f9; -fx-text-fill: #64748b; -fx-border-color: #e2e8f0; -fx-border-radius: 6; -fx-padding: 7 10; -fx-font-weight: bold; -fx-font-size: 14px;");
        }

        if (!currentBill.items.isEmpty() && currentBill.selectedPaymentMethod != null) {
            boolean validPayment;
            if (currentBill.fullPayment) {
                // Full payment: tendered amount must be >= total
                validPayment = currentBill.amountTendered.compareTo(currentBill.total) >= 0;
            } else {
                // Partial payment: tendered must be > 0 and < total
                validPayment = currentBill.amountTendered.compareTo(BigDecimal.ZERO) > 0
                        && currentBill.amountTendered.compareTo(currentBill.total) < 0;
            }

            // High-speed check: for digital full payments, we skip the validation check
            // unless special logic is needed, but we keep it here to ensure data integrity
            completeButton.setDisable(!validPayment);
        } else {
            completeButton.setDisable(true);
        }

        updateTenderedVisibility();
    }

    private void updateTenderedVisibility() {
        if (tenderedBalanceContainer == null)
            return;

        PaymentMethod method = currentBill.selectedPaymentMethod;
        boolean isFullPayment = currentBill.fullPayment;

        if (method == null) {
            tenderedBalanceContainer.setVisible(true);
            tenderedBalanceContainer.setManaged(true);
            return;
        }

        String mName = method.name().toUpperCase();
        boolean isDigital = mName.contains("DEBIT") || mName.contains("CREDIT") || mName.contains("UPI")
                || mName.contains("CARD");

        // Hide only for Full + Digital
        boolean hide = isDigital && isFullPayment;

        tenderedBalanceContainer.setVisible(!hide);
        tenderedBalanceContainer.setManaged(!hide);

        // If hidden, technically amountTendered should be exactly the total to pass validation
        if (hide) {
            currentBill.amountTendered = currentBill.total;
        }
    }

    @FXML
    private void handleCompleteSale() {
        if (currentBill.items.isEmpty())
            return;

        try {
            List<CreateSaleItemRequest> items = currentBill.items.stream()
                    .map(item -> new CreateSaleItemRequest(
                            item.variant.id(),
                            item.quantity,
                            item.discountAmount,
                            item.pricePerUnit))
                    .toList();

            BigDecimal discount = currentBill.isDiscountFixed ? currentBill.overallDiscountValue
                    : currentBill.subtotal.multiply(currentBill.overallDiscountValue).divide(BigDecimal.valueOf(100), 2,
                            RoundingMode.HALF_UP);
            BigDecimal paidAmt = currentBill.fullPayment ? currentBill.total : currentBill.amountTendered;

            Long customerId = null;
            if (currentBill.selectedCustomer != null) {
                customerId = currentBill.selectedCustomer.id();
            } else if (!currentBill.customerName.trim().isEmpty() || !currentBill.customerPhone.trim().isEmpty()) {
                // Check if this is a "new" customer that needs to be added
                try {
                    // Try to find if a customer with this phone already exists to avoid duplicates
                    Optional<Customer> existing = customerService.getCustomers(new com.possum.shared.dto.CustomerFilter(
                            currentBill.customerPhone.trim(), 1, 1, 0, 10, "name", "asc")).items().stream()
                            .filter(c -> c.phone().equals(currentBill.customerPhone.trim()))
                            .findFirst();

                    if (existing.isPresent()) {
                        customerId = existing.get().id();
                    } else {
                        // Create new customer
                        Customer newCust = customerService.createCustomer(
                                currentBill.customerName.trim(),
                                currentBill.customerPhone.trim(),
                                currentBill.customerEmail.trim(),
                                currentBill.customerAddress.trim());
                        customerId = newCust.id();
                        NotificationService.success("New customer added: " + newCust.name());
                        // Reload customers combo
                        loadCombos();
                    }
                } catch (Exception e) {
                    NotificationService.warning("Failed to automatically add customer: " + e.getMessage());
                }
            }

            CreateSaleRequest request = new CreateSaleRequest(
                    items,
                    customerId,
                    discount.compareTo(BigDecimal.ZERO) > 0 ? discount : null,
                    List.of(new PaymentRequest(paidAmt, currentBill.selectedPaymentMethod.id())));

            long userId = AuthContext.getCurrentUser().id();
            SaleResponse response = salesService.createSale(request, userId);

            if (confirmPrint()) {
                printReceipt(response);
            }

            NotificationService
                    .success("Sale completed successfully! Total: " + currencyFormat.format(currentBill.total));
            handleClearCart();

        } catch (Exception e) {
            NotificationService.error("Sale failed: " + e.getMessage());
        }
    }

    private boolean confirmPrint() {
        Alert alert = new Alert(Alert.AlertType.CONFIRMATION);
        alert.setTitle("Print Receipt");
        alert.setHeaderText(null);
        alert.setContentText("Do you want to print the bill?");
        alert.initOwner(rootPane.getScene().getWindow());

        ButtonType btnYes = new ButtonType("Yes", ButtonBar.ButtonData.YES);
        ButtonType btnNo = new ButtonType("No", ButtonBar.ButtonData.NO);
        alert.getButtonTypes().setAll(btnYes, btnNo);

        Optional<ButtonType> result = alert.showAndWait();
        return result.isPresent() && result.get() == btnYes;
    }

    private void printReceipt(SaleResponse sale) {
        String billHtml = BillRenderer.renderBill(sale, settingsStore.loadGeneralSettings(),
                settingsStore.loadBillSettings());

        printerService.printInvoice(billHtml)
                .thenAccept(success -> {
                    if (!success)
                        Platform.runLater(() -> NotificationService.warning("Print failed"));
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
        applyPopupListStyles(searchResultsView);
        searchPopup.getContent().add(searchResultsView);
        searchPopup.setAutoHide(true);

        searchResultsView.setCellFactory(lv -> new ListCell<>() {
            @Override
            protected void updateItem(Variant item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || item == null) {
                    setText(null);
                    setGraphic(null);

                } else {
                    VBox box = new VBox(2);
                    box.getStyleClass().add("search-item-box");

                    Label name = new Label(
                            item.productName() + (item.name().equals("Default") ? "" : " - " + item.name()));
                    name.getStyleClass().add("search-item-name");

                    Label details = new Label(item.sku() + " • " + currencyFormat.format(item.price()) + " • Stock: "
                            + (item.stock() != null ? item.stock() : "∞"));
                    details.getStyleClass().add("search-item-details");

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
                    if (!searchResultsView.isFocused())
                        searchPopup.hide();
                });
            }
        });
    }

    private void showAutocompletePopup(String query) {
        List<Variant> results;
        if (query.isEmpty()) {
            // Show top results/all
            results = searchIndex.searchByName(""); // Assuming empty string returns all/top
            if (results.isEmpty())
                results = searchIndex.searchByName(" ");
        } else {
            results = searchIndex.searchByName(query);
        }

        if (!results.isEmpty()) {
            searchResultsView.getItems().setAll(results);
            searchResultsView.setPrefHeight(Math.min(results.size() * 52 + 10, 400));
            searchResultsView.setPrefWidth(Math.max(searchField.getWidth(), 300));

            javafx.geometry.Point2D pos = searchField.localToScreen(0, searchField.getHeight() + 5);
            if (pos != null) {
                // Ensure the popup doesn't go off screen bottom
                double screenHeight = searchField.getScene().getWindow().getHeight();
                if (pos.getY() + searchResultsView.getPrefHeight() > screenHeight) {
                    // Show above instead
                    searchPopup.show(searchField, pos.getX(),
                            pos.getY() - searchField.getHeight() - searchResultsView.getPrefHeight() - 10);
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
        String customerName = "";
        String customerPhone = "";
        String customerEmail = "";
        String customerAddress = "";

        PaymentMethod selectedPaymentMethod;
        boolean fullPayment = true;
        BigDecimal overallDiscountValue = BigDecimal.ZERO;
        boolean isDiscountFixed = true;
        BigDecimal amountTendered = BigDecimal.ZERO;

        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal discountTotal = BigDecimal.ZERO;
        BigDecimal taxAmount = BigDecimal.ZERO;
        BigDecimal total = BigDecimal.ZERO;
        BigDecimal totalMrp = BigDecimal.ZERO;
        BigDecimal totalPrice = BigDecimal.ZERO;

        BillState(int index) {
            this.index = index;
        }

        void reset() {
            items.clear();
            selectedCustomer = null;
            customerName = "";
            customerPhone = "";
            customerEmail = "";
            customerAddress = "";
            selectedPaymentMethod = null;

            fullPayment = true;
            overallDiscountValue = BigDecimal.ZERO;
            isDiscountFixed = true;
            amountTendered = BigDecimal.ZERO;
            subtotal = BigDecimal.ZERO;
            taxAmount = BigDecimal.ZERO;
            total = BigDecimal.ZERO;
            totalMrp = BigDecimal.ZERO;
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
            if (textField == null)
                createTextField();
            setText(null);
            setGraphic(textField);
            textField.selectAll();
            textField.requestFocus();
        }

        @Override
        public void cancelEdit() {
            super.cancelEdit();
            if (getItem() != null) {
                setText(String.valueOf(getItem().quantity));
            }
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
                    if (textField != null)
                        textField.setText(String.valueOf(item.quantity));
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
                if (!focused && isEditing())
                    commitEdit(getItem());
            });
            textField.setOnKeyPressed(e -> {
                if (e.getCode() == KeyCode.ESCAPE)
                    cancelEdit();
                else if (e.getCode() == KeyCode.ENTER) {
                    commitEdit(getItem());
                    moveFocusNext(getIndex(), colQty);
                    e.consume();
                } else if (e.getCode() == KeyCode.TAB) {
                    commitEdit(getItem());
                    if (e.isShiftDown())
                        moveToPrevious();
                    else
                        moveToNext();
                    e.consume();
                }
            });
        }

        @Override
        public void commitEdit(CartItem item) {
            if (textField != null && item != null) {
                try {
                    int newQty = Integer.parseInt(textField.getText().trim());
                    if (newQty < 1)
                        newQty = 1;
                    item.quantity = newQty;
                    refreshCurrentBill();
                } catch (NumberFormatException e) {
                }
            }
            super.commitEdit(item);
        }
    }

    private class EditablePriceCell extends TableCell<CartItem, CartItem> {
        private TextField textField;

        @Override
        public void startEdit() {
            super.startEdit();
            if (textField == null)
                createTextField();
            setText(null);
            setGraphic(textField);
            textField.selectAll();
            textField.requestFocus();
        }

        @Override
        public void cancelEdit() {
            super.cancelEdit();
            if (getItem() != null) {
                setText(getItem().pricePerUnit.toString());
            }
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
                    if (textField != null)
                        textField.setText(item.pricePerUnit.toString());
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
                if (!focused && isEditing())
                    commitEdit(getItem());
            });
            textField.setOnKeyPressed(e -> {
                if (e.getCode() == KeyCode.ESCAPE)
                    cancelEdit();
                else if (e.getCode() == KeyCode.ENTER) {
                    commitEdit(getItem());
                    moveFocusNext(getIndex(), colPrice);
                    e.consume();
                } else if (e.getCode() == KeyCode.TAB) {
                    commitEdit(getItem());
                    if (e.isShiftDown())
                        moveToPrevious();
                    else
                        moveToNext();
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
                } catch (Exception e) {
                }
            }
            super.commitEdit(item);
        }
    }

    private class EditableDiscountPctCell extends TableCell<CartItem, CartItem> {
        private TextField textField;

        @Override
        public void startEdit() {
            super.startEdit();
            if (textField == null)
                createTextField();
            setText(null);
            setGraphic(textField);
            CartItem item = getItem();
            BigDecimal lineTotal = item.pricePerUnit.multiply(BigDecimal.valueOf(item.quantity));
            BigDecimal pct = item.discountType.equals("pct") ? item.discountValue
                    : (lineTotal.compareTo(BigDecimal.ZERO) == 0 ? BigDecimal.ZERO
                            : item.discountAmount.multiply(BigDecimal.valueOf(100)).divide(lineTotal, 2,
                                    RoundingMode.HALF_UP));
            textField.setText(pct.compareTo(BigDecimal.ZERO) == 0 ? "" : pct.toString());
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
                    setGraphic(textField);
                    setText(null);
                } else
                    updateDisplay();
            }
        }

        private void updateDisplay() {
            CartItem item = getItem();
            if (item != null) {
                BigDecimal lineTotal = item.pricePerUnit.multiply(BigDecimal.valueOf(item.quantity));
                BigDecimal pct = item.discountType.equals("pct") ? item.discountValue
                        : (lineTotal.compareTo(BigDecimal.ZERO) == 0 ? BigDecimal.ZERO
                                : item.discountAmount.multiply(BigDecimal.valueOf(100)).divide(lineTotal, 2,
                                        RoundingMode.HALF_UP));
                setText(pct.compareTo(BigDecimal.ZERO) == 0 ? "0%" : pct + "%");
            }
            setGraphic(null);
        }

        private void createTextField() {
            textField = new TextField();
            textField.getStyleClass().add("table-input");
            textField.setAlignment(javafx.geometry.Pos.CENTER_RIGHT);
            textField.setOnAction(e -> commitEdit(getItem()));
            textField.focusedProperty().addListener((obs, old, focus) -> {
                if (!focus && isEditing())
                    commitEdit(getItem());
            });
            textField.setOnKeyPressed(e -> {
                if (e.getCode() == KeyCode.ENTER) {
                    commitEdit(getItem());
                    moveFocusNext(getIndex(), colDiscountPct);
                    e.consume();
                } else if (e.getCode() == KeyCode.TAB) {
                    commitEdit(getItem());
                    if (e.isShiftDown())
                        moveToPrevious();
                    else
                        moveToNext();
                    e.consume();
                } else if (e.getCode() == KeyCode.ESCAPE)
                    cancelEdit();
            });
        }

        @Override
        public void commitEdit(CartItem item) {
            if (textField != null && item != null) {
                try {
                    String val = textField.getText().trim();
                    item.discountValue = val.isEmpty() ? BigDecimal.ZERO : new BigDecimal(val);
                    item.discountType = "pct";
                    refreshCurrentBill();
                } catch (Exception e) {
                }
            }
            super.commitEdit(item);
        }
    }

    private class EditableDiscountAmtCell extends TableCell<CartItem, CartItem> {
        private TextField textField;

        @Override
        public void startEdit() {
            super.startEdit();
            if (textField == null)
                createTextField();
            setText(null);
            setGraphic(textField);
            BigDecimal amt = getItem().discountAmount;
            textField.setText(amt.compareTo(BigDecimal.ZERO) == 0 ? "" : amt.toString());
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
                    setGraphic(textField);
                    setText(null);
                } else
                    updateDisplay();
            }
        }

        private void updateDisplay() {
            CartItem item = getItem();
            if (item != null) {
                setText(item.discountAmount.compareTo(BigDecimal.ZERO) == 0 ? "0"
                        : currencyFormat.format(item.discountAmount));
            }
            setGraphic(null);
        }

        private void createTextField() {
            textField = new TextField();
            textField.getStyleClass().add("table-input");
            textField.setAlignment(javafx.geometry.Pos.CENTER_RIGHT);
            textField.setOnAction(e -> commitEdit(getItem()));
            textField.focusedProperty().addListener((obs, old, focus) -> {
                if (!focus && isEditing())
                    commitEdit(getItem());
            });
            textField.setOnKeyPressed(e -> {
                if (e.getCode() == KeyCode.ENTER) {
                    commitEdit(getItem());
                    moveFocusNext(getIndex(), colDiscountAmt);
                    e.consume();
                } else if (e.getCode() == KeyCode.TAB) {
                    commitEdit(getItem());
                    if (e.isShiftDown())
                        moveToPrevious();
                    else
                        moveToNext();
                    e.consume();
                } else if (e.getCode() == KeyCode.ESCAPE)
                    cancelEdit();
            });
        }

        @Override
        public void commitEdit(CartItem item) {
            if (textField != null && item != null) {
                try {
                    String val = textField.getText().trim();
                    item.discountValue = val.isEmpty() ? BigDecimal.ZERO : new BigDecimal(val);
                    item.discountType = "fixed";
                    refreshCurrentBill();
                } catch (Exception e) {
                }
            }
            super.commitEdit(item);
        }
    }

    private void moveFocusNext(int row, TableColumn<CartItem, ?> currentColumn) {
        Platform.runLater(() -> {
            if (currentColumn == colQty) {
                cartTable.getSelectionModel().select(row, colPrice);
                cartTable.edit(row, colPrice);
            } else if (currentColumn == colPrice) {
                cartTable.getSelectionModel().select(row, colDiscountPct);
                cartTable.edit(row, colDiscountPct);
            } else if (currentColumn == colDiscountPct) {
                cartTable.getSelectionModel().select(row, colDiscountAmt);
                cartTable.edit(row, colDiscountAmt);
            } else if (currentColumn == colDiscountAmt) {
                searchField.requestFocus();
                searchField.selectAll();
            }
        });
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

    private void setupQuickAddAutocomplete() {
        quickProductResultsView.getStyleClass().add("search-results-list");
        applyPopupListStyles(quickProductResultsView);
        quickProductPopup.getContent().add(quickProductResultsView);
        quickProductPopup.setAutoHide(true);

        quickProductResultsView.setCellFactory(lv -> new ListCell<>() {
            @Override
            protected void updateItem(Variant item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || item == null) {
                    setText(null);
                    setGraphic(null);

                } else {
                    VBox box = new VBox(2);
                    box.getStyleClass().add("search-item-box");
                    Label name = new Label(item.productName());
                    name.getStyleClass().add("search-item-name");
                    Label details = new Label(item.categoryName() != null ? item.categoryName() : "No Category");
                    details.getStyleClass().add("search-item-details");
                    box.getChildren().addAll(name, details);
                    setGraphic(box);
                }
            }
        });

        quickProductName.textProperty().addListener((obs, old, query) -> {
            if (isAutofilling)
                return;
            showQuickProductAutocompletePopup(query != null ? query.trim() : "");
        });

        quickProductResultsView.setOnMouseClicked(e -> {
            Variant v = quickProductResultsView.getSelectionModel().getSelectedItem();
            if (v != null) {
                selectProductForQuickAdd(v);
            }
        });

        quickProductResultsView.setOnKeyPressed(e -> {
            if (e.getCode() == KeyCode.ENTER) {
                Variant v = quickProductResultsView.getSelectionModel().getSelectedItem();
                if (v != null)
                    selectProductForQuickAdd(v);
            }
        });
    }

    private void selectProductForQuickAdd(Variant v) {
        isAutofilling = true;
        try {
            quickProductName.setText(v.productName());
            selectedProductIdForQuickAdd = v.productId();

            // Auto-select category
            if (v.categoryName() != null) {
                categoryService.getAllCategories().stream()
                        .filter(c -> c.name().equalsIgnoreCase(v.categoryName()))
                        .findFirst()
                        .ifPresent(this::selectCategoryForQuickAdd);
            }

            quickProductPopup.hide();
            quickVariantName.requestFocus();
        } finally {
            isAutofilling = false;
        }
    }

    private void showQuickProductAutocompletePopup(String query) {
        if (query.isEmpty()) {
            quickProductPopup.hide();
            selectedProductIdForQuickAdd = null;
            return;
        }

        // We only want unique products in the quick add autocomplete
        List<Variant> results = searchIndex.searchByName(query).stream()
                .filter(distinctByKey(Variant::productId))
                .limit(10)
                .toList();

        if (!results.isEmpty()) {
            quickProductResultsView.getItems().setAll(results);
            quickProductResultsView.setPrefHeight(Math.min(results.size() * 52 + 10, 300));
            quickProductResultsView.setPrefWidth(Math.max(quickProductName.getWidth(), 300));

            javafx.geometry.Point2D pos = quickProductName.localToScreen(0, quickProductName.getHeight() + 2);
            if (pos != null)
                quickProductPopup.show(quickProductName, pos.getX(), pos.getY());
        } else {
            quickProductPopup.hide();
            selectedProductIdForQuickAdd = null;
        }
    }

    private void setupCategoryAutocomplete() {
        quickCategoryResultsView.getStyleClass().add("search-results-list");
        applyPopupListStyles(quickCategoryResultsView);
        quickCategoryPopup.getContent().add(quickCategoryResultsView);
        quickCategoryPopup.setAutoHide(true);

        quickCategoryResultsView.setCellFactory(lv -> new ListCell<>() {
            @Override
            protected void updateItem(Category item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || item == null) {
                    setText(null);
                    setGraphic(null);
                } else {
                    VBox box = new VBox(2);
                    box.getStyleClass().add("search-item-box");
                    Label name = new Label(item.name());
                    name.getStyleClass().add("search-item-name");
                    box.getChildren().add(name);
                    setGraphic(box);
                    setText(null);
                }
            }
        });

        quickCategorySearch.textProperty().addListener((obs, old, query) -> {
            if (isAutofilling)
                return;
            showCategoryAutocompletePopup(query != null ? query.trim() : "");
        });

        quickCategoryResultsView.setOnMouseClicked(e -> {
            Category c = quickCategoryResultsView.getSelectionModel().getSelectedItem();
            if (c != null)
                selectCategoryForQuickAdd(c);
        });

        quickCategoryResultsView.setOnKeyPressed(e -> {
            if (e.getCode() == KeyCode.ENTER) {
                Category c = quickCategoryResultsView.getSelectionModel().getSelectedItem();
                if (c != null)
                    selectCategoryForQuickAdd(c);
            }
        });
    }

    private void selectCategoryForQuickAdd(Category c) {
        isAutofilling = true;
        try {
            quickCategorySearch.setText(c.name());
            selectedCategoryForQuickAdd = c;
            quickCategoryPopup.hide();
        } finally {
            isAutofilling = false;
        }
    }

    private void showCategoryAutocompletePopup(String query) {
        if (query.isEmpty()) {
            quickCategoryPopup.hide();
            selectedCategoryForQuickAdd = null;
            return;
        }

        List<Category> results = categoryService.getAllCategories().stream()
                .filter(c -> c.name().toLowerCase().contains(query.toLowerCase()))
                .limit(10)
                .toList();

        if (!results.isEmpty()) {
            quickCategoryResultsView.getItems().setAll(results);
            quickCategoryResultsView.setPrefHeight(Math.min(results.size() * 36 + 10, 250));
            quickCategoryResultsView.setPrefWidth(Math.max(quickCategorySearch.getWidth(), 250));

            javafx.geometry.Point2D pos = quickCategorySearch.localToScreen(0, quickCategorySearch.getHeight() + 2);
            if (pos != null)
                quickCategoryPopup.show(quickCategorySearch, pos.getX(), pos.getY());
        } else {
            quickCategoryPopup.hide();
            selectedCategoryForQuickAdd = null;
        }
    }

    private static <T> java.util.function.Predicate<T> distinctByKey(
            java.util.function.Function<? super T, ?> keyExtractor) {
        java.util.Set<Object> seen = java.util.concurrent.ConcurrentHashMap.newKeySet();
        return t -> seen.add(keyExtractor.apply(t));
    }

    private void applyPopupListStyles(ListView<?> listView) {
        String stylesheet = Objects.requireNonNull(
                getClass().getResource("/styles/pos.css"),
                "Missing stylesheet: /styles/pos.css").toExternalForm();
        if (!listView.getStylesheets().contains(stylesheet)) {
            listView.getStylesheets().add(stylesheet);
        }
    }
}
