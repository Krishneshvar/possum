package com.possum.ui.inventory;

import com.possum.application.categories.CategoryService;
import com.possum.domain.model.Category;
import com.possum.domain.model.Variant;
import com.possum.persistence.repositories.interfaces.VariantRepository;
import com.possum.shared.dto.PagedResult;
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
import javafx.beans.property.SimpleStringProperty;
import javafx.beans.property.SimpleObjectProperty;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

public class VariantsController {

    @FXML private FilterBar filterBar;
    @FXML private DataTableView<Variant> variantsTable;
    @FXML private PaginationBar paginationBar;

    private final VariantRepository variantRepository;
    private final CategoryService categoryService;
    private final WorkspaceManager workspaceManager;
    private String currentSearch = "";
    private List<String> currentStatusFilters = Collections.emptyList();
    private List<String> currentStockFilters = Collections.emptyList();
    private List<Long> currentCategoryFilters = Collections.emptyList();
    private String currentSortColumn = "product_name";
    private String currentSortDirection = "ASC";

    public VariantsController(VariantRepository variantRepository, CategoryService categoryService, WorkspaceManager workspaceManager) {
        this.variantRepository = variantRepository;
        this.categoryService = categoryService;
        this.workspaceManager = workspaceManager;
    }

    @FXML
    public void initialize() {
        setupTable();
        setupFilters();
        loadVariants();
    }

    @FXML
    private void handleRefresh() {
        loadVariants();
    }

    private void setupFilters() {
        List<Category> categories = categoryService.getAllCategories();
        filterBar.addMultiSelectFilter("status", "Status", List.of("active", "inactive", "draft"),
            item -> item.substring(0, 1).toUpperCase() + item.substring(1), false);
        filterBar.addMultiSelectFilter("stockStatus", "Stock Status", List.of("in-stock", "low-stock", "out-of-stock"),
            item -> java.util.Arrays.stream(item.split("-")).map(word -> word.substring(0, 1).toUpperCase() + word.substring(1)).collect(java.util.stream.Collectors.joining(" ")), false);

        filterBar.addMultiSelectFilter("categories", "Categories", categories, Category::name);

        filterBar.setOnFilterChange(filters -> {
            currentSearch = (String) filters.get("search");

            @SuppressWarnings("unchecked")
            List<String> statusFilter = (List<String>) filters.get("status");
            currentStatusFilters = statusFilter != null ? statusFilter : Collections.emptyList();

            @SuppressWarnings("unchecked")
            List<String> stockFilter = (List<String>) filters.get("stockStatus");
            currentStockFilters = stockFilter != null ? stockFilter : Collections.emptyList();

            @SuppressWarnings("unchecked")
            List<Category> cats = (List<Category>) filters.get("categories");
            if (cats != null) {
                currentCategoryFilters = cats.stream().map(Category::id).toList();
            } else {
                currentCategoryFilters = Collections.emptyList();
            }

            loadVariants();
        });

        paginationBar.setOnPageChange((page, size) -> loadVariants());
    }

    private void loadVariants() {
        variantsTable.setLoading(true);

        CompletableFuture.supplyAsync(() -> {
            return variantRepository.findVariants(
                currentSearch == null || currentSearch.isEmpty() ? null : currentSearch,
                null,
                currentCategoryFilters.isEmpty() ? null : currentCategoryFilters,
                currentStockFilters.isEmpty() ? null : currentStockFilters,
                currentStatusFilters.isEmpty() ? null : currentStatusFilters,
                currentSortColumn,
                currentSortDirection,
                paginationBar.getCurrentPage(),
                paginationBar.getPageSize()
            );
        }).thenAccept(result -> {
            Platform.runLater(() -> {
                variantsTable.setItems(FXCollections.observableArrayList(result.items()));
                paginationBar.setTotalItems(result.totalCount());
                variantsTable.setLoading(false);
            });
        }).exceptionally(ex -> {
            Platform.runLater(() -> {
                variantsTable.setLoading(false);
                NotificationService.error("Failed to load variants");
            });
            return null;
        });
    }

