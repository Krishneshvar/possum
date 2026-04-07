package com.possum.ui.products;

import com.possum.application.auth.AuthContext;
import com.possum.application.categories.CategoryService;
import com.possum.application.products.ProductService;
import com.possum.domain.model.Category;
import com.possum.domain.model.Product;
import com.possum.shared.dto.PagedResult;
import com.possum.shared.dto.ProductFilter;
import com.possum.ui.common.controllers.AbstractCrudController;
import com.possum.ui.common.controllers.AbstractImportController;
import com.possum.ui.workspace.WorkspaceManager;
import com.possum.shared.util.CsvImportUtil;
import javafx.beans.property.SimpleStringProperty;
import javafx.fxml.FXML;
import javafx.geometry.Pos;
import javafx.scene.control.*;
import javafx.scene.layout.*;
import org.kordamp.ikonli.javafx.FontIcon;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

public class ProductsController extends AbstractCrudController<Product, ProductFilter> {

    @FXML private Button addButton;
    @FXML private FlowPane productsGrid;
    @FXML private ScrollPane productsGridScroll;
    @FXML private ToggleButton cardsViewButton;
    @FXML private ToggleButton tableViewButton;
    @FXML private Button refreshButton;

    private final ProductService productService;
    private final CategoryService categoryService;
    private final com.possum.domain.repositories.TaxRepository taxRepository;
    private final ImportHandler importHandler;

    private List<Long> currentTaxCategoryFilters = java.util.Collections.emptyList();
    private List<String> currentStatusFilters = java.util.Collections.emptyList();
    private List<Long> currentCategoryFilters = java.util.Collections.emptyList();

    private final ToggleGroup viewModeGroup = new ToggleGroup();
    private boolean cardsViewEnabled = true;

    public ProductsController(ProductService productService,
                              CategoryService categoryService,
                              com.possum.domain.repositories.TaxRepository taxRepository,
                              WorkspaceManager workspaceManager) {
        super(workspaceManager);
        this.productService = productService;
        this.categoryService = categoryService;
        this.taxRepository = taxRepository;
        this.importHandler = new ImportHandler();
    }

    @Override
    public void initialize() {
        setupPermissions();
        setupTable();
        setupFilters();
        setupViewMode();
        loadData();
    }

    @Override
    protected void setupPermissions() {
        if (addButton != null) {
            com.possum.ui.common.UIPermissionUtil.requirePermission(addButton, com.possum.application.auth.Permissions.PRODUCTS_MANAGE);
            FontIcon addIcon = new FontIcon("bx-plus");
            addIcon.setIconSize(16);
            addIcon.setIconColor(javafx.scene.paint.Color.WHITE);
            addButton.setGraphic(addIcon);
        }

        if (importHandler.importButton != null) {
            com.possum.ui.common.UIPermissionUtil.requirePermission(importHandler.importButton, com.possum.application.auth.Permissions.PRODUCTS_MANAGE);
        }

        if (cardsViewButton != null) {
            FontIcon gridIcon = new FontIcon("bx-grid-alt");
            gridIcon.setIconSize(16);
            cardsViewButton.setGraphic(gridIcon);
        }
        if (tableViewButton != null) {
            FontIcon listIcon = new FontIcon("bx-list-ul");
            listIcon.setIconSize(16);
            tableViewButton.setGraphic(listIcon);
        }

        if (refreshButton != null) {
            FontIcon refreshIcon = new FontIcon("bx-sync");
            refreshIcon.setIconSize(16);
            refreshButton.setGraphic(refreshIcon);
            refreshButton.setText("Refresh");
        }
    }

    @Override
    protected void setupTable() {
        dataTable.getTableView().setPlaceholder(new Label("No products found. Adjust filters or click + Add Product to create one."));
        dataTable.setEmptyMessage("No products found");
        dataTable.setEmptySubtitle("Try changing filters or create your first product.");

        TableColumn<Product, String> nameCol = new TableColumn<>("Name");
        nameCol.setCellValueFactory(cellData -> new SimpleStringProperty(cellData.getValue().name()));

        TableColumn<Product, String> categoryCol = new TableColumn<>("Category");
        categoryCol.setCellValueFactory(cellData -> new SimpleStringProperty(cellData.getValue().categoryName()));

        TableColumn<Product, String> taxCol = new TableColumn<>("Tax Category");
        taxCol.setCellValueFactory(cellData -> new SimpleStringProperty(cellData.getValue().taxCategoryName() != null ? cellData.getValue().taxCategoryName() : "-"));

        TableColumn<Product, String> statusCol = new TableColumn<>("Status");
        statusCol.setSortable(false);
        statusCol.setCellValueFactory(cellData -> new SimpleStringProperty(cellData.getValue().status()));
        statusCol.setCellFactory(col -> new TableCell<>() {
            @Override
            protected void updateItem(String status, boolean empty) {
                super.updateItem(status, empty);
                if (empty || status == null) {
                    setGraphic(null);
                    setText(null);
                } else {
                    setGraphic(com.possum.ui.common.components.BadgeFactory.createProductStatusBadge(status));
                    setText(null);
                }
            }
        });

        dataTable.getTableView().getColumns().addAll(nameCol, categoryCol, taxCol, statusCol);
        addActionMenuColumn();
    }

