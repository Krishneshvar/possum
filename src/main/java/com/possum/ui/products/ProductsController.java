package com.possum.ui.products;

import com.possum.application.auth.AuthContext;
import com.possum.application.auth.AuthUser;
import com.possum.application.categories.CategoryService;
import com.possum.application.products.ProductService;
import com.possum.domain.model.Category;
import com.possum.domain.model.Product;
import com.possum.shared.dto.PagedResult;
import com.possum.shared.dto.ProductFilter;
import com.possum.ui.common.controls.DataTableView;
import com.possum.ui.common.controls.FilterBar;
import com.possum.ui.common.controls.NotificationService;
import com.possum.ui.common.controls.PaginationBar;
import com.possum.ui.common.dialogs.DialogStyler;
import com.possum.ui.common.dialogs.ImportProgressDialog;
import com.possum.ui.workspace.WorkspaceManager;
import com.possum.shared.util.CsvImportUtil;
import javafx.concurrent.Task;
import javafx.application.Platform;
import javafx.beans.property.SimpleStringProperty;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.fxml.FXML;
import javafx.geometry.Pos;
import javafx.scene.control.Alert;
import javafx.scene.control.Button;
import javafx.scene.control.ButtonType;
import javafx.scene.control.Label;
import javafx.scene.control.MenuItem;
import javafx.scene.control.SeparatorMenuItem;
import javafx.scene.control.TableColumn;
import javafx.scene.control.ToggleButton;
import javafx.scene.control.ToggleGroup;
import javafx.scene.layout.FlowPane;
import javafx.scene.layout.HBox;
import javafx.scene.layout.Priority;
import javafx.scene.layout.Region;
import javafx.scene.layout.VBox;
import javafx.scene.control.ScrollPane;
import org.kordamp.ikonli.javafx.FontIcon;

import java.io.File;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Locale;
import javafx.stage.FileChooser;

public class ProductsController {

    @FXML
    private FilterBar filterBar;
    @FXML
    private DataTableView<Product> productsTable;
    @FXML
    private PaginationBar paginationBar;
    @FXML
    private Button addButton;
    @FXML
    private FlowPane productsGrid;
    @FXML
    private ScrollPane productsGridScroll;
    @FXML
    private ToggleButton cardsViewButton;
    @FXML
    private ToggleButton tableViewButton;
    @FXML
    private Button refreshButton;
    @FXML
    private Button importButton;

    private final ProductService productService;
    private final CategoryService categoryService;
    private final WorkspaceManager workspaceManager;
    private final com.possum.persistence.repositories.interfaces.TaxRepository taxRepository;

    private String currentSearch = "";
    private List<Long> currentTaxCategoryFilters = java.util.Collections.emptyList();
    private List<String> currentStatusFilters = java.util.Collections.emptyList();
    private List<Long> currentCategoryFilters = java.util.Collections.emptyList();

    private final ToggleGroup viewModeGroup = new ToggleGroup();
    private boolean cardsViewEnabled = true;

    public ProductsController(ProductService productService,
                              CategoryService categoryService,
                              com.possum.persistence.repositories.interfaces.TaxRepository taxRepository,
                              WorkspaceManager workspaceManager) {
        this.productService = productService;
        this.categoryService = categoryService;
        this.taxRepository = taxRepository;
        this.workspaceManager = workspaceManager;
    }

