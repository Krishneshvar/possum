package com.possum.ui.products;

import com.possum.application.auth.AuthContext;
import com.possum.application.categories.CategoryService;
import com.possum.application.products.ProductService;
import com.possum.domain.model.Category;
import com.possum.domain.model.TaxCategory;
import com.possum.persistence.repositories.interfaces.TaxRepository;
import com.possum.ui.common.controls.NotificationService;
import com.possum.ui.common.controls.SingleSelectFilter;
import com.possum.ui.workspace.WorkspaceManager;
import com.possum.ui.navigation.Parameterizable;
import javafx.collections.FXCollections;
import javafx.fxml.FXML;
import javafx.scene.control.*;
import javafx.scene.layout.HBox;
import javafx.scene.layout.VBox;
import javafx.scene.layout.Priority;
import javafx.scene.layout.Region;
import org.kordamp.ikonli.javafx.FontIcon;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class ProductFormController implements Parameterizable {

    private final ProductService productService;
    private final CategoryService categoryService;
    private final TaxRepository taxRepository;
    private final WorkspaceManager workspaceManager;

    @FXML private Label titleLabel;
    @FXML private TextField nameField;
    @FXML private TextArea descriptionField;
    @FXML private SingleSelectFilter<CategoryItem> categoryFilter;
    @FXML private ComboBox<String> statusCombo;
    @FXML private SingleSelectFilter<TaxCategoryItem> taxFilter;
    @FXML private VBox variantsContainer;
    @FXML private Button saveButton;
    @FXML private Button addVariantButton;

    private Long productId = null;
    private final List<VariantRow> variantRows = new ArrayList<>();
    private final ToggleGroup defaultVariantGroup = new ToggleGroup();

    public ProductFormController(ProductService productService,
                                 CategoryService categoryService,
                                 TaxRepository taxRepository,
                                 WorkspaceManager workspaceManager) {
        this.productService = productService;
        this.categoryService = categoryService;
        this.taxRepository = taxRepository;
        this.workspaceManager = workspaceManager;
    }

    @Override
    public void setParameters(Map<String, Object> params) {
        if (params != null && params.containsKey("productId")) {
            this.productId = (Long) params.get("productId");
            String mode = (String) params.get("mode");
            boolean isView = "view".equals(mode);

            titleLabel.setText(isView ? "View Product" : "Edit Product");
            loadProductDetails(isView);
        } else {
            this.productId = null;
            titleLabel.setText("Add Product");
            if (variantRows.isEmpty()) {
                addVariantRow(true, "Default");
            }
        }
    }

    private void loadProductDetails(boolean isView) {
        try {
            ProductService.ProductWithVariantsDTO dto = productService.getProductWithVariants(productId);

            nameField.setText(dto.product().name());
            descriptionField.setText(dto.product().description());

            if (dto.product().categoryId() != null) {
                categoryFilter.setSelectedItem(new CategoryItem(dto.product().categoryId(), dto.product().categoryName()));
            }

            statusCombo.setValue(dto.product().status() != null ? dto.product().status() : "active");

            if (dto.product().taxCategoryId() != null) {
                taxFilter.setSelectedItem(new TaxCategoryItem(dto.product().taxCategoryId(), dto.product().taxCategoryName()));
            }

            variantRows.clear();
            variantsContainer.getChildren().clear();

            if (dto.variants() != null && !dto.variants().isEmpty()) {
                for (com.possum.domain.model.Variant v : dto.variants()) {
                    VariantRow row = new VariantRow(Boolean.TRUE.equals(v.defaultVariant()), null);
                    row.setVariantId(v.id());
                    row.variantNameField.setText(v.name());
                    row.skuField.setText(v.sku() != null ? v.sku() : "");
                    row.priceField.setText(v.price() != null ? v.price().toString() : "");
                    row.costPriceField.setText(v.costPrice() != null ? v.costPrice().toString() : "");
                    row.stockAlertField.setText(v.stockAlertCap() != null ? v.stockAlertCap().toString() : "");
                    row.variantStatusCombo.setValue(v.status() != null ? v.status() : "active");
                    row.setInitialStock(v.stock() != null ? v.stock() : 0);

                    if (isView) {
                        row.setReadOnly();
                    }

                    variantRows.add(row);
                    variantsContainer.getChildren().add(row.getView());
                }
            } else {
                addVariantRow(true, "Default");
            }

            if (isView) {
                replaceFieldWithLabel(nameField, dto.product().name());
                replaceFieldWithLabel(descriptionField, dto.product().description());
                
                String catName = categoryFilter.getSelectedItem() != null ? categoryFilter.getSelectedItem().name() : "None";
                replaceFieldWithLabel(categoryFilter, catName);
                
                replaceFieldWithLabel(statusCombo, formatStatus(statusCombo.getValue()));
                
                String taxName = taxFilter.getSelectedItem() != null ? taxFilter.getSelectedItem().name() : "None";
                replaceFieldWithLabel(taxFilter, taxName);

                saveButton.setVisible(false);
                saveButton.setManaged(false);
                addVariantButton.setVisible(false);
                addVariantButton.setManaged(false);
            }

        } catch (Exception e) {
            e.printStackTrace();
            System.err.println("Failed to load product details: " + e.getMessage());
            NotificationService.error("Failed to load product details: " + e.getMessage());
        }
    }

    @FXML
    public void initialize() {
        if (addVariantButton != null) {
            FontIcon plusIcon = new FontIcon("bx-plus");
            plusIcon.setIconSize(16);
            plusIcon.setIconColor(javafx.scene.paint.Color.WHITE);
            addVariantButton.setGraphic(plusIcon);
            addVariantButton.setText("Add Variant");
        }

        if (descriptionField != null) {
            descriptionField.setPrefHeight(100);
            descriptionField.setMinHeight(80);
        }

        loadCategories();
        loadTaxCategories();

        statusCombo.setItems(FXCollections.observableArrayList("active", "inactive", "discontinued"));
        statusCombo.setConverter(new javafx.util.StringConverter<String>() {
            @Override
            public String toString(String object) {
                if (object == null || object.isEmpty()) return "";
                return object.substring(0, 1).toUpperCase() + object.substring(1).toLowerCase();
            }
            @Override
            public String fromString(String string) {
                if (string == null || string.isEmpty()) return "";
                return string.toLowerCase();
            }
        });
        statusCombo.setValue("active");

        statusCombo.valueProperty().addListener((obs, oldVal, newVal) -> {
            updateVariantStatusesBasedOnProductStatus(newVal);
        });
    }

    private void updateVariantStatusesBasedOnProductStatus(String productStatus) {
        if (productStatus == null) return;
        boolean isActive = "active".equals(productStatus.toLowerCase());

        for (VariantRow row : variantRows) {
            row.updateAvailableStatuses(isActive);
        }
    }

    private void loadCategories() {
        List<Category> categories = categoryService.getAllCategories();
        List<CategoryItem> items = categories.stream()
                .map(c -> new CategoryItem(c.id(), c.name()))
                .toList();

        categoryFilter.setItems(items);
    }

    private void loadTaxCategories() {
        List<TaxCategory> taxes = taxRepository.getAllTaxCategories();
        List<TaxCategoryItem> items = taxes.stream()
                .map(t -> new TaxCategoryItem(t.id(), t.name()))
                .toList();
        taxFilter.setItems(items);
    }

    @FXML
    private void handleAddVariant() {
        addVariantRow(false, null);
    }

    private void addVariantRow(boolean isDefault, String name) {
        VariantRow row = new VariantRow(isDefault, name);

        String productStatus = statusCombo != null ? statusCombo.getValue() : "active";
        boolean isActive = productStatus == null || "active".equals(productStatus.toLowerCase());
        row.updateAvailableStatuses(isActive);

        variantRows.add(row);
        variantsContainer.getChildren().add(row.getView());
    }

    private void removeVariantRow(VariantRow row) {
        if (variantRows.size() > 1) {
            boolean wasDefault = row.isDefault();
            variantRows.remove(row);
            variantsContainer.getChildren().remove(row.getView());
            
            // If we removed the default variant, set the first remaining one as default
            if (wasDefault && !variantRows.isEmpty()) {
                variantRows.get(0).setDefault(true);
            }
        }
    }

    @FXML
    private void handleSave() {
        try {
            validateInputs();

            long userId = AuthContext.getCurrentUser().id();

            List<ProductService.VariantCommand> variants = variantRows.stream().map(row -> {
                return new ProductService.VariantCommand(
                        row.getVariantId(),
                        row.getName(),
                        row.getSku(),
                        new BigDecimal(row.getPrice()),
                        new BigDecimal(row.getCostPrice()),
                        Integer.parseInt(row.getStockAlert()),
                        row.isDefault(),
                        row.getStatus(),
                        row.getStock(),
                        row.getAdjustmentReason()
                );
            }).toList();

            Long categoryId = categoryFilter.getSelectedItem() != null ? categoryFilter.getSelectedItem().id() : null;
            Long taxId = taxFilter.getSelectedItem() != null ? taxFilter.getSelectedItem().id() : null;
            List<Long> taxIds = taxId != null ? List.of(taxId) : null;

            if (productId == null) {
                ProductService.CreateProductCommand cmd = new ProductService.CreateProductCommand(
                        nameField.getText(),
                        descriptionField.getText(),
                        categoryId,
                        statusCombo.getValue(),
                        null,
                        variants,
                        taxIds,
                        userId
                );
                productService.createProductWithVariants(cmd);
                NotificationService.success("Product created successfully");
            } else {
                ProductService.UpdateProductCommand cmd = new ProductService.UpdateProductCommand(
                        nameField.getText(),
                        descriptionField.getText(),
                        categoryId,
                        statusCombo.getValue(),
                        null,
                        variants,
                        taxIds,
                        userId
                );
                productService.updateProduct(productId, cmd);
                NotificationService.success("Product updated successfully");
            }

            workspaceManager.closeActiveWindow();
        } catch (Exception e) {
            NotificationService.error("Failed to save product: " + e.getMessage());
        }
    }

    private void validateInputs() {
        if (nameField.getText() == null || nameField.getText().trim().isEmpty()) {
            throw new IllegalArgumentException("Product name is required");
        }

        if (variantRows.isEmpty()) {
            throw new IllegalArgumentException("At least one variant is required");
        }

        boolean hasDefault = false;
        for (VariantRow row : variantRows) {
            if (row.getName() == null || row.getName().trim().isEmpty()) {
                throw new IllegalArgumentException("Variant name is required");
            }
            if (row.getPrice() == null || row.getPrice().trim().isEmpty()) {
                throw new IllegalArgumentException("Variant price is required");
            }
            if (row.getCostPrice() == null || row.getCostPrice().trim().isEmpty()) {
                throw new IllegalArgumentException("Variant cost price is required");
            }
            if (row.getStockAlert() == null || row.getStockAlert().trim().isEmpty()) {
                throw new IllegalArgumentException("Variant stock alert is required");
            }
            try {
                new BigDecimal(row.getPrice());
                new BigDecimal(row.getCostPrice());
            } catch (NumberFormatException e) {
                throw new IllegalArgumentException("Price and Cost Price must be valid numbers");
            }
            try {
                Integer.parseInt(row.getStockAlert());
            } catch (NumberFormatException e) {
                throw new IllegalArgumentException("Stock Alert must be a valid integer");
            }
            if (row.stockField.getText() == null || row.stockField.getText().trim().isEmpty()) {
                throw new IllegalArgumentException("Current Stock is required");
            }
            try {
                Integer.parseInt(row.stockField.getText().trim());
            } catch (NumberFormatException e) {
                throw new IllegalArgumentException("Current Stock must be a valid integer");
            }
            if (row.isDefault()) {
                hasDefault = true;
            }
        }

        if (!hasDefault) {
            throw new IllegalArgumentException("One variant must be selected as default");
        }
    }

    @FXML
    private void handleCancel() {
        workspaceManager.closeActiveWindow();
    }

    private void replaceFieldWithLabel(Control field, String text) {
        if (field == null || field.getParent() == null) return;
        Label label = new Label(text != null ? text : "");
        label.setStyle("-fx-font-size: 14px; -fx-text-fill: #1e293b; -fx-padding: 8 12;");
        label.setWrapText(true);
        
        javafx.scene.Parent parent = field.getParent();
        if (parent instanceof VBox box) {
            int index = box.getChildren().indexOf(field);
            if (index != -1) {
                box.getChildren().set(index, label);
            }
        } else if (parent instanceof HBox box) {
            int index = box.getChildren().indexOf(field);
            if (index != -1) {
                box.getChildren().set(index, label);
            }
        }
    }

    private record CategoryItem(Long id, String name) {
        @Override
        public String toString() {
            return name;
        }
    }

    private record TaxCategoryItem(Long id, String name) {
        @Override
        public String toString() {
            return name;
        }
    }

    class VariantRow {
        private final VBox view;
        private final TextField variantNameField;
        private final TextField skuField;
        private final TextField priceField;
        private final TextField costPriceField;
        private final TextField marginField;
        private final TextField stockAlertField;
        private final TextField stockField;
        private final ComboBox<String> adjustmentReasonCombo;
        private final VBox adjustmentReasonBox;
        private final ComboBox<String> variantStatusCombo;
        private final RadioButton defaultRadio;
        private Long variantId = null;
        private Integer initialStock = 0;

        private final Button removeBtn;

        public void updateAvailableStatuses(boolean productIsActive) {
            String currentStatus = variantStatusCombo.getValue();
            if (productIsActive) {
                variantStatusCombo.setItems(FXCollections.observableArrayList("active", "inactive", "discontinued"));
            } else {
                variantStatusCombo.setItems(FXCollections.observableArrayList("inactive", "discontinued"));
                if ("active".equals(currentStatus)) {
                    variantStatusCombo.setValue("inactive");
                }
            }
        }

        public VariantRow(boolean isDefault, String initialName) {
            view = new VBox(14);
            view.getStyleClass().add("variant-row-container");

            HBox headerBox = new HBox(12);
            headerBox.getStyleClass().add("variant-row-header");
            headerBox.setAlignment(javafx.geometry.Pos.CENTER_LEFT);
            Label title = new Label("Variant Details");
            title.getStyleClass().add("variant-row-title");

            defaultRadio = new RadioButton("Default Variant");
            defaultRadio.setToggleGroup(defaultVariantGroup);
            defaultRadio.setSelected(isDefault);

            Region spacer = new Region();
            HBox.setHgrow(spacer, Priority.ALWAYS);

            removeBtn = new Button("Remove");
            FontIcon trashIcon = new FontIcon("bx-trash");
            trashIcon.setIconSize(14);
            trashIcon.setIconColor(javafx.scene.paint.Color.web("#ef4444"));
            removeBtn.setGraphic(trashIcon);
            removeBtn.getStyleClass().add("btn-remove-variant");
            removeBtn.setOnAction(e -> removeVariantRow(this));

            headerBox.getChildren().addAll(title, defaultRadio, spacer, removeBtn);

            HBox row1 = new HBox(14);
            row1.getStyleClass().add("variant-field-row");
            variantNameField = createTextField("Variant Name", initialName != null ? initialName : "e.g. Small, Red");
            skuField = createTextField("SKU", "Stock Keeping Unit");
            row1.getChildren().addAll(createFieldBox("Name *", variantNameField), createFieldBox("SKU", skuField));

            HBox row2 = new HBox(14);
            row2.getStyleClass().add("variant-field-row");
            priceField = createTextField("Price", "0.00");
            costPriceField = createTextField("Cost Price", "0.00");
            marginField = createTextField("Margin %", "0.00%");
            marginField.setEditable(false);
            marginField.setStyle("-fx-background-color: #f8fafc; -fx-text-fill: #64748b;");
            
            priceField.textProperty().addListener((obs, oldV, newV) -> updateMargin());
            costPriceField.textProperty().addListener((obs, oldV, newV) -> updateMargin());

            row2.getChildren().addAll(
                createFieldBox("Price *", priceField), 
                createFieldBox("Cost Price *", costPriceField),
                createFieldBox("Margin %", marginField)
            );

            HBox row3 = new HBox(14);
            row3.getStyleClass().add("variant-field-row");
            stockAlertField = createTextField("Stock Alert Cap", "10");
            variantStatusCombo = new ComboBox<>(FXCollections.observableArrayList("active", "inactive", "discontinued"));
            variantStatusCombo.setConverter(new javafx.util.StringConverter<String>() {
                @Override
                public String toString(String object) {
                    if (object == null || object.isEmpty()) return "";
                    return object.substring(0, 1).toUpperCase() + object.substring(1).toLowerCase();
                }
                @Override
                public String fromString(String string) {
                    if (string == null || string.isEmpty()) return "";
                    return string.toLowerCase();
                }
            });
            variantStatusCombo.setValue("active");
            variantStatusCombo.setMaxWidth(Double.MAX_VALUE);
            
            stockField = createTextField("Stock Level", "0");
            stockField.textProperty().addListener((obs, oldV, newV) -> updateAdjustmentReasonVisibility());

            adjustmentReasonCombo = new ComboBox<>(FXCollections.observableArrayList(
                "Correction", "Damage", "Return", "Stocktake", "Expiry", "Theft", "Other"
            ));
            adjustmentReasonCombo.setValue("Correction");
            adjustmentReasonCombo.setMaxWidth(Double.MAX_VALUE);
            
            adjustmentReasonBox = createFieldBox("Adjustment Reason *", adjustmentReasonCombo);
            adjustmentReasonBox.setVisible(false);
            adjustmentReasonBox.setManaged(false);

            row3.getChildren().addAll(
                createFieldBox("Stock Alert", stockAlertField), 
                createFieldBox("Status", variantStatusCombo),
                createFieldBox("Current Stock", stockField)
            );

            view.getChildren().addAll(headerBox, row1, row2, row3, adjustmentReasonBox);
            updateMargin();
        }

        private void updateAdjustmentReasonVisibility() {
            if (variantId == null) return;
            
            try {
                int currentStock = Integer.parseInt(stockField.getText().trim());
                boolean changed = currentStock != initialStock;
                adjustmentReasonBox.setVisible(changed);
                adjustmentReasonBox.setManaged(changed);
            } catch (NumberFormatException e) {
                adjustmentReasonBox.setVisible(false);
                adjustmentReasonBox.setManaged(false);
            }
        }

        public void setInitialStock(Integer stock) {
            this.initialStock = stock;
            this.stockField.setText(stock.toString());
        }

        private void updateMargin() {
            try {
                String priceStr = priceField.getText().trim();
                String costStr = costPriceField.getText().trim();
                
                if (priceStr.isEmpty() || costStr.isEmpty()) {
                    marginField.setText("0.00%");
                    return;
                }
                
                BigDecimal price = new BigDecimal(priceStr);
                BigDecimal cost = new BigDecimal(costStr);
                
                if (price.compareTo(BigDecimal.ZERO) > 0) {
                    BigDecimal margin = price.subtract(cost)
                        .divide(price, 4, java.math.RoundingMode.HALF_UP)
                        .multiply(new BigDecimal("100"));
                    marginField.setText(String.format("%.2f%%", margin));
                } else {
                    marginField.setText("0.00%");
                }
            } catch (Exception e) {
                marginField.setText("0.00%");
            }
        }

        public void setReadOnly() {
            replaceFieldWithLabel(variantNameField, variantNameField.getText());
            replaceFieldWithLabel(skuField, skuField.getText());
            replaceFieldWithLabel(priceField, priceField.getText());
            replaceFieldWithLabel(costPriceField, costPriceField.getText());
            replaceFieldWithLabel(marginField, marginField.getText());
            replaceFieldWithLabel(stockAlertField, stockAlertField.getText());
            replaceFieldWithLabel(variantStatusCombo, variantStatusCombo.getValue());
            replaceFieldWithLabel(stockField, stockField.getText());
            
            if (adjustmentReasonBox.isVisible()) {
                replaceFieldWithLabel(adjustmentReasonCombo, adjustmentReasonCombo.getValue());
            }
            
            defaultRadio.setDisable(true);
            defaultRadio.setStyle("-fx-opacity: 1; -fx-text-fill: black;");

            removeBtn.setVisible(false);
            removeBtn.setManaged(false);

            if (isDefault()) {
                view.setStyle("-fx-border-color: #3b82f6; -fx-border-width: 2; -fx-border-radius: 6; -fx-padding: 15; -fx-background-color: #eff6ff;");
            }
        }

        private TextField createTextField(String prompt, String text) {
            TextField field = new TextField();
            field.setPromptText(prompt);
            if (text != null && !text.isEmpty() && !text.startsWith("e.g.") && !text.equals("Stock Keeping Unit")) {
                field.setText(text);
            }
            return field;
        }

        private VBox createFieldBox(String labelText, Control field) {
            VBox box = new VBox(6);
            box.getStyleClass().add("variant-field-box");
            Label label = new Label(labelText);
            label.getStyleClass().add("variant-field-label");
            box.getChildren().addAll(label, field);
            HBox.setHgrow(box, Priority.ALWAYS);
            return box;
        }

        public VBox getView() {
            return view;
        }

        public String getName() { return variantNameField.getText(); }
        public String getSku() { return skuField.getText(); }
        public String getPrice() { return priceField.getText(); }
        public String getCostPrice() { return costPriceField.getText(); }
        public String getStockAlert() { return stockAlertField.getText(); }
        public String getStatus() { return variantStatusCombo.getValue(); }
        public Integer getStock() {
            try {
                return Integer.parseInt(stockField.getText().trim());
            } catch (NumberFormatException e) {
                return 0;
            }
        }
        public String getAdjustmentReason() {
            return adjustmentReasonBox.isVisible() ? adjustmentReasonCombo.getValue().toLowerCase() : null;
        }
        public boolean isDefault() { return defaultRadio.isSelected(); }
        public void setDefault(boolean isDefault) { defaultRadio.setSelected(isDefault); }
        public void setVariantId(Long id) { this.variantId = id; }
        public Long getVariantId() { return variantId; }
    }

    private String formatStatus(String status) {
        if (status == null || status.isBlank()) {
            return "Unknown";
        }
        return status.substring(0, 1).toUpperCase() + status.substring(1).toLowerCase();
    }
}