    private void setupTable() {
        TableColumn<Variant, String> productCol = new TableColumn<>("Product");
        productCol.setId("product_name");
        productCol.setSortable(true);
        productCol.setCellValueFactory(cellData -> new SimpleStringProperty(cellData.getValue().productName()));

        TableColumn<Variant, String> variantCol = new TableColumn<>("Variant");
        variantCol.setId("name");
        variantCol.setSortable(true);
        variantCol.setCellValueFactory(cellData -> new SimpleStringProperty(cellData.getValue().name()));

        TableColumn<Variant, Integer> stockCol = new TableColumn<>("Stock");
        stockCol.setId("stock");
        stockCol.setSortable(true);
        stockCol.setCellValueFactory(cellData -> new SimpleObjectProperty<>(cellData.getValue().stock()));
        stockCol.setCellFactory(col -> new javafx.scene.control.TableCell<>() {
            @Override
            protected void updateItem(Integer stock, boolean empty) {
                super.updateItem(stock, empty);
                if (empty || stock == null) {
                    setText(null);
                    setStyle("");
                } else {
                    setText(stock.toString());
                    Variant variant = getTableRow() != null ? getTableRow().getItem() : null;
                    if (variant != null) {
                        int alertCap = variant.stockAlertCap() != null ? variant.stockAlertCap() : 0;
                        if (stock <= 0) {
                            setStyle("-fx-text-fill: #ef4444; -fx-font-weight: bold;"); // Red
                        } else if (stock <= alertCap) {
                            setStyle("-fx-text-fill: #f59e0b; -fx-font-weight: bold;"); // Yellow/Orange
                        } else {
                            setStyle("-fx-text-fill: #10b981; -fx-font-weight: bold;"); // Green
                        }
                    } else {
                        setStyle("");
                    }
                }
            }
        });

        TableColumn<Variant, java.math.BigDecimal> mrpCol = new TableColumn<>("MRP");
        mrpCol.setId("price");
        mrpCol.setSortable(true);
        mrpCol.setCellValueFactory(cellData -> new SimpleObjectProperty<>(cellData.getValue().price()));

        TableColumn<Variant, java.math.BigDecimal> costCol = new TableColumn<>("Cost");
        costCol.setId("cost_price");
        costCol.setSortable(true);
        costCol.setCellValueFactory(cellData -> new SimpleObjectProperty<>(cellData.getValue().costPrice()));

        TableColumn<Variant, String> statusCol = new TableColumn<>("Status");
        statusCol.setId("status");
        statusCol.setSortable(false);
        statusCol.setCellValueFactory(cellData -> {
            String s = cellData.getValue().status();
            if (s != null && !s.isEmpty()) {
                return new SimpleStringProperty(s.substring(0, 1).toUpperCase() + s.substring(1).toLowerCase());
            }
            return new SimpleStringProperty("");
        });

        variantsTable.getTableView().getColumns().addAll(productCol, variantCol, mrpCol, costCol, stockCol, statusCol);

        variantsTable.getTableView().setSortPolicy(tv -> {
            // Ignore transient empty sort states; they can happen during table refresh
            // and should not reset the user's chosen server-side sort.
            if (tv.getSortOrder().isEmpty()) {
                return true;
            }

            TableColumn<Variant, ?> col = tv.getSortOrder().get(0);
            currentSortColumn = col.getId() != null ? col.getId() : "product_name";
            currentSortDirection = col.getSortType() == TableColumn.SortType.ASCENDING ? "ASC" : "DESC";

            if (paginationBar.getCurrentPage() == 0) {
                loadVariants();
            } else {
                paginationBar.reset();
            }
            return true;
        });

        variantsTable.addMenuActionColumn("Actions", this::buildActionsMenu);
    }

    private java.util.List<MenuItem> buildActionsMenu(Variant variant) {
        java.util.List<MenuItem> items = new java.util.ArrayList<>();

        MenuItem viewProductItem = new MenuItem("👁 View Product");
        viewProductItem.setOnAction(e -> workspaceManager.openWindow("View Product", "/fxml/products/product-form-view.fxml", Map.of("productId", variant.productId(), "mode", "view")));

        MenuItem editProductItem = new MenuItem("✏ Edit Product");
        editProductItem.setOnAction(e -> workspaceManager.openWindow("Edit Product", "/fxml/products/product-form-view.fxml", Map.of("productId", variant.productId(), "mode", "edit")));

        items.addAll(java.util.Arrays.asList(viewProductItem, editProductItem));

        return items;
    }
}
