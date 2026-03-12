package com.possum.ui.products;

import com.possum.application.auth.AuthContext;
import com.possum.application.products.ProductService;
import com.possum.domain.model.Product;
import com.possum.shared.dto.PagedResult;
import com.possum.shared.dto.ProductFilter;
import com.possum.ui.common.controls.DataTableView;
import com.possum.ui.common.controls.FilterBar;
import com.possum.ui.common.controls.NotificationService;
import com.possum.ui.common.controls.PaginationBar;
import com.possum.ui.navigation.NavigationManager;
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
    private final NavigationManager navigationManager;
    private String currentSearch = "";

    public ProductsController(ProductService productService, NavigationManager navigationManager) {
        this.productService = productService;
        this.navigationManager = navigationManager;
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
        navigationManager.navigateTo("product-form");
    }

    private void showActions(Product product) {
        Alert alert = new Alert(Alert.AlertType.CONFIRMATION);
        alert.setTitle("Product Actions");
        alert.setHeaderText(product.name());
        alert.setContentText("Choose action:");
        
        ButtonType deleteBtn = new ButtonType("Delete");
        ButtonType cancelBtn = ButtonType.CANCEL;
        
        alert.getButtonTypes().setAll(deleteBtn, cancelBtn);
        
        alert.showAndWait().ifPresent(type -> {
            if (type == deleteBtn) {
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
