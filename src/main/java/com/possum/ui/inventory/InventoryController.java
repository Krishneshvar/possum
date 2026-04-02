package com.possum.ui.inventory;

import com.possum.application.auth.AuthContext;
import com.possum.application.inventory.InventoryService;
import com.possum.domain.enums.InventoryReason;
import com.possum.domain.model.Variant;
import com.possum.persistence.repositories.interfaces.VariantRepository;
import com.possum.shared.dto.PagedResult;
import com.possum.ui.common.controls.DataTableView;
import com.possum.ui.common.controls.FilterBar;
import com.possum.ui.common.controls.FormDialog;
import com.possum.ui.common.controls.NotificationService;
import com.possum.ui.common.controls.PaginationBar;
import com.possum.domain.model.TaxCategory;
import com.possum.persistence.repositories.interfaces.TaxRepository;
import javafx.application.Platform;
import javafx.collections.FXCollections;
import javafx.fxml.FXML;
import javafx.scene.control.*;
import javafx.beans.property.*;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.util.Locale;

public class InventoryController {
    
    @FXML private FilterBar filterBar;
    @FXML private DataTableView<Variant> inventoryTable;
    @FXML private PaginationBar paginationBar;
    @FXML private javafx.scene.control.Button refreshButton;
    
    private InventoryService inventoryService;
    private VariantRepository variantRepository;
    private com.possum.application.categories.CategoryService categoryService;
    private TaxRepository taxRepository;
    private String currentSearch = "";
    private java.util.List<Long> currentCategoryFilters = java.util.Collections.emptyList();
    private java.util.List<Long> currentTaxCategoryFilters = java.util.Collections.emptyList();
    private java.util.List<String> currentStockFilters = java.util.Collections.emptyList();
    private java.util.List<String> currentStatusFilters = java.util.Collections.emptyList();
    private java.math.BigDecimal currentMinPrice = null;
    private java.math.BigDecimal currentMaxPrice = null;
    private final NumberFormat currencyFormat = NumberFormat.getCurrencyInstance(Locale.US);

    public InventoryController(InventoryService inventoryService, VariantRepository variantRepository, com.possum.application.categories.CategoryService categoryService, TaxRepository taxRepository) {
        this.inventoryService = inventoryService;
        this.variantRepository = variantRepository;
        this.categoryService = categoryService;
        this.taxRepository = taxRepository;
    }

    @FXML
    public void initialize() {
        if (refreshButton != null) {
            org.kordamp.ikonli.javafx.FontIcon refreshIcon = new org.kordamp.ikonli.javafx.FontIcon("bx-sync");
            refreshIcon.setIconSize(16);
            refreshButton.setGraphic(refreshIcon);
            refreshButton.setText("Refresh");
        }
        inventoryTable.getTableView().setPlaceholder(new javafx.scene.control.Label("No inventory records found. Adjust filters to see results."));
        inventoryTable.setEmptyMessage("No inventory records found");
        inventoryTable.setEmptySubtitle("Try broader filters or add stock to see live inventory.");
        setupTable();
        setupFilters();
        loadInventory();
    }

    @FXML
    private void handleRefresh() {
        loadInventory();
    }