    @Override
    protected void setupFilters() {
        List<Category> categories = categoryService.getAllCategories();
        List<com.possum.domain.model.TaxCategory> taxCategories = taxRepository.getAllTaxCategories();

        filterBar.addMultiSelectFilter("status", "Status", List.of("active", "inactive", "discontinued"), 
            item -> item.substring(0, 1).toUpperCase() + item.substring(1), false);
        filterBar.addMultiSelectFilter("taxCategory", "Tax Category", taxCategories, com.possum.domain.model.TaxCategory::name);
        filterBar.addMultiSelectFilter("categories", "Categories", categories, Category::name);

        setupStandardFilterListener((filters, reload) -> {
            @SuppressWarnings("unchecked")
            List<String> statusFilter = (List<String>) filters.get("status");
            currentStatusFilters = statusFilter != null ? statusFilter : java.util.Collections.emptyList();

            @SuppressWarnings("unchecked")
            List<com.possum.domain.model.TaxCategory> taxFilter = (List<com.possum.domain.model.TaxCategory>) filters.get("taxCategory");
            if (taxFilter != null) {
                currentTaxCategoryFilters = taxFilter.stream().map(com.possum.domain.model.TaxCategory::id).toList();
            } else {
                currentTaxCategoryFilters = java.util.Collections.emptyList();
            }

            @SuppressWarnings("unchecked")
            List<Category> cats = (List<Category>) filters.get("categories");
            if (cats != null) {
                currentCategoryFilters = cats.stream().map(Category::id).toList();
            } else {
                currentCategoryFilters = java.util.Collections.emptyList();
            }

            reload.run();
        });
    }

    private void setupViewMode() {
        if (cardsViewButton == null || tableViewButton == null) {
            return;
        }

        cardsViewButton.setToggleGroup(viewModeGroup);
        tableViewButton.setToggleGroup(viewModeGroup);
        cardsViewButton.setSelected(true);

        viewModeGroup.selectedToggleProperty().addListener((obs, oldValue, newValue) -> {
            cardsViewEnabled = newValue == cardsViewButton || newValue == null;
            applyViewMode();
        });

        HBox toggleWrapper = new HBox(8);
        toggleWrapper.setAlignment(Pos.CENTER_RIGHT);
        Label viewLabel = new Label("View:");
        viewLabel.getStyleClass().add("helper-text");

        HBox segmentedControl = new HBox(0);
        segmentedControl.getStyleClass().add("toggle-group-neon");
        segmentedControl.getChildren().addAll(cardsViewButton, tableViewButton);

        toggleWrapper.getChildren().addAll(viewLabel, segmentedControl);
        filterBar.addTopRightControl(toggleWrapper);

        applyViewMode();
    }

    private void applyViewMode() {
        if (productsGridScroll != null) {
            productsGridScroll.setVisible(cardsViewEnabled);
            productsGridScroll.setManaged(cardsViewEnabled);
        }
        if (dataTable != null) {
            dataTable.setVisible(!cardsViewEnabled);
            dataTable.setManaged(!cardsViewEnabled);
        }
    }

    @Override
    protected ProductFilter buildFilter() {
        return new ProductFilter(
            getSearchOrNull(),
            currentTaxCategoryFilters.isEmpty() ? null : currentTaxCategoryFilters,
            currentStatusFilters.isEmpty() ? null : currentStatusFilters,
            currentCategoryFilters.isEmpty() ? null : currentCategoryFilters,
            getCurrentPage(),
            getPageSize(),
            "name",
            "ASC"
        );
    }

    @Override
    protected PagedResult<Product> fetchData(ProductFilter filter) {
        return productService.getProducts(filter);
    }

    @Override
    protected void loadData() {
        super.loadData();
        if (cardsViewEnabled && productsGrid != null) {
            renderProductCards(dataTable.getItems());
        }
    }

    @Override
    protected String getEntityName() {
        return "products";
    }

