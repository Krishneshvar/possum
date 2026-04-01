package com.possum.ui.products;

import com.possum.application.auth.AuthContext;
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
import com.possum.ui.workspace.WorkspaceManager;
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

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

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
        }

        productsTable.getTableView().setPlaceholder(new Label("No products found. Adjust filters or click + Add Product to create one."));
        productsTable.setEmptyMessage("No products found");
        productsTable.setEmptySubtitle("Try changing filters or create your first product.");

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
        statusCol.setCellValueFactory(cellData -> new SimpleStringProperty(formatStatus(cellData.getValue().status())));

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

            Label icon = new Label("\uD83D\uDCE6");
            icon.getStyleClass().add("empty-state-icon");

            Label title = new Label("No products found");
            title.getStyleClass().add("empty-state-title");

            Label subtitle = new Label("Adjust search or filters, or add a new product.");
            subtitle.getStyleClass().add("empty-state-subtitle");
            subtitle.setWrapText(true);

            empty.getChildren().addAll(icon, title, subtitle);
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

        VBox titleBox = new VBox(2);
        Label name = new Label(product.name());
        name.getStyleClass().add("product-card-title");
        name.setWrapText(true);

        Label category = new Label(product.categoryName() != null ? product.categoryName() : "Uncategorized");
        category.getStyleClass().add("product-card-meta");
        titleBox.getChildren().addAll(name, category);
        HBox.setHgrow(titleBox, Priority.ALWAYS);

        Label status = new Label(formatStatus(product.status()));
        status.getStyleClass().add("badge-status");
        applyStatusClass(status, product.status());

        topRow.getChildren().addAll(avatar, titleBox, status);

        Label tax = new Label("Tax: " + (product.taxCategoryName() != null ? product.taxCategoryName() : "-"));
        tax.getStyleClass().add("product-card-meta");

        Region spacer = new Region();
        VBox.setVgrow(spacer, Priority.ALWAYS);

        HBox actions = new HBox(8);
        actions.getStyleClass().add("product-card-actions");

        Button viewBtn = iconButton("View", "bx-show", () ->
            workspaceManager.openWindow("View Product: " + product.name(), "/fxml/products/product-form-view.fxml", Map.of("productId", product.id(), "mode", "view"))
        );
        Button editBtn = iconButton("Edit", "bx-edit", () ->
            workspaceManager.openWindow("Edit Product: " + product.name(), "/fxml/products/product-form-view.fxml", Map.of("productId", product.id(), "mode", "edit"))
        );
        Button deleteBtn = iconButton("Delete", "bx-trash", () -> handleDelete(product));
        deleteBtn.getStyleClass().add("action-btn-destructive");

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
        button.getStyleClass().add("action-btn");
        FontIcon icon = new FontIcon(iconCode);
        icon.getStyleClass().add("nav-icon");
        icon.setIconSize(14);
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
            default -> label.getStyleClass().add("badge-warning");
        }
    }

    private List<MenuItem> buildActionsMenu(Product product) {
        List<MenuItem> items = new ArrayList<>();

        MenuItem viewItem = new MenuItem("View Details");
        viewItem.setOnAction(e -> workspaceManager.openWindow("View Product: " + product.name(), "/fxml/products/product-form-view.fxml", Map.of("productId", product.id(), "mode", "view")));

        MenuItem editItem = new MenuItem("Edit Product");
        editItem.setOnAction(e -> workspaceManager.openWindow("Edit Product: " + product.name(), "/fxml/products/product-form-view.fxml", Map.of("productId", product.id(), "mode", "edit")));

        MenuItem deleteItem = new MenuItem("Delete Product");
        deleteItem.getStyleClass().add("logout-menu-item");
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