    private void setupTable() {
        TableColumn<Variant, String> productCol = new TableColumn<>("Product");
        productCol.setCellValueFactory(cellData -> new SimpleStringProperty(cellData.getValue().productName()));
        
        TableColumn<Variant, String> variantCol = new TableColumn<>("Variant");
        variantCol.setCellValueFactory(cellData -> new SimpleStringProperty(cellData.getValue().name()));
        
        TableColumn<Variant, String> categoryCol = new TableColumn<>("Category");
        categoryCol.setCellValueFactory(cellData -> new SimpleStringProperty(
                cellData.getValue().categoryName() != null ? cellData.getValue().categoryName() : "Uncategorized"
        ));

        TableColumn<Variant, String> skuCol = new TableColumn<>("SKU");
        skuCol.setCellValueFactory(cellData -> new SimpleStringProperty(cellData.getValue().sku()));
        
        TableColumn<Variant, Integer> stockCol = new TableColumn<>("Current Stock");
        stockCol.setCellValueFactory(cellData -> new SimpleObjectProperty<>(cellData.getValue().stock()));
        stockCol.setCellFactory(col -> new javafx.scene.control.TableCell<>() {
            private final javafx.scene.layout.HBox box = new javafx.scene.layout.HBox(5);
            private final javafx.scene.control.Label textLabel = new javafx.scene.control.Label();
            private final org.kordamp.ikonli.javafx.FontIcon editIcon = new org.kordamp.ikonli.javafx.FontIcon("bx-pencil");
            private final javafx.scene.control.Button editBtn = new javafx.scene.control.Button();
            {
                editIcon.setIconSize(16);
                editBtn.setGraphic(editIcon);
                editBtn.getStyleClass().add("btn-edit-stock");
                editBtn.setOnAction(e -> {
                    Variant variant = getTableView().getItems().get(getIndex());
                    if (variant != null) {
                        handleAdjust(variant);
                    }
                });
                box.getChildren().addAll(textLabel, editBtn);
                box.setAlignment(javafx.geometry.Pos.CENTER_LEFT);
                box.setSpacing(10);
            }

            @Override
            protected void updateItem(Integer item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || item == null) {
                    setGraphic(null);
                } else {
                    textLabel.setText(String.valueOf(item));

                    Variant variant = getTableRow() != null ? getTableRow().getItem() : null;
                    if (variant != null) {
                        int alertCap = variant.stockAlertCap() != null ? variant.stockAlertCap() : 0;
                        if (item <= 0) {
                            textLabel.setStyle("-fx-text-fill: #ef4444; -fx-font-weight: bold;"); // Red
                        } else if (item <= alertCap) {
                            textLabel.setStyle("-fx-text-fill: #f59e0b; -fx-font-weight: bold;"); // Yellow/Orange
                        } else {
                            textLabel.setStyle("-fx-text-fill: #10b981; -fx-font-weight: bold;"); // Green
                        }
                    } else {
                        textLabel.setStyle("");
                    }

                    setGraphic(box);
                }
            }
        });
        
        TableColumn<Variant, String> taxCategoryCol = new TableColumn<>("Tax Category");
        taxCategoryCol.setCellValueFactory(cellData -> new SimpleStringProperty(
                cellData.getValue().taxCategoryName() != null ? cellData.getValue().taxCategoryName() : "-"
        ));
        
        TableColumn<Variant, BigDecimal> priceCol = new TableColumn<>("Price");
        priceCol.setCellValueFactory(cellData -> new SimpleObjectProperty<>(cellData.getValue().price()));
        priceCol.setCellFactory(col -> new javafx.scene.control.TableCell<>() {
            @Override
            protected void updateItem(BigDecimal item, boolean empty) {
                super.updateItem(item, empty);
                setText(empty || item == null ? null : currencyFormat.format(item));
            }
        });
        
        TableColumn<Variant, String> statusCol = new TableColumn<>("Status");
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
                    String formatted = status.substring(0, 1).toUpperCase() + status.substring(1).toLowerCase();
                    Label badge = new Label(formatted);
                    badge.getStyleClass().add("badge-status");
                    
                    if ("active".equalsIgnoreCase(status)) {
                        badge.getStyleClass().add("badge-success");
                    } else if ("inactive".equalsIgnoreCase(status)) {
                        badge.getStyleClass().add("badge-neutral");
                    } else {
                        badge.getStyleClass().add("badge-warning");
                    }
                    
