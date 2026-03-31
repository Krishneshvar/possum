package com.possum.ui.inventory;

import com.possum.application.inventory.InventoryService;
import com.possum.application.people.UserService;
import com.possum.domain.enums.InventoryReason;
import com.possum.domain.model.User;
import com.possum.shared.dto.UserFilter;
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
    private final UserService userService;
    private final ObservableList<StockHistoryDto> historyList = FXCollections.observableArrayList();

    private int currentPage = 1;
    private int pageSize = 20;

    private String currentSearch = "";
    private String currentReason = null;
    private java.time.LocalDate currentFromDate = null;
    private java.time.LocalDate currentToDate = null;
    private List<Long> currentUserIds = null;

    public StockHistoryController(InventoryService inventoryService, UserService userService) {
        this.inventoryService = inventoryService;
        this.userService = userService;
    }

    @FXML
    public void initialize() {
        setupTable();
        setupFilters();
        setupPagination();
        loadHistory();
    }

    @FXML
    private void handleRefresh() {
        loadHistory();
    }

    private void setupTable() {
        historyTable.setItems(historyList);

        productCol.setCellValueFactory(cellData -> new SimpleStringProperty(cellData.getValue().productName()));
        variantCol.setCellValueFactory(cellData -> new SimpleStringProperty(cellData.getValue().variantName()));
        skuCol.setCellValueFactory(cellData -> new SimpleStringProperty(cellData.getValue().sku()));
        changeCol.setCellValueFactory(cellData -> new SimpleStringProperty(
                cellData.getValue().quantityChange() > 0 ? "+" + cellData.getValue().quantityChange() : String.valueOf(cellData.getValue().quantityChange())));
        changeCol.setCellFactory(col -> new TableCell<>() {
            @Override
            protected void updateItem(String item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || item == null) {
                    setText(null);
                    setStyle("");
                } else {
                    setText(item);
                    setStyle(item.startsWith("+") ? "-fx-text-fill: green; -fx-font-weight: bold; -fx-alignment: center-right;" : "-fx-text-fill: red; -fx-font-weight: bold; -fx-alignment: center-right;");
                }
            }
        });
        reasonCol.setCellValueFactory(cellData -> {
            String reason = cellData.getValue().reason();
            if (reason == null) return new SimpleStringProperty("");

            if ("confirm_receive".equalsIgnoreCase(reason)) {
                return new SimpleStringProperty("Received");
            }

            String[] words = reason.split("_");
            StringBuilder titleCase = new StringBuilder();
            for (String word : words) {
                if (word.length() > 0) {
                    titleCase.append(Character.toUpperCase(word.charAt(0)))
                             .append(word.substring(1).toLowerCase())
                             .append(" ");
                }
            }
            return new SimpleStringProperty(titleCase.toString().trim());
        });
        reasonCol.setSortable(false);
        adjustedByCol.setCellValueFactory(cellData -> new SimpleStringProperty(cellData.getValue().adjustedByName()));
        adjustedByCol.setSortable(false);
        dateCol.setCellValueFactory(cellData -> new SimpleStringProperty(
                cellData.getValue().adjustedAt() != null ? TimeUtil.formatStandard(TimeUtil.toLocal(cellData.getValue().adjustedAt())) : ""));
    }

    private void setupFilters() {
        filterBar = new FilterBar();
        filterBar.setStyle("-fx-background-color: white; -fx-padding: 15; -fx-background-radius: 12; -fx-effect: dropshadow(gaussian, rgba(0,0,0,0.08), 8, 0, 0, 2); -fx-border-color: #e2e8f0; -fx-border-radius: 12; -fx-border-width: 1;");

        List<String> reasons = new ArrayList<>();
        reasons.add("All Reasons");
        for (InventoryReason reason : InventoryReason.values()) {
            String value = reason.getValue();
            if ("confirm_receive".equalsIgnoreCase(value)) {
                reasons.add("Received");
            } else {
                String[] words = value.split("_");
                StringBuilder titleCase = new StringBuilder();
                for (String word : words) {
                    if (word.length() > 0) {
                        titleCase.append(Character.toUpperCase(word.charAt(0)))
                                 .append(word.substring(1).toLowerCase())
                                 .append(" ");
                    }
                }
                reasons.add(titleCase.toString().trim());
            }
        }

        ComboBox<String> reasonCombo = filterBar.addFilter("reason", "All Reasons");
        reasonCombo.setItems(FXCollections.observableArrayList(reasons));
        reasonCombo.getSelectionModel().selectFirst();

        DatePicker fromDate = filterBar.addDateFilter("fromDate", "From Date");
        DatePicker toDate = filterBar.addDateFilter("toDate", "To Date");

        toDate.valueProperty().addListener((obs, oldVal, newVal) -> {
            if (newVal != null && fromDate.getValue() != null && newVal.isBefore(fromDate.getValue())) {
                toDate.setValue(fromDate.getValue());
            }
        });

        fromDate.valueProperty().addListener((obs, oldVal, newVal) -> {
            if (newVal != null && toDate.getValue() != null && newVal.isAfter(toDate.getValue())) {
                toDate.setValue(newVal);
            }
        });

        CompletableFuture.supplyAsync(() -> userService.getUsers(new UserFilter(null, 1, 1000)).items())
                .thenAccept(users -> Platform.runLater(() -> {
                    filterBar.addMultiSelectFilter("adjustedBy", "Filter by User", users, User::name, true);
                }));

        filterBar.setOnFilterChange(filters -> {
            currentSearch = (String) filters.get("search");
            String r = (String) filters.get("reason");
            if (r == null || "All Reasons".equals(r)) {
                currentReason = null;
            } else {
                // Map back to enum value
                if ("Received".equals(r)) {
                    currentReason = "confirm_receive";
                } else {
                    currentReason = r.toLowerCase().replace(" ", "_");
                }
            }
            currentFromDate = (java.time.LocalDate) filters.get("fromDate");
            currentToDate = (java.time.LocalDate) filters.get("toDate");

            Object usersObj = filters.get("adjustedBy");
            if (usersObj instanceof List) {
                @SuppressWarnings("unchecked")
                List<User> selectedUsers = (List<User>) usersObj;
                if (!selectedUsers.isEmpty()) {
                    currentUserIds = selectedUsers.stream().map(User::id).toList();
                } else {
                    currentUserIds = null;
                }
            } else {
                currentUserIds = null;
            }

            paginationBar.reset();
        });

        container.getChildren().add(1, filterBar);
    }

    private void setupPagination() {
        paginationBar.setOnPageChange((page, size) -> {
            currentPage = page + 1;
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

        String fromDateStr = currentFromDate != null ? currentFromDate.atStartOfDay().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")) : null;
        String toDateStr = currentToDate != null ? currentToDate.atTime(23, 59, 59).format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")) : null;

        // Load one extra item to check if there are more pages
        CompletableFuture.supplyAsync(() -> inventoryService.getStockHistory(currentSearch, selectedReasons, fromDateStr, toDateStr, currentUserIds, pageSize + 1, offset))
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