    @Override
    protected String getEntityNameSingular() {
        return "Product";
    }

    @Override
    protected List<MenuItem> buildActionMenu(Product product) {
        return com.possum.ui.common.components.MenuBuilder.create()
            .addViewAction("View Details", () -> workspaceManager.openWindow(
                "View Product: " + product.name(), 
                "/fxml/products/product-form-view.fxml", 
                Map.of("productId", product.id(), "mode", "view")))
            .addEditAction("Edit Product", () -> workspaceManager.openWindow(
                "Edit Product: " + product.name(), 
                "/fxml/products/product-form-view.fxml", 
                Map.of("productId", product.id(), "mode", "edit")))
            .addSeparator()
            .addDeleteAction("Delete Product", () -> handleDelete(product))
            .build();
    }

    @Override
    protected void deleteEntity(Product entity) throws Exception {
        long userId = AuthContext.getCurrentUser().id();
        productService.deleteProduct(entity.id(), userId);
    }

    @Override
    protected String getEntityIdentifier(Product entity) {
        return entity.name();
    }

    @FXML
    private void handleAdd() {
        workspaceManager.openWindow("Add Product", "/fxml/products/product-form-view.fxml");
    }

    @FXML
    private void handleImport() {
        importHandler.handleImport();
    }

    private void renderProductCards(List<Product> products) {
        if (productsGrid == null) return;

        productsGrid.getChildren().clear();

        if (products == null || products.isEmpty()) {
            VBox empty = new VBox(8);
            empty.getStyleClass().add("empty-state-view");
            empty.setAlignment(Pos.CENTER);
            empty.setPrefWidth(560);

            FontIcon packageIcon = new FontIcon("bx-package");
            packageIcon.setIconSize(48);
            packageIcon.getStyleClass().add("empty-state-icon");

            Label title = new Label("No products found");
            title.getStyleClass().add("empty-state-title");

            Label subtitle = new Label("Adjust search or filters, or add a new product.");
            subtitle.getStyleClass().add("empty-state-subtitle");
            subtitle.setWrapText(true);

            empty.getChildren().addAll(packageIcon, title, subtitle);
            productsGrid.getChildren().add(empty);
            return;
        }

        for (Product product : products) {
            productsGrid.getChildren().add(createProductCard(product));
        }
    }

    private VBox createProductCard(Product product) {
        VBox card = new VBox(10);
        card.getStyleClass().add("product-card");
        card.setPrefWidth(260);
        card.setMinWidth(240);
        card.setMaxWidth(320);

        HBox topRow = new HBox(8);
        topRow.setAlignment(Pos.CENTER_LEFT);

        Label avatar = new Label(initials(product.name()));
        avatar.getStyleClass().add("product-card-avatar");

        VBox titleBox = new VBox(4);
        Label name = new Label(product.name());
        name.getStyleClass().add("product-card-title");
        name.setWrapText(true);

        Label category = new Label(product.categoryName() != null ? product.categoryName() : "Uncategorized");
        category.getStyleClass().add("product-card-meta");

        Label status = com.possum.ui.common.components.BadgeFactory.createProductStatusBadge(product.status());
        status.setMaxWidth(Region.USE_PREF_SIZE);

        titleBox.getChildren().addAll(name, category, status);
        HBox.setHgrow(titleBox, Priority.ALWAYS);

        topRow.getChildren().addAll(avatar, titleBox);

        Label tax = new Label("Tax: " + (product.taxCategoryName() != null ? product.taxCategoryName() : "-"));
        tax.getStyleClass().add("product-card-meta");

        Region spacer = new Region();
        VBox.setVgrow(spacer, Priority.ALWAYS);

        HBox actions = new HBox(8);
        actions.getStyleClass().add("product-card-actions");

        Button viewBtn = com.possum.ui.common.components.ButtonFactory.createCardActionButton("bx-show", () ->
            workspaceManager.openWindow("View Product: " + product.name(), "/fxml/products/product-form-view.fxml", Map.of("productId", product.id(), "mode", "view"))
        );
        viewBtn.setTooltip(new Tooltip("View Details"));

        Button editBtn = com.possum.ui.common.components.ButtonFactory.createCardActionButton("bx-edit", () ->
            workspaceManager.openWindow("Edit Product: " + product.name(), "/fxml/products/product-form-view.fxml", Map.of("productId", product.id(), "mode", "edit"))
        );
        editBtn.setTooltip(new Tooltip("Edit Product"));

        Button deleteBtn = com.possum.ui.common.components.ButtonFactory.createDestructiveCardActionButton("bx-trash", () -> handleDelete(product));
        deleteBtn.setTooltip(new Tooltip("Delete Product"));

        actions.getChildren().addAll(viewBtn, editBtn, deleteBtn);
        actions.setVisible(false);
        actions.setManaged(false);

        card.setOnMouseEntered(e -> {
            actions.setVisible(true);
            actions.setManaged(true);
            if (!card.getStyleClass().contains("product-card-hover")) {
                card.getStyleClass().add("product-card-hover");
            }
        });
        card.setOnMouseExited(e -> {
            actions.setVisible(false);
            actions.setManaged(false);
            card.getStyleClass().remove("product-card-hover");
        });

        card.getChildren().addAll(topRow, tax, spacer, actions);
        return card;
    }