                    setGraphic(badge);
                    setText(null);
                }
            }
        });

        productCol.setId("product_name");
        variantCol.setId("name");
        categoryCol.setId("category_name");
        taxCategoryCol.setId("tax_category_name");
        skuCol.setId("sku");
        stockCol.setId("stock");
        priceCol.setId("price");

        inventoryTable.getTableView().getColumns().addAll(productCol, variantCol, skuCol, categoryCol, taxCategoryCol, priceCol, stockCol, statusCol);
    }

    private void setupFilters() {
        java.util.List<com.possum.domain.model.Category> categories = categoryService.getAllCategories();
        java.util.List<TaxCategory> taxCategories = taxRepository.getAllTaxCategories();
        filterBar.addMultiSelectFilter("status", "Status", java.util.List.of("active", "inactive", "discontinued"),
            item -> item.substring(0, 1).toUpperCase() + item.substring(1).toLowerCase(), false);
        filterBar.addMultiSelectFilter("stockStatus", "Stock Status", java.util.List.of("in-stock", "low-stock", "out-of-stock"), 
            item -> java.util.Arrays.stream(item.split("-"))
                        .map(word -> word.substring(0, 1).toUpperCase() + word.substring(1).toLowerCase())
                        .collect(java.util.stream.Collectors.joining(" ")));
        filterBar.addMultiSelectFilter("categories", "Categories", categories, com.possum.domain.model.Category::name);
        filterBar.addMultiSelectFilter("taxCategories", "Tax Categories", taxCategories, TaxCategory::name);
        filterBar.addTextFilter("minPrice", "Min Price");
        filterBar.addTextFilter("maxPrice", "Max Price");

        filterBar.setOnFilterChange(filters -> {
            currentSearch = (String) filters.get("search");

            @SuppressWarnings("unchecked")
            java.util.List<String> statusFilter = (java.util.List<String>) filters.get("status");
            currentStatusFilters = statusFilter != null ? statusFilter : java.util.Collections.emptyList();

            @SuppressWarnings("unchecked")
            java.util.List<String> stockFilter = (java.util.List<String>) filters.get("stockStatus");
            currentStockFilters = stockFilter != null ? stockFilter : java.util.Collections.emptyList();

            @SuppressWarnings("unchecked")
            java.util.List<com.possum.domain.model.Category> cats = (java.util.List<com.possum.domain.model.Category>) filters.get("categories");
            if (cats != null) {
                currentCategoryFilters = cats.stream().map(com.possum.domain.model.Category::id).toList();
            } else {
                currentCategoryFilters = java.util.Collections.emptyList();
            }

            @SuppressWarnings("unchecked")
            java.util.List<TaxCategory> tcs = (java.util.List<TaxCategory>) filters.get("taxCategories");
            if (tcs != null) {
                currentTaxCategoryFilters = tcs.stream().map(TaxCategory::id).toList();
            } else {
                currentTaxCategoryFilters = java.util.Collections.emptyList();
            }

            currentMinPrice = parseBigDecimal(filters.get("minPrice"));
            currentMaxPrice = parseBigDecimal(filters.get("maxPrice"));

            loadInventory();
        });
        
        paginationBar.setOnPageChange((page, size) -> loadInventory());
    }

    private void loadInventory() {
        inventoryTable.setLoading(true);
        
        Platform.runLater(() -> {
            try {
                PagedResult<Variant> result = variantRepository.findVariants(
                    currentSearch == null || currentSearch.isEmpty() ? null : currentSearch,
                    null,
                    currentCategoryFilters.isEmpty() ? null : currentCategoryFilters,
                    currentTaxCategoryFilters.isEmpty() ? null : currentTaxCategoryFilters,
                    currentStockFilters.isEmpty() ? null : currentStockFilters,
                    currentStatusFilters.isEmpty() ? null : currentStatusFilters,
                    currentMinPrice,
                    currentMaxPrice,
                    "stock",
                    "ASC",
                    paginationBar.getCurrentPage(),
                    paginationBar.getPageSize()
                );
                
                inventoryTable.setItems(FXCollections.observableArrayList(result.items()));
                paginationBar.setTotalItems(result.totalCount());
                inventoryTable.setLoading(false);
            } catch (Exception e) {
                inventoryTable.setLoading(false);
                NotificationService.error("Failed to load inventory");
            }
        });
    }

    private void handleAdjust(Variant variant) {
        FormDialog.show("Adjust Stock - " + variant.productName() + " (" + variant.name() + ")", dialog -> {
            var typeCombo = dialog.addComboBox("type", "Adjustment Type", "Add/Subtract");
            typeCombo.getItems().addAll("Add/Subtract", "Set Exact");
            dialog.addTextField("quantity", "Quantity / New Stock", "0");
            var reasonCombo = dialog.addComboBox("reason", "Reason", InventoryReason.CORRECTION);
            reasonCombo.getItems().addAll(
                InventoryReason.CORRECTION,
                InventoryReason.DAMAGE,
                InventoryReason.SPOILAGE,
                InventoryReason.THEFT
            );
        }, values -> {
            try {
                int inputValue = Integer.parseInt((String) values.get("quantity"));
                String type = (String) values.get("type");
                int currentStock = variant.stock() != null ? variant.stock() : 0;
                int quantity = "Set Exact".equals(type) ? (inputValue - currentStock) : inputValue;

                InventoryReason reason = (InventoryReason) values.get("reason");
                long userId = AuthContext.getCurrentUser().id();
                
                inventoryService.adjustInventory(
                    variant.id(),
                    null,
                    quantity,
                    reason,
                    "manual_adjustment",
                    null,
                    userId
                );
                
                NotificationService.success("Stock adjusted successfully");
                loadInventory();
            } catch (NumberFormatException e) {
                NotificationService.error("Invalid quantity");
            } catch (Exception e) {
                NotificationService.error("Failed to adjust stock: " + e.getMessage());
            }
        });
    }

    private java.math.BigDecimal parseBigDecimal(Object value) {
        if (value == null) return null;
        if (value instanceof java.math.BigDecimal) return (java.math.BigDecimal) value;
        try {
            String s = value.toString().replaceAll("[^0-9.\\-]", "");
            return s.isEmpty() ? null : new java.math.BigDecimal(s);
        } catch (Exception e) {
            return null;
        }
    }
}
