package com.possum.ui.products;

import com.possum.application.auth.AuthContext;
import com.possum.application.products.ProductService;
import com.possum.application.categories.CategoryService;
import com.possum.domain.model.Category;
import com.possum.domain.model.Product;
import com.possum.shared.dto.PagedResult;
import com.possum.shared.dto.ProductFilter;
import com.possum.ui.common.controls.DataTableView;
import com.possum.ui.common.controls.FilterBar;
import com.possum.ui.common.controls.NotificationService;
import com.possum.ui.common.controls.PaginationBar;
import com.possum.ui.workspace.WorkspaceManager;
import javafx.application.Platform;
import javafx.collections.FXCollections;
import javafx.fxml.FXML;
import javafx.scene.control.Alert;
import javafx.scene.control.ButtonType;
import javafx.scene.control.TableColumn;
import javafx.scene.control.ContextMenu;
import javafx.scene.control.MenuItem;
import javafx.scene.control.SeparatorMenuItem;
import javafx.beans.property.SimpleStringProperty;
import javafx.beans.property.SimpleObjectProperty;
import com.possum.ui.common.dialogs.DialogStyler;

import java.util.Map;

public class ProductsController {
    
    @FXML private FilterBar filterBar;
    @FXML private DataTableView<Product> productsTable;
    @FXML private PaginationBar paginationBar;
    @FXML private javafx.scene.control.Button addButton;
    
    private final ProductService productService;
    private final CategoryService categoryService;
    private final WorkspaceManager workspaceManager;
    private String currentSearch = "";
    private java.util.List<Long> currentTaxCategoryFilters = java.util.Collections.emptyList();
    private java.util.List<String> currentStatusFilters = java.util.Collections.emptyList();
    private java.util.List<Long> currentCategoryFilters = java.util.Collections.emptyList();
    private final com.possum.persistence.repositories.interfaces.TaxRepository taxRepository;

    public ProductsController(ProductService productService, CategoryService categoryService, 
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
        productsTable.getTableView().setPlaceholder(new javafx.scene.control.Label("No products found. Adjust filters or click + Add Product to create one."));
        setupTable();
        setupFilters();
        loadProducts();
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
        statusCol.setCellValueFactory(cellData -> {
            String s = cellData.getValue().status();
            if (s != null && !s.isEmpty()) {
                return new SimpleStringProperty(s.substring(0, 1).toUpperCase() + s.substring(1).toLowerCase());
            }
            return new SimpleStringProperty("");
        });
        
        productsTable.getTableView().getColumns().addAll(nameCol, categoryCol, taxCol, statusCol);
        
        productsTable.addMenuActionColumn("Actions", this::buildActionsMenu);
    }

    private void setupFilters() {
        java.util.List<Category> categories = categoryService.getAllCategories();
        java.util.List<com.possum.domain.model.TaxCategory> taxCategories = taxRepository.getAllTaxCategories();
        
        filterBar.addMultiSelectFilter("status", "Status", java.util.List.of("active", "inactive", "discontinued"), item -> item.substring(0, 1).toUpperCase() + item.substring(1), false);
        filterBar.addMultiSelectFilter("taxCategory", "Tax Category", taxCategories, com.possum.domain.model.TaxCategory::name);

        com.possum.ui.common.controls.MultiSelectFilter<Category> categoryFilter =
            filterBar.addMultiSelectFilter("categories", "Categories", categories, Category::name);

        filterBar.setOnFilterChange(filters -> {
            currentSearch = (String) filters.get("search");

            @SuppressWarnings("unchecked")
            java.util.List<String> statusFilter = (java.util.List<String>) filters.get("status");
            currentStatusFilters = statusFilter != null ? statusFilter : java.util.Collections.emptyList();

            @SuppressWarnings("unchecked")
            java.util.List<com.possum.domain.model.TaxCategory> taxFilter = (java.util.List<com.possum.domain.model.TaxCategory>) filters.get("taxCategory");
            if (taxFilter != null) {
                currentTaxCategoryFilters = taxFilter.stream().map(com.possum.domain.model.TaxCategory::id).toList();
            } else {
                currentTaxCategoryFilters = java.util.Collections.emptyList();
            }

            @SuppressWarnings("unchecked")
            java.util.List<Category> cats = (java.util.List<Category>) filters.get("categories");
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
                
                productsTable.setItems(FXCollections.observableArrayList(result.items()));
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

    private java.util.List<MenuItem> buildActionsMenu(Product product) {
        java.util.List<MenuItem> items = new java.util.ArrayList<>();
        
        MenuItem viewItem = new MenuItem("👁 View Details");
        viewItem.setOnAction(e -> workspaceManager.openWindow("View Product: " + product.name(), "/fxml/products/product-form-view.fxml", Map.of("productId", product.id(), "mode", "view")));
        
        MenuItem editItem = new MenuItem("✏ Edit Product");
        editItem.setOnAction(e -> workspaceManager.openWindow("Edit Product: " + product.name(), "/fxml/products/product-form-view.fxml", Map.of("productId", product.id(), "mode", "edit")));
        
        MenuItem deleteItem = new MenuItem("❌ Delete Product");
        deleteItem.setStyle("-fx-text-fill: red;");
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
