package com.possum.ui.inventory;

import com.possum.application.inventory.InventoryService;
import com.possum.domain.enums.InventoryReason;
import com.possum.shared.dto.StockHistoryDto;
import com.possum.ui.common.controls.FilterBar;
import com.possum.ui.common.controls.PaginationBar;
import javafx.application.Platform;
import javafx.beans.property.SimpleStringProperty;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.fxml.FXML;
import javafx.scene.control.*;
import javafx.scene.layout.VBox;

import java.time.format.DateTimeFormatter;
import com.possum.shared.util.TimeUtil;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;

public class StockHistoryController {

    @FXML private VBox container;
    private FilterBar filterBar;
    @FXML private TableView<StockHistoryDto> historyTable;
    @FXML private TableColumn<StockHistoryDto, String> productCol;
    @FXML private TableColumn<StockHistoryDto, String> variantCol;
    @FXML private TableColumn<StockHistoryDto, String> skuCol;
    @FXML private TableColumn<StockHistoryDto, String> changeCol;
    @FXML private TableColumn<StockHistoryDto, String> reasonCol;
    @FXML private TableColumn<StockHistoryDto, String> adjustedByCol;
    @FXML private TableColumn<StockHistoryDto, String> dateCol;
    @FXML private PaginationBar paginationBar;

    private final InventoryService inventoryService;
    private final ObservableList<StockHistoryDto> historyList = FXCollections.observableArrayList();
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private int currentPage = 1;
    private int pageSize = 20;

    private String currentSearch = "";
    private String currentReason = null;

    public StockHistoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @FXML
    public void initialize() {
        setupTable();
        setupFilters();
        setupPagination();
        loadHistory();
    }

    private void setupTable() {
        historyTable.setItems(historyList);

        productCol.setCellValueFactory(cellData -> new SimpleStringProperty(cellData.getValue().productName()));
        variantCol.setCellValueFactory(cellData -> new SimpleStringProperty(cellData.getValue().variantName()));
        skuCol.setCellValueFactory(cellData -> new SimpleStringProperty(cellData.getValue().sku()));
        changeCol.setCellValueFactory(cellData -> new SimpleStringProperty(
                cellData.getValue().quantityChange() > 0 ? "+" + cellData.getValue().quantityChange() : String.valueOf(cellData.getValue().quantityChange())));
        reasonCol.setCellValueFactory(cellData -> new SimpleStringProperty(cellData.getValue().reason()));
        adjustedByCol.setCellValueFactory(cellData -> new SimpleStringProperty(cellData.getValue().adjustedByName()));
        dateCol.setCellValueFactory(cellData -> new SimpleStringProperty(
                cellData.getValue().adjustedAt() != null ? TimeUtil.formatStandard(TimeUtil.toLocal(cellData.getValue().adjustedAt())) : ""));
    }

    private void setupFilters() {
        filterBar = new FilterBar();

        List<String> reasons = new ArrayList<>();
        reasons.add("All Reasons");
        for (InventoryReason reason : InventoryReason.values()) {
            reasons.add(reason.getValue());
        }

        ComboBox<String> reasonCombo = filterBar.addFilter("reason", "All Reasons");
        reasonCombo.setItems(FXCollections.observableArrayList(reasons));
        reasonCombo.getSelectionModel().selectFirst();

        filterBar.setOnFilterChange(filters -> {
            currentSearch = (String) filters.get("search");
            String r = (String) filters.get("reason");
            if (r == null || "All Reasons".equals(r)) {
                currentReason = null;
            } else {
                currentReason = r;
            }
            paginationBar.reset();
        });

        container.getChildren().add(1, filterBar);
    }

    private void setupPagination() {
        paginationBar.setOnPageChange((page, size) -> {
            currentPage = page;
            pageSize = size;
            loadHistory();
        });
    }

    private void loadHistory() {
        List<String> selectedReasons = new ArrayList<>();
        if (currentReason != null) {
            selectedReasons.add(currentReason);
        }

        int offset = (currentPage - 1) * pageSize;

        // Load one extra item to check if there are more pages
        CompletableFuture.supplyAsync(() -> inventoryService.getStockHistory(currentSearch, selectedReasons, pageSize + 1, offset))
                .thenAccept(results -> Platform.runLater(() -> {
                    boolean hasMorePages = results.size() > pageSize;
                    if (hasMorePages) {
                        historyList.setAll(results.subList(0, pageSize));
                    } else {
                        historyList.setAll(results);
                    }

                    int totalItems = offset + historyList.size() + (hasMorePages ? 1 : 0);
                    paginationBar.setTotalItems(totalItems);
                }))
                .exceptionally(ex -> {
                    ex.printStackTrace();
                    return null;
                });
    }
}
