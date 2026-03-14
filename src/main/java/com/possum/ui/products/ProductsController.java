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
import javafx.beans.property.SimpleStringProperty;
import javafx.beans.property.SimpleObjectProperty;

import java.util.Map;

public class ProductsController {
    
    @FXML private FilterBar filterBar;
    @FXML private DataTableView<Product> productsTable;
    @FXML private PaginationBar paginationBar;
    
    private final ProductService productService;
    private final CategoryService categoryService;
    private final WorkspaceManager workspaceManager;
    private String currentSearch = "";
    private java.util.List<String> currentStatusFilters = java.util.Collections.emptyList();
    private java.util.List<String> currentStockFilters = java.util.Collections.emptyList();
    private java.util.List<Long> currentCategoryFilters = java.util.Collections.emptyList();

    public ProductsController(ProductService productService, CategoryService categoryService, WorkspaceManager workspaceManager) {
        this.productService = productService;
        this.categoryService = categoryService;
        this.workspaceManager = workspaceManager;
    }

    @FXML
    public void initialize() {
        setupTable();
        setupFilters();
        loadProducts();
    }

    private void setupTable() {
        TableColumn<Product, String> nameCol = new TableColumn<>("Name");
        nameCol.setCellValueFactory(cellData -> new SimpleStringProperty(cellData.getValue().name()));
        
        TableColumn<Product, String> categoryCol = new TableColumn<>("Category");
        categoryCol.setCellValueFactory(cellData -> new SimpleStringProperty(cellData.getValue().categoryName()));
        
        TableColumn<Product, Integer> stockCol = new TableColumn<>("Stock");
        stockCol.setCellValueFactory(cellData -> new SimpleObjectProperty<>(cellData.getValue().stock()));
        
        TableColumn<Product, String> statusCol = new TableColumn<>("Status");
        statusCol.setCellValueFactory(cellData -> new SimpleStringProperty(cellData.getValue().status()));
        
        productsTable.getTableView().getColumns().addAll(nameCol, categoryCol, stockCol, statusCol);
        
        productsTable.addActionColumn("Actions", this::showActions);
    }

    private void setupFilters() {
        java.util.List<Category> categories = categoryService.getAllCategories();
        filterBar.addMultiSelectFilter("status", "Status", java.util.List.of("active", "inactive", "draft"), String::toString);
        filterBar.addMultiSelectFilter("stockStatus", "Stock Status", java.util.List.of("in-stock", "low-stock", "out-of-stock"), String::toString);

        com.possum.ui.common.controls.MultiSelectFilter<Category> categoryFilter =
            filterBar.addMultiSelectFilter("categories", "Categories", categories, Category::name);

        filterBar.setOnFilterChange(filters -> {
            currentSearch = (String) filters.get("search");

            @SuppressWarnings("unchecked")
            java.util.List<String> statusFilter = (java.util.List<String>) filters.get("status");
            currentStatusFilters = statusFilter != null ? statusFilter : java.util.Collections.emptyList();

            @SuppressWarnings("unchecked")
            java.util.List<String> stockFilter = (java.util.List<String>) filters.get("stockStatus");
            currentStockFilters = stockFilter != null ? stockFilter : java.util.Collections.emptyList();

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
                    currentStockFilters.isEmpty() ? null : currentStockFilters,
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
    private void handleAdd() {
        workspaceManager.openWindow("Add Product", "/fxml/products/product-form-view.fxml");
    }

    private void showActions(Product product) {
        Alert alert = new Alert(Alert.AlertType.CONFIRMATION);
        alert.setTitle("Product Actions");
        alert.setHeaderText(product.name());
        alert.setContentText("Choose action:");
        
        ButtonType viewBtn = new ButtonType("View");
        ButtonType editBtn = new ButtonType("Edit");
        ButtonType deleteBtn = new ButtonType("Delete");
        ButtonType cancelBtn = ButtonType.CANCEL;
        
        alert.getButtonTypes().setAll(viewBtn, editBtn, deleteBtn, cancelBtn);
        
        alert.showAndWait().ifPresent(type -> {
            if (type == viewBtn) {
                workspaceManager.openWindow("View Product", "/fxml/products/product-form-view.fxml", Map.of("productId", product.id(), "mode", "view"));
            } else if (type == editBtn) {
                workspaceManager.openWindow("Edit Product", "/fxml/products/product-form-view.fxml", Map.of("productId", product.id(), "mode", "edit"));
            } else if (type == deleteBtn) {
                handleDelete(product);
            }
        });
    }

    private void handleDelete(Product product) {
        Alert confirm = new Alert(Alert.AlertType.CONFIRMATION);
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
