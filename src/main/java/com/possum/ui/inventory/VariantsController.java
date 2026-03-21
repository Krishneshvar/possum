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
    private String currentSortColumn = "name";
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

    private void setupFilters() {
        List<Category> categories = categoryService.getAllCategories();
        filterBar.addMultiSelectFilter("status", "Status", List.of("active", "inactive", "draft"), String::toString);
        filterBar.addMultiSelectFilter("stockStatus", "Stock Status", List.of("in-stock", "low-stock", "out-of-stock"), String::toString);

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
        TableColumn<Variant, String> nameCol = new TableColumn<>("Name");
        nameCol.setId("name");
        nameCol.setCellValueFactory(cellData -> {
            Variant v = cellData.getValue();
            return new SimpleStringProperty(v.productName() + " | " + v.name());
        });

        TableColumn<Variant, Integer> stockCol = new TableColumn<>("Stock");
        stockCol.setId("stock");
        stockCol.setCellValueFactory(cellData -> new SimpleObjectProperty<>(cellData.getValue().stock()));

        TableColumn<Variant, String> statusCol = new TableColumn<>("Status");
        statusCol.setId("status");
        statusCol.setCellValueFactory(cellData -> new SimpleStringProperty(cellData.getValue().status()));

        variantsTable.getTableView().getColumns().addAll(nameCol, stockCol, statusCol);

        variantsTable.getTableView().setOnSort(event -> {
            if (!variantsTable.getTableView().getSortOrder().isEmpty()) {
                TableColumn<Variant, ?> col = variantsTable.getTableView().getSortOrder().get(0);
                currentSortColumn = col.getId() != null ? col.getId() : "name";
                currentSortDirection = col.getSortType() == TableColumn.SortType.ASCENDING ? "ASC" : "DESC";
            } else {
                currentSortColumn = "name";
                currentSortDirection = "ASC";
            }
            loadVariants();
        });

        variantsTable.addActionColumn("Actions", this::showActions);
    }

    private void showActions(Variant variant) {
        Alert alert = new Alert(Alert.AlertType.CONFIRMATION);
        alert.setTitle("Variant Actions");
        alert.setHeaderText(variant.productName() + " | " + variant.name());
        alert.setContentText("Choose action:");

        ButtonType viewProductBtn = new ButtonType("View Product");
        ButtonType editProductBtn = new ButtonType("Edit Product");
        ButtonType cancelBtn = ButtonType.CANCEL;

        alert.getButtonTypes().setAll(viewProductBtn, editProductBtn, cancelBtn);

        alert.showAndWait().ifPresent(type -> {
            if (type == viewProductBtn) {
                workspaceManager.openWindow("View Product", "/fxml/products/product-form-view.fxml", Map.of("productId", variant.productId(), "mode", "view"));
            } else if (type == editProductBtn) {
                workspaceManager.openWindow("Edit Product", "/fxml/products/product-form-view.fxml", Map.of("productId", variant.productId(), "mode", "edit"));
            }
        });
    }
}
