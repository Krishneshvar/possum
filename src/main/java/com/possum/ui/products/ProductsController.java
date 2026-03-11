package com.possum.ui.products;

import com.possum.application.auth.AuthContext;
import com.possum.application.products.ProductService;
import com.possum.domain.model.Product;
import com.possum.shared.dto.PagedResult;
import com.possum.shared.dto.ProductFilter;
import com.possum.ui.common.controls.DataTableView;
import com.possum.ui.common.controls.FilterBar;
import com.possum.ui.common.controls.FormDialog;
import com.possum.ui.common.controls.NotificationService;
import com.possum.ui.common.controls.PaginationBar;
import javafx.application.Platform;
import javafx.collections.FXCollections;
import javafx.fxml.FXML;
import javafx.scene.control.Alert;
import javafx.scene.control.ButtonType;
import javafx.scene.control.TableColumn;
import javafx.scene.control.cell.PropertyValueFactory;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public class ProductsController {
    
    @FXML private FilterBar filterBar;
    @FXML private DataTableView<Product> productsTable;
    @FXML private PaginationBar paginationBar;
    
    private ProductService productService;
    private String currentSearch = "";

    public ProductsController(ProductService productService) {
this.productService = productService;
    }

    @FXML
    public void initialize() {
        
        setupTable();
        setupFilters();
        loadProducts();
    }

    private void setupTable() {
        TableColumn<Product, String> nameCol = new TableColumn<>("Name");
        nameCol.setCellValueFactory(new PropertyValueFactory<>("name"));
        
        TableColumn<Product, String> categoryCol = new TableColumn<>("Category");
        categoryCol.setCellValueFactory(new PropertyValueFactory<>("categoryName"));
        
        TableColumn<Product, Integer> stockCol = new TableColumn<>("Stock");
        stockCol.setCellValueFactory(new PropertyValueFactory<>("stock"));
        
        TableColumn<Product, String> statusCol = new TableColumn<>("Status");
        statusCol.setCellValueFactory(new PropertyValueFactory<>("status"));
        
        productsTable.getTableView().getColumns().addAll(nameCol, categoryCol, stockCol, statusCol);
        
        productsTable.addActionColumn("Actions", this::showActions);
    }

    private void setupFilters() {
        filterBar.setOnFilterChange(filters -> {
            currentSearch = (String) filters.get("search");
            loadProducts();
        });
        
        paginationBar.setOnPageChange((page, size) -> loadProducts());
    }

    private void loadProducts() {
        productsTable.setLoading(true);
        
        Platform.runLater(() -> {
            try {
                ProductFilter filter = new ProductFilter(
                    currentSearch.isEmpty() ? null : currentSearch,
                    null,
                    null,
                    null,
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
        FormDialog.show("Add Product", dialog -> {
            dialog.addTextField("name", "Name", "");
            dialog.addTextArea("description", "Description", "");
            dialog.addTextField("sku", "SKU", "");
            dialog.addTextField("price", "Price", "0.00");
            dialog.addTextField("costPrice", "Cost Price", "0.00");
            dialog.addTextField("stockAlert", "Stock Alert", "10");
        }, values -> {
            try {
                long userId = AuthContext.getCurrentUser().id();
                
                ProductService.VariantCommand variant = new ProductService.VariantCommand(
                    null,
                    "Default",
                    (String) values.get("sku"),
                    new BigDecimal((String) values.get("price")),
                    new BigDecimal((String) values.get("costPrice")),
                    Integer.parseInt((String) values.get("stockAlert")),
                    true,
                    "active"
                );
                
                ProductService.CreateProductCommand cmd = new ProductService.CreateProductCommand(
                    (String) values.get("name"),
                    (String) values.get("description"),
                    null,
                    "active",
                    null,
                    List.of(variant),
                    null,
                    userId
                );
                
                productService.createProductWithVariants(cmd);
                NotificationService.success("Product created successfully");
                loadProducts();
            } catch (Exception e) {
                NotificationService.error("Failed to create product: " + e.getMessage());
            }
        });
    }

    private void showActions(Product product) {
        Alert alert = new Alert(Alert.AlertType.CONFIRMATION);
        alert.setTitle("Product Actions");
        alert.setHeaderText(product.name());
        alert.setContentText("Choose action:");
        
        ButtonType editBtn = new ButtonType("Edit");
        ButtonType deleteBtn = new ButtonType("Delete");
        ButtonType cancelBtn = ButtonType.CANCEL;
        
        alert.getButtonTypes().setAll(editBtn, deleteBtn, cancelBtn);
        
        alert.showAndWait().ifPresent(type -> {
            if (type == editBtn) {
                handleEdit(product);
            } else if (type == deleteBtn) {
                handleDelete(product);
            }
        });
    }

    private void handleEdit(Product product) {
        FormDialog.show("Edit Product", dialog -> {
            dialog.addTextField("name", "Name", product.name());
            dialog.addTextArea("description", "Description", product.description());
        }, values -> {
            try {
                long userId = AuthContext.getCurrentUser().id();
                
                ProductService.UpdateProductCommand cmd = new ProductService.UpdateProductCommand(
                    (String) values.get("name"),
                    (String) values.get("description"),
                    product.categoryId(),
                    product.status(),
                    null,
                    null,
                    null,
                    userId
                );
                
                productService.updateProduct(product.id(), cmd);
                NotificationService.success("Product updated successfully");
                loadProducts();
            } catch (Exception e) {
                NotificationService.error("Failed to update product: " + e.getMessage());
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
