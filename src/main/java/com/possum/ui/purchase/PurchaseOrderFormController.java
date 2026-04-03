package com.possum.ui.purchase;

import com.possum.application.auth.AuthContext;
import com.possum.application.purchase.PurchaseService;
import javafx.scene.control.Label;
import com.possum.application.sales.SalesService;
import com.possum.domain.model.PaymentMethod;
import com.possum.domain.model.PurchaseOrder;
import com.possum.domain.model.PurchaseOrderItem;
import com.possum.domain.model.Supplier;
import com.possum.domain.model.Variant;
import com.possum.persistence.repositories.interfaces.SupplierRepository;
import com.possum.persistence.repositories.interfaces.VariantRepository;
import com.possum.shared.dto.PagedResult;
import com.possum.ui.common.controls.NotificationService;
import com.possum.ui.navigation.Parameterizable;
import com.possum.ui.workspace.WorkspaceManager;
import com.possum.ui.sales.ProductSearchIndex;
import javafx.application.Platform;
import javafx.stage.Popup;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.fxml.FXML;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.control.*;
import javafx.scene.control.cell.PropertyValueFactory;
import javafx.scene.layout.*;
import javafx.scene.text.Font;
import javafx.scene.text.FontWeight;
import com.possum.ui.common.dialogs.DialogStyler;
import java.util.Objects;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class PurchaseOrderFormController implements Parameterizable {

    @FXML private Label titleLabel;
    @FXML private ComboBox<Supplier> supplierCombo;
    @FXML private ComboBox<PaymentMethod> paymentMethodCombo;
    @FXML private TextField searchVariantField;
    @FXML private TableView<PurchaseItemRow> itemsTable;
    @FXML private Button saveButton;
    @FXML private Label totalCostLabel;
    @FXML private Label itemCountLabel;
    @FXML private Button addItemButton;

    private PurchaseService purchaseService;
    private SupplierRepository supplierRepository;
    private VariantRepository variantRepository;
    private WorkspaceManager workspaceManager;
    private ProductSearchIndex searchIndex;
    private SalesService salesService;

    private Popup searchPopup = new Popup();
    private ListView<Variant> searchResultsView = new ListView<>();

    private PurchaseOrder existingPo;
    private Runnable onSaveCallback;
    private ObservableList<PurchaseItemRow> itemRows = FXCollections.observableArrayList();
    private Variant selectedVariant = null;
    private boolean isViewMode = false;

    public PurchaseOrderFormController(PurchaseService purchaseService, SupplierRepository supplierRepository,
                                       VariantRepository variantRepository, WorkspaceManager workspaceManager,
                                       ProductSearchIndex searchIndex, SalesService salesService) {
        this.purchaseService = purchaseService;
        this.supplierRepository = supplierRepository;
        this.variantRepository = variantRepository;
        this.workspaceManager = workspaceManager;
        this.searchIndex = searchIndex;
        this.salesService = salesService;
    }

    @Override
    public void setParameters(Map<String, Object> params) {
        boolean isView = false;
        if (params != null) {
            isView = "view".equals(params.get("mode"));
            if (params.containsKey("order")) {
                existingPo = (PurchaseOrder) params.get("order");
                final boolean finalIsView = isView;
                Platform.runLater(() -> titleLabel.setText(finalIsView ? "View Purchase Order" : "Edit Purchase Order"));
            } else {
                existingPo = null;
                Platform.runLater(() -> titleLabel.setText("Create Purchase Order"));
            }
            if (params.containsKey("onSave")) {
                onSaveCallback = (Runnable) params.get("onSave");
            }
        } else {
            existingPo = null;
            Platform.runLater(() -> titleLabel.setText("Create Purchase Order"));
        }
        final boolean finalIsView = isView;
        Platform.runLater(() -> {
            if (finalIsView) {
                saveButton.setVisible(false);
                saveButton.setManaged(false);
                if (searchVariantField != null) {
                    searchVariantField.setVisible(false);
                    searchVariantField.setManaged(false);
                }
                supplierCombo.setDisable(true);
            }
        });
        loadData(isView);
    }

    @FXML
    public void initialize() {
        setupItemsTable();
        setupVariantSearch();
        setupSearchAutocomplete();
    }

    private void setupItemsTable() {
        if (itemsTable == null) return;
        
        TableColumn<PurchaseItemRow, String> productCol = new TableColumn<>("Product | Variant");
        productCol.setCellValueFactory(new PropertyValueFactory<>("displayName"));
        productCol.setPrefWidth(300);
        productCol.setCellFactory(col -> new TableCell<>() {
            @Override
            protected void updateItem(String item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || item == null) {
                    setText(null);
                    setGraphic(null);
                } else {
                    PurchaseItemRow row = getTableView().getItems().get(getIndex());
                    VBox vbox = new VBox(2);
                    Label productLabel = new Label(row.getProductName());
                    productLabel.setFont(Font.font("System", FontWeight.BOLD, 12));
                    Label variantLabel = new Label(row.getSku() + " (" + row.getVariantName() + ")");
                    variantLabel.setStyle("-fx-text-fill: gray; -fx-font-size: 10px;");
                    vbox.getChildren().addAll(productLabel, variantLabel);
                    setGraphic(vbox);
                }
            }
        });
        
        TableColumn<PurchaseItemRow, Integer> qtyCol = new TableColumn<>("Qty");
        qtyCol.setCellValueFactory(new PropertyValueFactory<>("quantity"));
        qtyCol.setPrefWidth(80);
        qtyCol.setStyle("-fx-alignment: CENTER;");
        qtyCol.setCellFactory(col -> new TableCell<>() {
            private final Spinner<Integer> spinner = new Spinner<>(1, 10000, 1);
            
            {
                spinner.setEditable(true);
                spinner.setPrefWidth(70);
                spinner.valueProperty().addListener((obs, oldVal, newVal) -> {
                    PurchaseItemRow row = getTableRow().getItem();
                    if (row != null && newVal != null) {
                        row.setQuantity(newVal);
                        recalculateTotal();
                    }
                });
            }
            
            @Override
            protected void updateItem(Integer item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || getTableRow() == null || getTableRow().getItem() == null) {
                    setGraphic(null);
                } else {
                    PurchaseItemRow row = getTableRow().getItem();
                    spinner.getValueFactory().setValue(row.getQuantity());
                    spinner.setDisable(isViewMode);
                    setGraphic(spinner);
                }
            }
        });
        
        TableColumn<PurchaseItemRow, BigDecimal> costCol = new TableColumn<>("Unit Cost");
        costCol.setCellValueFactory(cellData -> cellData.getValue().unitCostProperty());
        costCol.setPrefWidth(100);
        costCol.setStyle("-fx-alignment: CENTER-RIGHT;");
        costCol.setCellFactory(col -> new TableCell<>() {
            private final TextField textField = new TextField();
            
            {
                textField.setPrefWidth(90);
                textField.setAlignment(Pos.CENTER_RIGHT);
                textField.textProperty().addListener((obs, oldVal, newVal) -> {
                    PurchaseItemRow row = getTableRow() != null ? getTableRow().getItem() : null;
                    if (row != null && newVal != null && !newVal.isEmpty()) {
                        try {
                            BigDecimal val = new BigDecimal(newVal.replaceAll("[^\\d.]", ""));
                            if (!val.equals(row.getUnitCost())) {
                                row.setUnitCost(val);
                                recalculateTotal();
                            }
                        } catch (NumberFormatException ignored) {}
                    }
                });
            }
            
            @Override
            protected void updateItem(BigDecimal item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || getTableRow() == null || getTableRow().getItem() == null) {
                    setGraphic(null);
                } else {
                    PurchaseItemRow row = getTableRow().getItem();
                    // Update only if text is different to avoid cursor reset
                    String currentText = row.getUnitCost().toString();
                    if (!textField.getText().equals(currentText)) {
                        textField.setText(currentText);
                    }
                    textField.setDisable(isViewMode);
                    setGraphic(textField);
                }
            }
        });
        
        TableColumn<PurchaseItemRow, BigDecimal> totalCol = new TableColumn<>("Total");
        totalCol.setCellValueFactory(cellData -> cellData.getValue().totalProperty());
        totalCol.setPrefWidth(100);
        totalCol.setStyle("-fx-alignment: CENTER-RIGHT;");
        totalCol.setCellFactory(col -> new TableCell<>() {
            @Override
            protected void updateItem(BigDecimal item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || item == null) {
                    setText(null);
                } else {
                    setText(String.format("$%.2f", item));
                    setStyle("-fx-font-weight: bold; -fx-text-fill: #1976d2;");
                }
            }
        });
        
        TableColumn<PurchaseItemRow, Void> actionCol = new TableColumn<>("Delete");
        actionCol.setPrefWidth(60);
        actionCol.setStyle("-fx-alignment: CENTER;");
        actionCol.setCellFactory(col -> new TableCell<>() {
            private final Button deleteBtn = new Button();
            
            {
                org.kordamp.ikonli.javafx.FontIcon trashIcon = new org.kordamp.ikonli.javafx.FontIcon("bx-trash");
                trashIcon.setIconSize(16);
                deleteBtn.setGraphic(trashIcon);
                // Standard danger styling
                deleteBtn.getStyleClass().addAll("action-button");
                deleteBtn.setStyle("-fx-background-color: transparent; -fx-text-fill: #ef4444; -fx-cursor: hand;");
                deleteBtn.setTooltip(new Tooltip("Remove from order"));
                deleteBtn.setOnAction(e -> {
                    PurchaseItemRow row = (PurchaseItemRow) getTableRow().getItem();
                    if (row != null) {
                        itemRows.remove(row);
                        recalculateTotal();
                    }
                });
            }
            
            @Override
            protected void updateItem(Void item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || isViewMode) {
                    setGraphic(null);
                } else {
                    setGraphic(deleteBtn);
                }
            }
        });
        
        itemsTable.getColumns().addAll(productCol, qtyCol, costCol, totalCol, actionCol);
        itemsTable.setPlaceholder(new Label("Search for a product or variant above to add items to your order"));
        itemsTable.setItems(itemRows);
        itemsTable.setPlaceholder(new Label("No items added yet. Search and add products above."));
    }

    private void setupVariantSearch() {
        if (searchVariantField == null) return;
        
        searchVariantField.textProperty().addListener((obs, oldVal, newVal) -> {
            showAutocompletePopup(newVal != null ? newVal.trim() : "");
        });
        
        searchVariantField.focusedProperty().addListener((obs, old, isFocused) -> {
            if (isFocused) {
                showAutocompletePopup(searchVariantField.getText().trim());
            } else {
                Platform.runLater(() -> {
                    if (!searchResultsView.isFocused()) searchPopup.hide();
                });
            }
        });
        
        searchVariantField.setOnMouseClicked(e -> {
            showAutocompletePopup(searchVariantField.getText().trim());
        });
        
        searchVariantField.setOnAction(e -> handleAddItem());
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
                    
                    Label name = new Label(item.productName() + (item.name().equals("Default") ? "" : " - " + item.name()));
                    name.getStyleClass().add("search-item-name");
                    
                    Label details = new Label(item.sku() + " • Cost: $" + (item.costPrice() != null ? item.costPrice() : "0.00") + " • Stock: " + (item.stock() != null ? item.stock() : "∞"));
                    details.getStyleClass().add("search-item-details");
                    
                    box.getChildren().addAll(name, details);
                    setGraphic(box);
                }
            }
        });

        searchResultsView.setOnMouseClicked(e -> {
            Variant v = searchResultsView.getSelectionModel().getSelectedItem();
            if (v != null) {
                addVariantToCart(v);
                searchVariantField.clear();
                searchPopup.hide();
            }
        });

        searchResultsView.setOnKeyPressed(e -> {
            if (e.getCode() == javafx.scene.input.KeyCode.ENTER) {
                Variant v = searchResultsView.getSelectionModel().getSelectedItem();
                if (v != null) {
                    addVariantToCart(v);
                    searchVariantField.clear();
                    searchPopup.hide();
                }
            } else if (e.getCode() == javafx.scene.input.KeyCode.UP && searchResultsView.getSelectionModel().getSelectedIndex() <= 0) {
                searchVariantField.requestFocus();
            }
        });

        searchVariantField.setOnKeyPressed(e -> {
            if (e.getCode() == javafx.scene.input.KeyCode.DOWN && searchPopup.isShowing()) {
                searchResultsView.requestFocus();
                searchResultsView.getSelectionModel().selectFirst();
            }
        });
    }

    private void showAutocompletePopup(String query) {

        List<Variant> results = searchIndex.searchByName(query);

        if (!results.isEmpty()) {
            searchResultsView.setItems(FXCollections.observableArrayList(results));
            searchResultsView.setPrefHeight(Math.min(results.size() * 52 + 5, 300));
            searchResultsView.setPrefWidth(Math.max(searchVariantField.getWidth(), 350));
            
            javafx.geometry.Point2D pos = searchVariantField.localToScreen(0, searchVariantField.getHeight() + 2);
            if (pos != null) {
                searchPopup.show(searchVariantField, pos.getX(), pos.getY());
            }
        } else {
            searchPopup.hide();
        }
    }

    @FXML
    private void handleAddItem() {
        String query = searchVariantField.getText().trim();
        if (query.isEmpty()) {
            NotificationService.warning("Enter a product name or SKU to search");
            return;
        }

        // If something is selected in common, use it
        if (searchPopup.isShowing() && !searchResultsView.getItems().isEmpty()) {
            Variant selected = searchResultsView.getSelectionModel().getSelectedItem();
            if (selected == null) selected = searchResultsView.getItems().get(0);
            
            addVariantToCart(selected);
            searchVariantField.clear();
            searchPopup.hide();
            return;
        }

        // Search fallback
        try {
            List<Variant> results = searchIndex.searchByName(query);
            if (results.isEmpty()) {
                NotificationService.warning("No product found matching: " + query);
                return;
            }
            
            if (results.size() == 1) {
                addVariantToCart(results.get(0));
                searchVariantField.clear();
            } else {
                showVariantSelectionDialog(results);
            }
        } catch (Exception ex) {
            NotificationService.error("Failed to search products");
        }
    }

    private void showVariantSelectionDialog(List<Variant> variants) {
        Dialog<Variant> dialog = new Dialog<>();
        DialogStyler.apply(dialog);
        dialog.setTitle("Select Product Variant");
        dialog.setHeaderText("Multiple products found. Select one:");
        
        ListView<Variant> listView = new ListView<>(FXCollections.observableArrayList(variants));
        listView.setCellFactory(lv -> new ListCell<>() {
            @Override
            protected void updateItem(Variant item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || item == null) {
                    setText(null);
                } else {
                    setText(item.productName() + " - " + item.name() + " (" + item.sku() + ") - $" + 
                           (item.costPrice() != null ? item.costPrice() : "0.00"));
                }
            }
        });
        
        dialog.getDialogPane().setContent(listView);
        dialog.getDialogPane().getButtonTypes().addAll(ButtonType.OK, ButtonType.CANCEL);
        dialog.setResultConverter(buttonType -> {
            if (buttonType == ButtonType.OK) {
                return listView.getSelectionModel().getSelectedItem();
            }
            return null;
        });
        
        dialog.showAndWait().ifPresent(variant -> {
            addVariantToCart(variant);
            searchVariantField.clear();
        });
    }

    private void loadData(boolean isView) {
        this.isViewMode = isView;
        Platform.runLater(() -> {
            try {
                PagedResult<Supplier> suppliers = supplierRepository.getAllSuppliers(
                    new com.possum.shared.dto.SupplierFilter(0, 1000, null, null, "name", "ASC")
                );
                makeSupplierComboSearchable(suppliers.items());
                
                List<PaymentMethod> paymentMethods = salesService.getPaymentMethods();
                makePaymentMethodComboSearchable(paymentMethods);

                if (existingPo != null) {
                    Supplier existingSupplier = suppliers.items().stream()
                        .filter(s -> s.id().equals(existingPo.supplierId()))
                        .findFirst().orElse(null);
                    supplierCombo.setValue(existingSupplier);

                    if (existingPo.paymentMethodId() != null) {
                        PaymentMethod existingMethod = paymentMethods.stream()
                            .filter(pm -> pm.id().equals(existingPo.paymentMethodId()))
                            .findFirst().orElse(null);
                        paymentMethodCombo.setValue(existingMethod);
                    }

                    PurchaseService.PurchaseOrderDetail detail = purchaseService.getPurchaseOrderById(existingPo.id());
                    for (PurchaseOrderItem item : detail.items()) {
                        variantRepository.findVariantByIdSync(item.variantId()).ifPresent(v -> {
                            PurchaseItemRow row = new PurchaseItemRow(v);
                            row.setQuantity(item.quantity());
                            row.setUnitCost(item.unitCost());
                            itemRows.add(row);
                        });
                    }
                }
                recalculateTotal();
            } catch (Exception e) {
                NotificationService.error("Failed to load data for PO Form");
            }
        });
    }

    private void makePaymentMethodComboSearchable(List<PaymentMethod> allMethods) {
        paymentMethodCombo.setItems(FXCollections.observableArrayList(allMethods));
        paymentMethodCombo.setConverter(new javafx.util.StringConverter<PaymentMethod>() {
            @Override
            public String toString(PaymentMethod m) { return m == null ? "" : m.name(); }
            @Override
            public PaymentMethod fromString(String string) {
                return allMethods.stream().filter(m -> m.name().equals(string)).findFirst().orElse(null);
            }
        });

        // Select Cash by default if available and not existing PO
        if (existingPo == null) {
            allMethods.stream().filter(pm -> "Cash".equalsIgnoreCase(pm.name())).findFirst().ifPresent(paymentMethodCombo::setValue);
        }
    }

    private void makeSupplierComboSearchable(List<Supplier> allSuppliers) {
        supplierCombo.setItems(FXCollections.observableArrayList(allSuppliers));
        supplierCombo.setConverter(new javafx.util.StringConverter<Supplier>() {
            @Override
            public String toString(Supplier s) { return s == null ? "" : s.name(); }
            @Override
            public Supplier fromString(String string) {
                return allSuppliers.stream().filter(s -> s.name().equals(string)).findFirst().orElse(null);
            }
        });
        supplierCombo.setEditable(false);
    }

    private void recalculateTotal() {
        BigDecimal total = BigDecimal.ZERO;
        int totalQty = 0;
        for (PurchaseItemRow row : itemRows) {
            BigDecimal cost = row.getUnitCost();
            BigDecimal qty = new BigDecimal(row.getQuantity());
            total = total.add(cost.multiply(qty));
            totalQty += row.getQuantity();
        }
        final BigDecimal finalTotal = total;
        final int finalQty = totalQty;
        Platform.runLater(() -> {
            if (totalCostLabel != null) {
                totalCostLabel.setText(String.format("$%.2f", finalTotal));
            }
            if (itemCountLabel != null) {
                itemCountLabel.setText(itemRows.size() + " item" + (itemRows.size() != 1 ? "s" : "") + 
                                      " (" + finalQty + " units)");
            }
        });
    }

    private void addVariantToCart(Variant variant) {
        for (PurchaseItemRow row : itemRows) {
            if (row.getVariantId() != null && row.getVariantId().equals(variant.id())) {
                row.setQuantity(row.getQuantity() + 1);
                NotificationService.success("Quantity updated for " + variant.name());
                recalculateTotal();
                return;
            }
        }
        PurchaseItemRow row = new PurchaseItemRow(variant);
        itemRows.add(row);
        NotificationService.success("Added " + variant.name() + " to order");
        recalculateTotal();
    }

    @FXML
    private void handleCancel() {
        workspaceManager.closeActiveWindow();
    }

    @FXML
    private void handleSave() {
        try {
            Supplier supplier = supplierCombo.getValue();
            if (supplier == null) {
                NotificationService.error("Select a supplier");
                return;
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
                NotificationService.error("Add at least one valid item");
                return;
            }
            
            long userId = AuthContext.getCurrentUser().id();
            
            PaymentMethod paymentMethod = paymentMethodCombo.getValue();
            if (paymentMethod == null) {
                NotificationService.error("Select a payment method");
                return;
            }

            if (existingPo == null) {
                purchaseService.createPurchaseOrder(supplier.id(), paymentMethod.id(), userId, items);
            } else {
                purchaseService.updatePurchaseOrder(existingPo.id(), supplier.id(), paymentMethod.id(), userId, items);
            }
            
            NotificationService.success("Purchase order saved");
            if (onSaveCallback != null) {
                onSaveCallback.run();
            }
            workspaceManager.closeActiveWindow();
        } catch (Exception e) {
            NotificationService.error("Failed: " + e.getMessage());
        }
    }

    public static class PurchaseItemRow {
        private final Variant variant;
        private final javafx.beans.property.IntegerProperty quantity = new javafx.beans.property.SimpleIntegerProperty();
        private final javafx.beans.property.ObjectProperty<BigDecimal> unitCost = new javafx.beans.property.SimpleObjectProperty<>();
        private final javafx.beans.property.ObjectProperty<BigDecimal> total = new javafx.beans.property.SimpleObjectProperty<>();
        
        public PurchaseItemRow(Variant variant) {
            this.variant = variant;
            this.quantity.set(1);
            this.unitCost.set(variant.costPrice() != null ? variant.costPrice() : BigDecimal.ZERO);
            
            total.bind(javafx.beans.binding.Bindings.createObjectBinding(
                () -> getUnitCost().multiply(BigDecimal.valueOf(getQuantity())),
                quantity, unitCost
            ));
        }
        
        public Long getVariantId() { return variant != null ? variant.id() : null; }
        public String getProductName() { return variant != null ? variant.productName() : ""; }
        public String getVariantName() { return variant != null ? variant.name() : ""; }
        public String getSku() { return variant != null ? variant.sku() : ""; }
        public String getDisplayName() { 
            return variant != null ? variant.productName() + " - " + variant.name() : ""; 
        }
        
        public int getQuantity() { return quantity.get(); }
        public void setQuantity(int quantity) { this.quantity.set(quantity); }
        public javafx.beans.property.IntegerProperty quantityProperty() { return quantity; }
        
        public BigDecimal getUnitCost() { return unitCost.get(); }
        public void setUnitCost(BigDecimal unitCost) { this.unitCost.set(unitCost); }
        public javafx.beans.property.ObjectProperty<BigDecimal> unitCostProperty() { return unitCost; }
        
        public BigDecimal getTotal() { return total.get(); }
        public javafx.beans.property.ObjectProperty<BigDecimal> totalProperty() { return total; }
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