    @FXML
    public void initialize() {
        if (addButton != null) {
            com.possum.ui.common.UIPermissionUtil.requirePermission(addButton, com.possum.application.auth.Permissions.PRODUCTS_MANAGE);
            FontIcon addIcon = new FontIcon("bx-plus");
            addIcon.setIconSize(16);
            addIcon.setIconColor(javafx.scene.paint.Color.WHITE);
            addButton.setGraphic(addIcon);
        }

        if (importButton != null) {
            com.possum.ui.common.UIPermissionUtil.requirePermission(importButton, com.possum.application.auth.Permissions.PRODUCTS_MANAGE);
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

        productsTable.getTableView().setPlaceholder(new Label("No products found. Adjust filters or click + Add Product to create one."));
        productsTable.setEmptyMessage("No products found");
        productsTable.setEmptySubtitle("Try changing filters or create your first product.");

        if (refreshButton != null) {
            FontIcon refreshIcon = new FontIcon("bx-sync");
            refreshIcon.setIconSize(16);
            refreshButton.setGraphic(refreshIcon);
            refreshButton.setText("Refresh");
        }
        setupTable();
        setupFilters();
        setupViewMode();
        loadProducts();
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

        HBox segmentedControl = new HBox(0); // No spacing between buttons
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
        if (productsTable != null) {
            productsTable.setVisible(!cardsViewEnabled);
            productsTable.setManaged(!cardsViewEnabled);
        }
    }

    private void setupTable() {
        TableColumn<Product, String> nameCol = new TableColumn<>("Name");
        nameCol.setCellValueFactory(cellData -> new SimpleStringProperty(cellData.getValue().name()));

        TableColumn<Product, String> categoryCol = new TableColumn<>("Category");
        categoryCol.setCellValueFactory(cellData -> new SimpleStringProperty(cellData.getValue().categoryName()));

        TableColumn<Product, String> taxCol = new TableColumn<>("Tax Category");
        taxCol.setCellValueFactory(cellData -> new SimpleStringProperty(cellData.getValue().taxCategoryName() != null ? cellData.getValue().taxCategoryName() : "-"));

        TableColumn<Product, String> statusCol = new TableColumn<>("Status");
        statusCol.setSortable(false);
        statusCol.setCellValueFactory(cellData -> new SimpleStringProperty(cellData.getValue().status()));
        statusCol.setCellFactory(col -> new javafx.scene.control.TableCell<>() {
            @Override
            protected void updateItem(String status, boolean empty) {
                super.updateItem(status, empty);
                if (empty || status == null) {
                    setGraphic(null);
                    setText(null);
                } else {
                    Label badge = new Label(formatStatus(status));
                    badge.getStyleClass().addAll("badge", "badge-status");
                    applyStatusClass(badge, status);
                    setGraphic(badge);
                    setText(null);
                }
            }
        });

        productsTable.getTableView().getColumns().addAll(nameCol, categoryCol, taxCol, statusCol);
        productsTable.addMenuActionColumn("Actions", this::buildActionsMenu);
    }

    private void setupFilters() {
        List<Category> categories = categoryService.getAllCategories();
        List<com.possum.domain.model.TaxCategory> taxCategories = taxRepository.getAllTaxCategories();

        filterBar.addMultiSelectFilter("status", "Status", List.of("active", "inactive", "discontinued"), item -> item.substring(0, 1).toUpperCase() + item.substring(1), false);
        filterBar.addMultiSelectFilter("taxCategory", "Tax Category", taxCategories, com.possum.domain.model.TaxCategory::name);
        filterBar.addMultiSelectFilter("categories", "Categories", categories, Category::name);

        filterBar.setOnFilterChange(filters -> {
            currentSearch = (String) filters.get("search");

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

            loadProducts();
        });

        paginationBar.setOnPageChange((page, size) -> loadProducts());
    }

    private void loadProducts() {
        productsTable.setLoading(true);

        Platform.runLater(() -> {
            try {
                ProductFilter filter = new ProductFilter(
                    currentSearch == null || currentSearch.isEmpty() ? null : currentSearch,
                    currentTaxCategoryFilters.isEmpty() ? null : currentTaxCategoryFilters,
                    currentStatusFilters.isEmpty() ? null : currentStatusFilters,
                    currentCategoryFilters.isEmpty() ? null : currentCategoryFilters,
                    paginationBar.getCurrentPage(),
                    paginationBar.getPageSize(),
                    "name",
                    "ASC"
                );

                PagedResult<Product> result = productService.getProducts(filter);
                ObservableList<Product> products = FXCollections.observableArrayList(result.items());

                productsTable.setItems(products);
                renderProductCards(products);
                paginationBar.setTotalItems(result.totalCount());
                productsTable.setLoading(false);
            } catch (Exception e) {
                productsTable.setLoading(false);
                NotificationService.error("Failed to load products");
            }
        });
    }

    @FXML
    private void handleRefresh() {
        loadProducts();
    }

    @FXML
    private void handleImport() {
        FileChooser fileChooser = new FileChooser();
        fileChooser.setTitle("Import Products from CSV");
        fileChooser.getExtensionFilters().add(
                new FileChooser.ExtensionFilter("CSV Files", "*.csv"));

        File file = fileChooser.showOpenDialog(
                addButton != null ? addButton.getScene().getWindow() : null);
        if (file == null) return;

        AuthUser currentUser = AuthContext.getCurrentUser();
        if (currentUser == null) {
            NotificationService.error("No active user session found. Please sign in again and retry import.");
            return;
        }

        javafx.stage.Window owner = addButton != null && addButton.getScene() != null
                ? addButton.getScene().getWindow()
                : null;
        ImportProgressDialog progressDialog = new ImportProgressDialog(owner, "Import Products");
        progressDialog.show();

        Task<ImportResult> importTask = new Task<>() {
            @Override
            protected ImportResult call() throws Exception {
                AuthContext.setCurrentUser(currentUser);
                try {
                    List<List<String>> rows = CsvImportUtil.readCsv(file.toPath());
                    int headerIndex = CsvImportUtil.findHeaderRowIndex(rows, "Product Name");
                    if (headerIndex < 0) {
                        headerIndex = CsvImportUtil.findHeaderRowIndex(rows, "Name");
                    }
                    if (headerIndex < 0) {
                        throw new IllegalArgumentException("Could not find a valid product header row in CSV.");
                    }

                    Map<String, Integer> headers = CsvImportUtil.buildHeaderIndex(rows.get(headerIndex));
                    List<ProductImportRow> records = new ArrayList<>();

                    for (int i = headerIndex + 1; i < rows.size(); i++) {
                        List<String> row = rows.get(i);
                        if (CsvImportUtil.isRowEmpty(row)) {
                            continue;
                        }

                        String name = CsvImportUtil.emptyToNull(CsvImportUtil.getValue(row, headers, "Product Name", "Name"));
                        if (name == null || "No Of Products".equalsIgnoreCase(name)) {
                            continue;
                        }

                        String sku = CsvImportUtil.emptyToNull(CsvImportUtil.getValue(row, headers, "Product Code", "SKU"));
                        String categoryName = CsvImportUtil.emptyToNull(CsvImportUtil.getValue(
                                row,
                                headers,
                                "Division Name",
                                "Category Name",
                                "Category"
                        ));

                        Integer stockAlert = CsvImportUtil.parseInteger(
                                CsvImportUtil.getValue(row, headers, "Minimum Stock Level", "Stock Alert", "Stock Alert Cap"),
                                0
                        );
                        if (stockAlert == null || stockAlert < 0) {
                            stockAlert = 0;
                        }

                        BigDecimal price = CsvImportUtil.parseDecimal(
                                CsvImportUtil.getValue(row, headers, "MRP", "MRP/Price", "Price"),
                                BigDecimal.ZERO
                        );
                        if (price.compareTo(BigDecimal.ZERO) < 0) {
                            price = BigDecimal.ZERO;
                        }

                        BigDecimal costPrice = CsvImportUtil.parseDecimal(
                                CsvImportUtil.getValue(row, headers, "Avg Item Cost", "Cost Price", "Cost"),
                                BigDecimal.ZERO
                        );
                        if (costPrice.compareTo(BigDecimal.ZERO) < 0) {
                            costPrice = BigDecimal.ZERO;
                        }

                        records.add(new ProductImportRow(name, sku, categoryName, stockAlert, price, costPrice));
                    }

                    int totalRecords = records.size();
                    progressDialog.setTotalRecords(totalRecords);

                    List<Category> allCategories = categoryService.getAllCategories();
                    Map<String, Long> categoryMap = new java.util.HashMap<>();
                    for (Category c : allCategories) {
                        categoryMap.put(c.name().trim().toLowerCase(Locale.ROOT), c.id());
                    }

                    int processed = 0;
                    int imported = 0;
                    int skipped = 0;
                    long actorId = currentUser.id();

                    for (ProductImportRow record : records) {
                        processed++;

                        Long categoryId;
                        try {
                            categoryId = resolveOrCreateCategoryId(record.categoryName(), categoryMap);
                        } catch (Exception ex) {
                            skipped++;
                            progressDialog.updateProgress(processed, imported);
                            continue;
                        }

                        try {
                            ProductService.VariantCommand defaultVariant = new ProductService.VariantCommand(
                                    null,
                                    record.name(),
                                    record.sku(),
                                    record.price(),
                                    record.costPrice(),
                                    record.stockAlert(),
                                    true,
                                    "active",
                                    0,
                                    "Initial import"
                            );

                            productService.createProductWithVariants(
                                    new ProductService.CreateProductCommand(
                                            record.name(),
                                            "",
                                            categoryId,
                                            "active",
                                            null,
                                            List.of(defaultVariant),
                                            java.util.Collections.emptyList(),
                                            actorId
                                    )
                            );
                            imported++;
                        } catch (Exception ex) {
                            skipped++;
                        }

                        progressDialog.updateProgress(processed, imported);
                    }

                    return new ImportResult(totalRecords, imported, skipped);
                } finally {
                    AuthContext.clear();
                }
            }
        };

        importTask.setOnSucceeded(event -> {
            ImportResult result = importTask.getValue();
            progressDialog.complete(result.totalRecords(), result.imported(), result.skipped());
            loadProducts();

            if (result.skipped() == 0) {
                NotificationService.success("Imported " + result.imported() + " product(s) successfully.");
            } else {
                NotificationService.warning("Imported " + result.imported() + " product(s). " + result.skipped() + " row(s) skipped.");
            }
        });

        importTask.setOnFailed(event -> {
            Throwable error = importTask.getException();
            String message = error != null && error.getMessage() != null ? error.getMessage() : "Unknown error";
            progressDialog.fail(message);
            NotificationService.error("Failed to import products: " + message);
        });

        Thread worker = new Thread(importTask, "products-import-task");
        worker.setDaemon(true);
        worker.start();
    }

    private Long resolveOrCreateCategoryId(String categoryName, Map<String, Long> categoryMap) {
        if (categoryName == null || categoryName.isBlank()) {
            return null;
        }

        String key = categoryName.trim().toLowerCase(Locale.ROOT);
        Long existingId = categoryMap.get(key);
        if (existingId != null) {
            return existingId;
        }

        Category created = categoryService.createCategory(categoryName.trim(), null);
        categoryMap.put(key, created.id());
        return created.id();
    }

    private record ProductImportRow(
            String name,
            String sku,
            String categoryName,
            Integer stockAlert,
            BigDecimal price,
            BigDecimal costPrice
    ) {}

    private record ImportResult(int totalRecords, int imported, int skipped) {}

    @FXML
    private void handleAdd() {
        workspaceManager.openWindow("Add Product", "/fxml/products/product-form-view.fxml");
    }

    private void renderProductCards(List<Product> products) {
        if (productsGrid == null) {
            return;
        }

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

        Label status = new Label(formatStatus(product.status()));
        status.getStyleClass().add("badge-status");
        applyStatusClass(status, product.status());
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

        Button viewBtn = iconButton("", "bx-show", () ->
            workspaceManager.openWindow("View Product: " + product.name(), "/fxml/products/product-form-view.fxml", Map.of("productId", product.id(), "mode", "view"))
        );
        viewBtn.setTooltip(new javafx.scene.control.Tooltip("View Details"));

        Button editBtn = iconButton("", "bx-edit", () ->
            workspaceManager.openWindow("Edit Product: " + product.name(), "/fxml/products/product-form-view.fxml", Map.of("productId", product.id(), "mode", "edit"))
        );
        editBtn.setTooltip(new javafx.scene.control.Tooltip("Edit Product"));

        Button deleteBtn = iconButton("", "bx-trash", () -> handleDelete(product));
        deleteBtn.getStyleClass().add("card-action-btn-destructive");
        deleteBtn.setTooltip(new javafx.scene.control.Tooltip("Delete Product"));

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

    private Button iconButton(String text, String iconCode, Runnable action) {
        Button button = new Button(text);
        button.getStyleClass().add("card-action-btn");
        FontIcon icon = new FontIcon(iconCode);
        icon.getStyleClass().add("card-action-icon");
        icon.setIconSize(16);
        button.setGraphic(icon);
        button.setOnAction(e -> action.run());
        return button;
    }

    private String initials(String name) {
        if (name == null || name.isBlank()) {
            return "P";
        }
        String[] parts = name.trim().split("\\s+");
        if (parts.length == 1) {
            return parts[0].substring(0, 1).toUpperCase();
        }
        return (parts[0].substring(0, 1) + parts[1].substring(0, 1)).toUpperCase();
    }

    private String formatStatus(String status) {
        if (status == null || status.isBlank()) {
            return "Unknown";
        }
        return status.substring(0, 1).toUpperCase() + status.substring(1).toLowerCase();
    }

    private void applyStatusClass(Label label, String status) {
        if (status == null) {
            label.getStyleClass().add("badge-neutral");
            return;
        }
        switch (status.toLowerCase()) {
            case "active" -> label.getStyleClass().add("badge-success");
            case "inactive" -> label.getStyleClass().add("badge-neutral");
            case "discontinued" -> label.getStyleClass().add("badge-warning");
            default -> label.getStyleClass().add("badge-neutral");
        }
    }

    private List<MenuItem> buildActionsMenu(Product product) {
        List<MenuItem> items = new ArrayList<>();

        MenuItem viewItem = new MenuItem("View Details");
        FontIcon viewIcon = new FontIcon("bx-show");
        viewIcon.setIconSize(14);
        viewIcon.getStyleClass().add("table-action-icon");
        viewItem.setGraphic(viewIcon);
        viewItem.setOnAction(e -> workspaceManager.openWindow("View Product: " + product.name(), "/fxml/products/product-form-view.fxml", Map.of("productId", product.id(), "mode", "view")));

        MenuItem editItem = new MenuItem("Edit Product");
        FontIcon editIcon = new FontIcon("bx-pencil");
        editIcon.setIconSize(14);
        editIcon.getStyleClass().add("table-action-icon");
        editItem.setGraphic(editIcon);
        editItem.setOnAction(e -> workspaceManager.openWindow("Edit Product: " + product.name(), "/fxml/products/product-form-view.fxml", Map.of("productId", product.id(), "mode", "edit")));

        MenuItem deleteItem = new MenuItem("Delete Product");
        deleteItem.getStyleClass().add("logout-menu-item");
        FontIcon deleteIcon = new FontIcon("bx-trash");
        deleteIcon.setIconSize(14);
        deleteIcon.getStyleClass().add("table-action-icon-danger");
        deleteItem.setGraphic(deleteIcon);
        deleteItem.setOnAction(e -> handleDelete(product));

        items.addAll(java.util.Arrays.asList(viewItem, editItem, new SeparatorMenuItem(), deleteItem));
        return items;
    }

    private void handleDelete(Product product) {
        Alert confirm = new Alert(Alert.AlertType.CONFIRMATION);
        DialogStyler.apply(confirm);
        confirm.setTitle("Delete Product");
        confirm.setHeaderText("Delete " + product.name() + "?");
        confirm.setContentText("This action cannot be undone.");

        confirm.showAndWait().ifPresent(response -> {
            if (response == ButtonType.OK) {
                try {
                    long userId = AuthContext.getCurrentUser().id();
                    productService.deleteProduct(product.id(), userId);
                    NotificationService.success("Product deleted successfully");
                    loadProducts();
                } catch (Exception e) {
                    NotificationService.error("Failed to delete product: " + e.getMessage());
                }
            }
        });
    }
}
