package com.possum.ui.products;

import com.possum.application.auth.AuthContext;
import com.possum.application.categories.CategoryService;
import com.possum.application.products.ProductService;
import com.possum.domain.model.Category;
import com.possum.domain.model.TaxCategory;
import com.possum.persistence.repositories.interfaces.TaxRepository;
import com.possum.ui.common.controls.NotificationService;
import com.possum.ui.navigation.NavigationManager;
import com.possum.ui.navigation.Parameterizable;
import javafx.collections.FXCollections;
import javafx.fxml.FXML;
import javafx.scene.control.*;
import javafx.scene.layout.HBox;
import javafx.scene.layout.VBox;
import javafx.scene.layout.Priority;
import javafx.scene.layout.Region;
import javafx.geometry.Insets;
import javafx.application.Platform;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class ProductFormController implements Parameterizable {

    private final ProductService productService;
    private final CategoryService categoryService;
    private final TaxRepository taxRepository;
    private final NavigationManager navigationManager;

    @FXML private Label titleLabel;
    @FXML private TextField nameField;
    @FXML private TextArea descriptionField;
    @FXML private ComboBox<CategoryItem> categoryCombo;
    @FXML private ComboBox<String> statusCombo;
    @FXML private ComboBox<TaxCategoryItem> taxCombo;
    @FXML private VBox variantsContainer;
    @FXML private Button saveButton;
    @FXML private Button addVariantButton;

    private Long productId = null;
    private final List<VariantRow> variantRows = new ArrayList<>();
    private final ToggleGroup defaultVariantGroup = new ToggleGroup();

    public ProductFormController(ProductService productService,
                                 CategoryService categoryService,
                                 TaxRepository taxRepository,
                                 NavigationManager navigationManager) {
        this.productService = productService;
        this.categoryService = categoryService;
        this.taxRepository = taxRepository;
        this.navigationManager = navigationManager;
    }

    @Override
    public void setParameters(Map<String, Object> params) {
        if (params != null && params.containsKey("productId")) {
            this.productId = (Long) params.get("productId");
            String mode = (String) params.get("mode");
            boolean isView = "view".equals(mode);

            titleLabel.setText(isView ? "View Product" : "Edit Product");

            Platform.runLater(() -> loadProductDetails(isView));
        } else {
            this.productId = null;
            titleLabel.setText("Add Product");
            Platform.runLater(() -> {
                if (variantRows.isEmpty()) {
                    addVariantRow(true);
                }
            });
        }
    }

    private void loadProductDetails(boolean isView) {
        try {
            ProductService.ProductWithVariantsDTO dto = productService.getProductWithVariants(productId);

            nameField.setText(dto.product().name());
            descriptionField.setText(dto.product().description());

            if (dto.product().categoryId() != null) {
                categoryCombo.getItems().stream()
                    .filter(c -> c.id().equals(dto.product().categoryId()))
                    .findFirst()
                    .ifPresent(categoryCombo::setValue);
            }

            statusCombo.setValue(dto.product().status() != null ? dto.product().status() : "active");

            if (dto.product().taxCategoryId() != null) {
                taxCombo.getItems().stream()
                    .filter(t -> t.id().equals(dto.product().taxCategoryId()))
                    .findFirst()
                    .ifPresent(taxCombo::setValue);
            }

            variantRows.clear();
            variantsContainer.getChildren().clear();

            if (dto.variants() != null && !dto.variants().isEmpty()) {
                for (com.possum.domain.model.Variant v : dto.variants()) {
                    VariantRow row = new VariantRow(Boolean.TRUE.equals(v.defaultVariant()));
                    row.setVariantId(v.id());
                    row.variantNameField.setText(v.name());
                    row.skuField.setText(v.sku() != null ? v.sku() : "");
                    row.priceField.setText(v.price() != null ? v.price().toString() : "");
                    row.costPriceField.setText(v.costPrice() != null ? v.costPrice().toString() : "");
                    row.stockAlertField.setText(v.stockAlertCap() != null ? v.stockAlertCap().toString() : "");
                    row.variantStatusCombo.setValue(v.status() != null ? v.status() : "active");

                    if (isView) {
                        row.setReadOnly();
                    }

                    variantRows.add(row);
                    variantsContainer.getChildren().add(row.getView());
                }
            } else {
                addVariantRow(true);
            }

            if (isView) {
                nameField.setEditable(false);
                descriptionField.setEditable(false);
                categoryCombo.setDisable(true);
                statusCombo.setDisable(true);
                taxCombo.setDisable(true);
                saveButton.setVisible(false);
                addVariantButton.setVisible(false);
            }

        } catch (Exception e) {
            NotificationService.error("Failed to load product details: " + e.getMessage());
        }
    }

    @FXML
    public void initialize() {
        loadCategories();
        loadTaxCategories();

        statusCombo.setItems(FXCollections.observableArrayList("active", "inactive", "discontinued"));
        statusCombo.setValue("active");
    }

    private void loadCategories() {
        List<Category> categories = categoryService.getAllCategories();
        List<CategoryItem> items = categories.stream()
                .map(c -> new CategoryItem(c.id(), c.name()))
                .toList();
        categoryCombo.setItems(FXCollections.observableArrayList(items));
    }

    private void loadTaxCategories() {
        List<TaxCategory> taxes = taxRepository.getAllTaxCategories();
        List<TaxCategoryItem> items = taxes.stream()
                .map(t -> new TaxCategoryItem(t.id(), t.name()))
                .toList();
        taxCombo.setItems(FXCollections.observableArrayList(items));
    }

    @FXML
    private void handleAddVariant() {
        addVariantRow(false);
    }

    private void addVariantRow(boolean isDefault) {
        VariantRow row = new VariantRow(isDefault);
        variantRows.add(row);
        variantsContainer.getChildren().add(row.getView());
    }

    private void removeVariantRow(VariantRow row) {
        if (variantRows.size() > 1) {
            variantRows.remove(row);
            variantsContainer.getChildren().remove(row.getView());
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
                        row.getStatus()
                );
            }).toList();

            Long categoryId = categoryCombo.getValue() != null ? categoryCombo.getValue().id() : null;
            Long taxId = taxCombo.getValue() != null ? taxCombo.getValue().id() : null;
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

            navigationManager.navigateTo("products");
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
        navigationManager.navigateTo("products");
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
        private final TextField stockAlertField;
        private final ComboBox<String> variantStatusCombo;
        private final RadioButton defaultRadio;
        private Long variantId = null;

        private final Button removeBtn;

        public VariantRow(boolean isDefault) {
            view = new VBox(10);
            view.setStyle("-fx-border-color: #e2e8f0; -fx-border-radius: 6; -fx-padding: 15;");

            HBox headerBox = new HBox(10);
            headerBox.setAlignment(javafx.geometry.Pos.CENTER_LEFT);
            Label title = new Label("Variant Details");
            title.setStyle("-fx-font-weight: bold; -fx-text-fill: #475569;");

            defaultRadio = new RadioButton("Default Variant");
            defaultRadio.setToggleGroup(defaultVariantGroup);
            defaultRadio.setSelected(isDefault);

            Region spacer = new Region();
            HBox.setHgrow(spacer, Priority.ALWAYS);

            removeBtn = new Button("Remove");
            removeBtn.setStyle("-fx-text-fill: #ef4444; -fx-background-color: transparent; -fx-cursor: hand;");
            removeBtn.setOnAction(e -> removeVariantRow(this));

            headerBox.getChildren().addAll(title, defaultRadio, spacer, removeBtn);

            HBox row1 = new HBox(15);
            variantNameField = createTextField("Variant Name", "e.g. Small, Red");
            skuField = createTextField("SKU", "Stock Keeping Unit");
            row1.getChildren().addAll(createFieldBox("Name *", variantNameField), createFieldBox("SKU", skuField));

            HBox row2 = new HBox(15);
            priceField = createTextField("Price", "0.00");
            costPriceField = createTextField("Cost Price", "0.00");
            row2.getChildren().addAll(createFieldBox("Price *", priceField), createFieldBox("Cost Price *", costPriceField));

            HBox row3 = new HBox(15);
            stockAlertField = createTextField("Stock Alert Cap", "10");
            variantStatusCombo = new ComboBox<>(FXCollections.observableArrayList("active", "inactive", "discontinued"));
            variantStatusCombo.setValue("active");
            variantStatusCombo.setMaxWidth(Double.MAX_VALUE);
            row3.getChildren().addAll(createFieldBox("Stock Alert", stockAlertField), createFieldBox("Status", variantStatusCombo));

            view.getChildren().addAll(headerBox, row1, row2, row3);
        }

        public void setReadOnly() {
            variantNameField.setEditable(false);
            skuField.setEditable(false);
            priceField.setEditable(false);
            costPriceField.setEditable(false);
            stockAlertField.setEditable(false);
            variantStatusCombo.setDisable(true);
            defaultRadio.setDisable(true);
            removeBtn.setVisible(false);
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
            VBox box = new VBox(5);
            Label label = new Label(labelText);
            label.setStyle("-fx-font-size: 12px; -fx-text-fill: #64748b;");
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
        public boolean isDefault() { return defaultRadio.isSelected(); }
        public void setVariantId(Long id) { this.variantId = id; }
        public Long getVariantId() { return variantId; }
    }
}