    private String initials(String name) {
        return com.possum.shared.util.TextFormatter.initials(name, "P");
    }

    private String formatStatus(String status) {
        return com.possum.shared.util.TextFormatter.formatStatus(status);
    }

    /**
     * Inner class to handle CSV import functionality
     */
    private class ImportHandler extends AbstractImportController<Product, ProductImportRow> {

        @Override
        protected String[] getRequiredHeaders() {
            return new String[]{"Product Name", "Name"};
        }

        @Override
        protected ProductImportRow parseRow(List<String> row, Map<String, Integer> headers) {
            String name = CsvImportUtil.emptyToNull(CsvImportUtil.getValue(row, headers, "Product Name", "Name"));
            if (name == null || "No Of Products".equalsIgnoreCase(name)) {
                return null;
            }

            String sku = CsvImportUtil.emptyToNull(CsvImportUtil.getValue(row, headers, "Product Code", "SKU"));
            String categoryName = CsvImportUtil.emptyToNull(CsvImportUtil.getValue(
                row, headers, "Division Name", "Category Name", "Category"
            ));

            Integer stockAlert = CsvImportUtil.parseInteger(
                CsvImportUtil.getValue(row, headers, "Minimum Stock Level", "Stock Alert", "Stock Alert Cap"), 0
            );
            if (stockAlert == null || stockAlert < 0) stockAlert = 0;

            BigDecimal price = CsvImportUtil.parseDecimal(
                CsvImportUtil.getValue(row, headers, "MRP", "MRP/Price", "Price"), BigDecimal.ZERO
            );
            if (price.compareTo(BigDecimal.ZERO) < 0) price = BigDecimal.ZERO;

            BigDecimal costPrice = CsvImportUtil.parseDecimal(
                CsvImportUtil.getValue(row, headers, "Avg Item Cost", "Cost Price", "Cost"), BigDecimal.ZERO
            );
            if (costPrice.compareTo(BigDecimal.ZERO) < 0) costPrice = BigDecimal.ZERO;

            return new ProductImportRow(name, sku, categoryName, stockAlert, price, costPrice);
        }

        @Override
        protected Product createEntity(ProductImportRow record) throws Exception {
            List<Category> allCategories = categoryService.getAllCategories();
            Map<String, Long> categoryMap = new HashMap<>();
            for (Category c : allCategories) {
                categoryMap.put(c.name().trim().toLowerCase(Locale.ROOT), c.id());
            }

            Long categoryId = resolveOrCreateCategoryId(record.categoryName(), categoryMap);
            long actorId = AuthContext.getCurrentUser().id();

            ProductService.VariantCommand defaultVariant = new ProductService.VariantCommand(
                null, record.name(), record.sku(), record.price(), record.costPrice(),
                record.stockAlert(), true, "active", 0, "Initial import"
            );

            productService.createProductWithVariants(
                new ProductService.CreateProductCommand(
                    record.name(), "", categoryId, "active", null,
                    List.of(defaultVariant), java.util.Collections.emptyList(), actorId
                )
            );
            return null;
        }

        @Override
        protected String getImportTitle() {
            return "Import Products from CSV";
        }

        @Override
        protected String getEntityName() {
            return "product(s)";
        }

        @Override
        protected void onImportComplete() {
            loadData();
        }

        private Long resolveOrCreateCategoryId(String categoryName, Map<String, Long> categoryMap) {
            if (categoryName == null || categoryName.isBlank()) return null;

            String key = categoryName.trim().toLowerCase(Locale.ROOT);
            Long existingId = categoryMap.get(key);
            if (existingId != null) return existingId;

            Category created = categoryService.createCategory(categoryName.trim(), null);
            categoryMap.put(key, created.id());
            return created.id();
        }
    }

    private record ProductImportRow(
        String name, String sku, String categoryName,
        Integer stockAlert, BigDecimal price, BigDecimal costPrice
    ) {}
}
