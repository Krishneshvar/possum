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
import com.possum.application.sales.dto.UpdateSaleItemRequest;
import javafx.stage.Popup;
import javafx.scene.control.ListView;
import javafx.scene.control.ListCell;
import javafx.scene.input.KeyCode;
import javafx.application.Platform;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

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

    @FXML private javafx.scene.layout.HBox editActionsDock;
    @FXML private javafx.scene.layout.VBox customerViewBox;
    @FXML private javafx.scene.layout.VBox customerEditBox;
    @FXML private javafx.scene.layout.VBox paymentViewBox;
    @FXML private javafx.scene.layout.VBox paymentEditBox;
    @FXML private javafx.scene.control.ComboBox<com.possum.domain.model.Customer> customerCombo;
    @FXML private javafx.scene.control.ComboBox<com.possum.domain.model.PaymentMethod> paymentMethodCombo;

    @FXML private javafx.scene.layout.HBox addItemDock;
    @FXML private javafx.scene.control.TextField itemSearchField;
    @FXML private javafx.scene.layout.HBox draftTotalsDock;
    @FXML private Label draftSubtotalLabel;
    @FXML private Label draftTaxLabel;
    @FXML private Label draftTotalLabel;

    private final javafx.collections.ObservableList<SaleItem> editingItems = FXCollections.observableArrayList();
    private boolean isEditingMode = false;
    
    // Search Autocomplete
    private Popup searchPopup = new Popup();
    private ListView<com.possum.domain.model.Variant> searchResultsView = new ListView<>(FXCollections.observableArrayList());

    private final SalesService salesService;
    private final WorkspaceManager workspaceManager;
    private final SettingsStore settingsStore;
    private final PrinterService printerService;
    private final ProductSearchIndex searchIndex;
    private final NumberFormat currencyFormat = NumberFormat.getCurrencyInstance(Locale.US);

    private Sale currentSale;
    private SaleResponse saleDetails;

    public SaleDetailController(SalesService salesService, 
                                WorkspaceManager workspaceManager,
                                SettingsStore settingsStore,
                                PrinterService printerService,
                                ProductSearchIndex searchIndex) {
        this.salesService = salesService;
        this.workspaceManager = workspaceManager;
        this.settingsStore = settingsStore;
        this.printerService = printerService;
        this.searchIndex = searchIndex;
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
        setupEditControls();
        setupSearchAutocomplete();
    }

    private void setupEditControls() {
        customerCombo.setCellFactory(lv -> new javafx.scene.control.ListCell<>() {
            @Override protected void updateItem(com.possum.domain.model.Customer item, boolean empty) {
                super.updateItem(item, empty);
                setText(empty || item == null ? null : item.name() + (item.phone() != null ? " (" + item.phone() + ")" : ""));
            }
        });
        customerCombo.setButtonCell(customerCombo.getCellFactory().call(null));

        paymentMethodCombo.setCellFactory(lv -> new javafx.scene.control.ListCell<>() {
            @Override protected void updateItem(com.possum.domain.model.PaymentMethod item, boolean empty) {
                super.updateItem(item, empty);
                setText(empty || item == null ? null : item.name());
            }
        });
        paymentMethodCombo.setButtonCell(paymentMethodCombo.getCellFactory().call(null));
    }

    private void setupActiveItemsTable() {
        TableColumn<SaleItem, String> productCol = new TableColumn<>("Product / Variant");
        productCol.setMinWidth(250);
        productCol.setCellValueFactory(data -> new SimpleStringProperty(
            data.getValue().productName() + (data.getValue().variantName() != null ? " - " + data.getValue().variantName() : "")
        ));

        TableColumn<SaleItem, Integer> qtyCol = new TableColumn<>("Qty");
        qtyCol.setPrefWidth(100);
        qtyCol.setCellValueFactory(data -> new javafx.beans.property.SimpleIntegerProperty(
                data.getValue().quantity() - (data.getValue().returnedQuantity() != null ? data.getValue().returnedQuantity() : 0)
        ).asObject());
        qtyCol.setCellFactory(col -> new TableCell<>() {
            @Override protected void updateItem(Integer qty, boolean empty) {
                super.updateItem(qty, empty);
                if (empty || qty == null) {
                    setGraphic(null);
                    setText(null);
                } else if (isEditingMode) {
                    javafx.scene.control.Spinner<Integer> spinner = new javafx.scene.control.Spinner<>(0, 1000, qty);
                    spinner.setEditable(true);
                    spinner.setPrefWidth(80);
                    spinner.valueProperty().addListener((obs, oldVal, newVal) -> {
                        int index = getIndex();
                        if (index >= 0 && index < getTableView().getItems().size()) {
                            SaleItem current = getTableView().getItems().get(index);
                            getTableView().getItems().set(index, new SaleItem(
                                    current.id(), current.saleId(), current.variantId(), current.variantName(),
                                    current.sku(), current.productName(), newVal, current.pricePerUnit(),
                                    current.costPerUnit(), current.taxRate(), current.taxAmount(),
                                    current.appliedTaxRate(), current.appliedTaxAmount(), 
                                    current.taxRuleSnapshot(), current.discountAmount(), null
                            ));
                            calculateDraftTotals();
                        }
                    });
                    setGraphic(spinner);
                    setText(null);
                } else {
                    setText(String.valueOf(qty));
                    setGraphic(null);
                }
            }
        });

        TableColumn<SaleItem, BigDecimal> priceCol = new TableColumn<>("Unit Price");
        priceCol.setCellValueFactory(data -> new SimpleObjectProperty<>(data.getValue().pricePerUnit()));
        priceCol.setCellFactory(col -> new TableCell<>() {
            @Override protected void updateItem(BigDecimal price, boolean empty) {
                super.updateItem(price, empty);
                if (empty || price == null) {
                    setText(null);
                    setGraphic(null);
                } else if (isEditingMode) {
                    javafx.scene.control.TextField field = new javafx.scene.control.TextField(price.toPlainString());
                    field.setPrefWidth(90);
                    field.focusedProperty().addListener((obs, oldF, newF) -> {
                        if (!newF) { // On blur
                            try {
                                BigDecimal newVal = new BigDecimal(field.getText());
                                int index = getIndex();
                                if (index >= 0 && index < getTableView().getItems().size()) {
                                    SaleItem current = getTableView().getItems().get(index);
                                    getTableView().getItems().set(index, new SaleItem(
                                            current.id(), current.saleId(), current.variantId(), current.variantName(),
                                            current.sku(), current.productName(), current.quantity(), newVal,
                                            current.costPerUnit(), current.taxRate(), current.taxAmount(),
                                            current.appliedTaxRate(), current.appliedTaxAmount(), 
                                            current.taxRuleSnapshot(), current.discountAmount(), null
                                    ));
                                    calculateDraftTotals();
                                }
                            } catch (Exception e) {
                                field.setText(price.toPlainString());
                            }
                        }
                    });
                    setGraphic(field);
                    setText(null);
                } else {
                    setText(currencyFormat.format(price));
                    setGraphic(null);
                }
            }
        });

        TableColumn<SaleItem, BigDecimal> taxCol = new TableColumn<>("Tax");
        taxCol.setCellValueFactory(data -> new SimpleObjectProperty<>(data.getValue().taxAmount()));
        setupCurrencyCell(taxCol);

        TableColumn<SaleItem, BigDecimal> discountCol = new TableColumn<>("Discount");
        discountCol.setCellValueFactory(data -> new SimpleObjectProperty<>(data.getValue().discountAmount()));
        setupCurrencyCell(discountCol);

        TableColumn<SaleItem, BigDecimal> totalCol = new TableColumn<>("Line Total");
        totalCol.setCellValueFactory(data -> {
            SaleItem item = data.getValue();
            BigDecimal base = item.pricePerUnit().multiply(BigDecimal.valueOf(item.quantity()));
            BigDecimal total = base.add(item.taxAmount()).subtract(item.discountAmount());
            return new SimpleObjectProperty<>(total);
        });
        totalCol.setCellFactory(col -> new TableCell<>() {
            @Override protected void updateItem(BigDecimal total, boolean empty) {
                super.updateItem(total, empty);
                if (empty || total == null) {
                    setText(null);
                } else {
                    setText(currencyFormat.format(total));
                    setStyle("-fx-font-weight: bold;");
                }
            }
        });

        TableColumn<SaleItem, Void> actionsCol = new TableColumn<>("");
        actionsCol.setCellFactory(col -> new TableCell<>() {
            private final javafx.scene.control.Button deleteBtn = new javafx.scene.control.Button();
            {
                deleteBtn.getStyleClass().add("danger-button");
                deleteBtn.setGraphic(new org.kordamp.ikonli.javafx.FontIcon("fas-trash-alt"));
                deleteBtn.setOnAction(e -> {
                    int index = getIndex();
                    if (index >= 0 && index < getTableView().getItems().size()) {
                        getTableView().getItems().remove(index);
                        calculateDraftTotals();
                    }
                });
            }
            @Override protected void updateItem(Void item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || !isEditingMode) {
                    setGraphic(null);
                } else {
                    setGraphic(deleteBtn);
                }
            }
        });

        itemsTable.getTableView().getColumns().setAll(productCol, qtyCol, priceCol, taxCol, discountCol, totalCol, actionsCol);
        itemsTable.setEmptyMessage("No active items in this bill");
    }

    private void calculateDraftTotals() {
        BigDecimal subtotal = editingItems.stream()
                .map(i -> i.pricePerUnit().multiply(BigDecimal.valueOf(i.quantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal taxEstimate = editingItems.stream()
                .map(i -> i.taxAmount() != null ? i.taxAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal discounts = editingItems.stream()
                .map(i -> i.discountAmount() != null ? i.discountAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        draftSubtotalLabel.setText(currencyFormat.format(subtotal));
        draftTaxLabel.setText(currencyFormat.format(taxEstimate));
        draftTotalLabel.setText(currencyFormat.format(subtotal.add(taxEstimate).subtract(discounts)));
    }

    private void setupSearchAutocomplete() {
        searchResultsView.getStyleClass().add("search-results-list");
        searchPopup.getContent().add(searchResultsView);
        searchPopup.setAutoHide(true);
        
        searchResultsView.setCellFactory(lv -> new ListCell<>() {
            @Override protected void updateItem(com.possum.domain.model.Variant item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || item == null) { setText(null); setGraphic(null); }
                else {
                    VBox b = new VBox(2);
                    b.setPrefHeight(45);
                    Label n = new Label(item.productName() + (item.name().equals("Standard") ? "" : " - " + item.name()));
                    n.setStyle("-fx-font-weight: bold; -fx-font-size: 13px;");
                    Label d = new Label(item.sku() + " • " + currencyFormat.format(item.price()));
                    d.setStyle("-fx-text-fill: #64748b; -fx-font-size: 11px;");
                    b.getChildren().addAll(n, d);
                    setGraphic(b);
                }
            }
        });

        searchResultsView.setOnMouseClicked(e -> {
            com.possum.domain.model.Variant selected = searchResultsView.getSelectionModel().getSelectedItem();
            if (selected != null) {
                addVariantToEditingItems(selected);
                searchPopup.hide();
                itemSearchField.clear();
            }
        });

        searchResultsView.setOnKeyPressed(e -> {
            if (e.getCode() == KeyCode.ENTER) {
                com.possum.domain.model.Variant selected = searchResultsView.getSelectionModel().getSelectedItem();
                if (selected != null) {
                    addVariantToEditingItems(selected);
                    searchPopup.hide();
                    itemSearchField.clear();
                }
            }
        });

        itemSearchField.textProperty().addListener((obs, oldV, newVal) -> {
            String query = newVal != null ? newVal.trim() : "";
            if (query.isEmpty()) {
                searchPopup.hide();
                return;
            }

            // SKU Quick Add
            Optional<com.possum.domain.model.Variant> bySku = searchIndex.findBySku(query);
            if (bySku.isPresent()) {
                addVariantToEditingItems(bySku.get());
                itemSearchField.clear();
                searchPopup.hide();
                return;
            }

            // Normal Search Popup
            List<com.possum.domain.model.Variant> results = searchIndex.searchByName(query);
            if (!results.isEmpty()) {
                searchResultsView.getItems().setAll(results);
                searchResultsView.setPrefHeight(Math.min(results.size() * 52 + 10, 400));
                searchResultsView.setPrefWidth(Math.max(itemSearchField.getWidth(), 300));
                
                javafx.geometry.Point2D p = itemSearchField.localToScreen(0, itemSearchField.getHeight() + 5);
                if (p != null) {
                    searchPopup.show(itemSearchField, p.getX(), p.getY());
                }
            } else {
                searchPopup.hide();
            }
        });

        itemSearchField.focusedProperty().addListener((obs, oldF, newF) -> {
            if (!newF) {
                Platform.runLater(() -> {
                    if (!searchResultsView.isFocused()) searchPopup.hide();
                });
            }
        });

        itemSearchField.setOnKeyPressed(e -> {
            if (e.getCode() == KeyCode.DOWN && searchPopup.isShowing()) {
                searchResultsView.requestFocus();
                searchResultsView.getSelectionModel().select(0);
            }
        });
    }

    @FXML
    private void handleItemSearch() {
        // Handled by setupSearchAutocomplete listeners, but keeping for FXML compat
    }

    private void addVariantToEditingItems(com.possum.domain.model.Variant variant) {
        editingItems.stream()
            .filter(i -> i.variantId() == variant.id())
            .findFirst()
            .ifPresentOrElse(
                existing -> {
                    int idx = editingItems.indexOf(existing);
                    editingItems.set(idx, new SaleItem(
                        existing.id(), existing.saleId(), existing.variantId(), existing.variantName(),
                        existing.sku(), existing.productName(), existing.quantity() + 1, existing.pricePerUnit(),
                        existing.costPerUnit(), existing.taxRate(), existing.taxAmount(),
                        existing.appliedTaxRate(), existing.appliedTaxAmount(), 
                        existing.taxRuleSnapshot(), existing.discountAmount(), null
                    ));
                },
                () -> {
                    editingItems.add(new SaleItem(
                        null, currentSale.id(), variant.id(), variant.name(),
                        variant.sku(), variant.productName() != null ? variant.productName() : "New Product", 
                        1, variant.price(), variant.costPrice(), 
                        BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, 
                        null, BigDecimal.ZERO, null
                    ));
                }
            );
        calculateDraftTotals();
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
            
            // Check if we should start in edit mode
            if (Boolean.TRUE.equals(params.get("editing"))) {
                Platform.runLater(this::toggleEditMode);
            }
        }
    }

    private void loadSaleDetails() {
        try {
            this.saleDetails = salesService.getSaleDetails(currentSale.id());
            
            invoiceLabel.setText("#" + currentSale.invoiceNumber());
            statusBadge.setText(currentSale.status().replace("_", " ").toUpperCase());
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
    private void toggleEditMode() {
        isEditingMode = !isEditingMode;
        boolean editing = isEditingMode;
        
        if (editing) {
            // Populate selections
            customerCombo.setItems(FXCollections.observableArrayList(salesService.getAllCustomers()));
            paymentMethodCombo.setItems(FXCollections.observableArrayList(salesService.getPaymentMethods()));
            
            // Pre-select current customer
            long currentCustomerId = currentSale.customerId() != null ? currentSale.customerId() : -1L;
            customerCombo.getItems().stream()
                .filter(c -> c.id() == currentCustomerId)
                .findFirst()
                .ifPresent(customerCombo::setValue);
            
            // Pre-select current payment method
            long currentMethodId = saleDetails.transactions().stream()
                    .filter(t -> "payment".equals(t.type()))
                    .map(com.possum.domain.model.Transaction::paymentMethodId)
                    .findFirst()
                    .orElse(-1L);
                    
            paymentMethodCombo.getItems().stream()
                .filter(m -> m.id() == currentMethodId)
                .findFirst()
                .ifPresent(paymentMethodCombo::setValue);

            editingItems.setAll(saleDetails.items());
            itemsTable.getTableView().setItems(editingItems);
            calculateDraftTotals();
        } else {
            itemsTable.getTableView().setItems(FXCollections.observableArrayList(saleDetails.items()));
        }

        // Toggle layout visibility
        editButton.setVisible(!editing);
        editButton.setManaged(!editing);
        editActionsDock.setVisible(editing);
        editActionsDock.setManaged(editing);

        addItemDock.setVisible(editing);
        addItemDock.setManaged(editing);
        draftTotalsDock.setVisible(editing);
        draftTotalsDock.setManaged(editing);
        
        customerViewBox.setVisible(!editing);
        customerViewBox.setManaged(!editing);
        customerEditBox.setVisible(editing);
        customerEditBox.setManaged(editing);
        
        paymentViewBox.setVisible(!editing);
        paymentViewBox.setManaged(!editing);
        paymentEditBox.setVisible(editing);
        paymentEditBox.setManaged(editing);

        // Re-setup table to trigger cell factory updates for editors
        setupActiveItemsTable();
    }

    @FXML
    private void handleSave() {
        try {
            com.possum.domain.model.Customer selectedCustomer = customerCombo.getValue();
            com.possum.domain.model.PaymentMethod selectedMethod = paymentMethodCombo.getValue();
            
            Long newCustomerId = selectedCustomer != null ? selectedCustomer.id() : null;
            long newMethodId = selectedMethod != null ? selectedMethod.id() : -1L;
            
            com.possum.application.auth.AuthUser currentUser = com.possum.application.auth.AuthContext.getCurrentUser();
            boolean changed = false;

            // 1. Correct Customer
            if (!java.util.Objects.equals(currentSale.customerId(), newCustomerId)) {
                salesService.changeSaleCustomer(currentSale.id(), newCustomerId, currentUser.id());
                changed = true;
            }

            // 2. Correct Payment Method
            long currentMethodId = saleDetails.transactions().stream()
                    .filter(t -> "payment".equals(t.type()))
                    .map(com.possum.domain.model.Transaction::paymentMethodId)
                    .findFirst()
                    .orElse(-1L);
            
            if (newMethodId != -1 && newMethodId != currentMethodId) {
                salesService.changeSalePaymentMethod(currentSale.id(), newMethodId, currentUser.id());
                changed = true;
            }

            // 3. Batch Update Items
            List<UpdateSaleItemRequest> itemRequests = editingItems.stream()
                    .map(item -> new UpdateSaleItemRequest(
                            item.variantId(), item.quantity(), item.pricePerUnit(), item.discountAmount()
                    )).toList();
            
            // Note: We always update items if we're saving in edit mode to capture qty/price changes
            salesService.updateSaleItems(currentSale.id(), itemRequests, currentUser.id());
            changed = true;

            if (changed) {
                NotificationService.success("Bill updated successfully");
                loadSaleDetails(); // Reload data from DB
            }
            
            toggleEditMode(); // Exit edit mode
            
        } catch (Exception e) {
            NotificationService.error("Update failed: " + e.getMessage());
            e.printStackTrace();
        }
    }

    @FXML
    private void handleReturn() {
        Map<String, Object> params = Map.of("invoiceNumber", currentSale.invoiceNumber());
        workspaceManager.openDialog("Process Return", "/fxml/returns/create-return-dialog.fxml", params);
        loadSaleDetails();
    }
}
