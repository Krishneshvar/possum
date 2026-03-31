package com.possum.ui.returns;

import com.possum.application.returns.ReturnsService;
import com.possum.application.sales.SalesService;
import com.possum.application.sales.dto.SaleResponse;
import com.possum.domain.model.Return;
import com.possum.domain.model.Sale;
import com.possum.shared.dto.PagedResult;
import com.possum.shared.dto.ReturnFilter;
import com.possum.ui.common.controls.*;
import javafx.application.Platform;
import javafx.collections.FXCollections;
import javafx.fxml.FXML;
import javafx.scene.control.*;
import javafx.beans.property.SimpleStringProperty;
import javafx.beans.property.SimpleObjectProperty;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDateTime;
import java.util.*;

public class ReturnsController {
    
    @FXML private FilterBar filterBar;
    @FXML private DataTableView<Return> returnsTable;
    @FXML private PaginationBar paginationBar;
    @FXML private javafx.scene.control.Button createReturnButton;
    
    private final ReturnsService returnsService;
    private final SalesService salesService;
    private final com.possum.ui.workspace.WorkspaceManager workspaceManager;
    private String currentSearch = "";
    private java.time.LocalDate fromDate = null;
    private java.time.LocalDate toDate = null;
    private BigDecimal currentMinAmount = null;
    private BigDecimal currentMaxAmount = null;
    private final NumberFormat currencyFormat = NumberFormat.getCurrencyInstance(Locale.US);

    public ReturnsController(ReturnsService returnsService, SalesService salesService, com.possum.ui.workspace.WorkspaceManager workspaceManager) {
        this.returnsService = returnsService;
        this.salesService = salesService;
        this.workspaceManager = workspaceManager;
    }

    @FXML
    public void initialize() {
        if (createReturnButton != null) {
            com.possum.ui.common.UIPermissionUtil.requirePermission(createReturnButton, com.possum.application.auth.Permissions.RETURNS_MANAGE);
        }
        
        setupTable();
        setupFilters();
        loadReturns();
    }

    private void setupTable() {
        TableColumn<Return, String> invoiceCol = new TableColumn<>("Invoice #");
        invoiceCol.setCellValueFactory(cellData -> new SimpleStringProperty(cellData.getValue().invoiceNumber()));
        invoiceCol.setSortable(false);
        
        TableColumn<Return, LocalDateTime> dateCol = new TableColumn<>("Date");
        dateCol.setCellValueFactory(cellData -> new SimpleObjectProperty<>(cellData.getValue().createdAt()));
        dateCol.setCellFactory(col -> new TableCell<>() {
            private final java.time.format.DateTimeFormatter formatter = java.time.format.DateTimeFormatter.ofPattern("MMM dd, yyyy hh:mm a");
            @Override
            protected void updateItem(LocalDateTime item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || item == null) {
                    setText(null);
                } else {
                    java.time.ZonedDateTime utcZoned = item.atZone(java.time.ZoneId.of("UTC"));
                    java.time.ZonedDateTime localZoned = utcZoned.withZoneSameInstant(java.time.ZoneId.systemDefault());
                    setText(localZoned.format(formatter));
                }
            }
        });
        
        TableColumn<Return, BigDecimal> refundCol = new TableColumn<>("Refund");
        refundCol.setCellValueFactory(cellData -> new SimpleObjectProperty<>(cellData.getValue().totalRefund()));
        refundCol.setCellFactory(col -> new TableCell<>() {
            @Override
            protected void updateItem(BigDecimal item, boolean empty) {
                super.updateItem(item, empty);
                setText(empty || item == null ? null : currencyFormat.format(item));
            }
        });
        
        TableColumn<Return, String> reasonCol = new TableColumn<>("Reason");
        reasonCol.setCellValueFactory(cellData -> new SimpleStringProperty(cellData.getValue().reason()));
        
        returnsTable.getTableView().getColumns().addAll(invoiceCol, dateCol, refundCol, reasonCol);
        
        returnsTable.addActionColumn("View", this::handleViewDetails);
    }

    private void setupFilters() {
        filterBar.addDateFilter("fromDate", "From Date");
        filterBar.addDateFilter("toDate", "To Date");
        filterBar.addTextFilter("minAmount", "Min Refund");
        filterBar.addTextFilter("maxAmount", "Max Refund");

        filterBar.setOnFilterChange(filters -> {
            currentSearch = (String) filters.get("search");
            fromDate = (java.time.LocalDate) filters.get("fromDate");
            toDate = (java.time.LocalDate) filters.get("toDate");
            currentMinAmount = parseBigDecimal(filters.get("minAmount"));
            currentMaxAmount = parseBigDecimal(filters.get("maxAmount"));
            loadReturns();
        });
        
        paginationBar.setOnPageChange((page, size) -> loadReturns());
    }

    private void loadReturns() {
        returnsTable.setLoading(true);
        
        Platform.runLater(() -> {
            try {
                ReturnFilter filter = new ReturnFilter(
                    null,
                    null,
                    fromDate != null ? fromDate.atStartOfDay().toString() : null,
                    toDate != null ? toDate.atTime(23, 59, 59).toString() : null,
                    currentMinAmount,
                    currentMaxAmount,
                    currentSearch.isEmpty() ? null : currentSearch,
                    paginationBar.getCurrentPage() + 1,
                    paginationBar.getPageSize(),
                    "created_at",
                    "DESC"
                );
                
                PagedResult<Return> result = returnsService.getReturns(filter);
                
                returnsTable.setItems(FXCollections.observableArrayList(result.items()));
                paginationBar.setTotalItems(result.totalCount());
                returnsTable.setLoading(false);
            } catch (Exception e) {
                returnsTable.setLoading(false);
                NotificationService.error("Failed to load returns");
            }
        });
    }

    @FXML
    private void handleRefresh() {
        loadReturns();
    }

    @FXML
    private void handleCreateReturn() {
        workspaceManager.openDialog("Process Return", "/fxml/returns/create-return-dialog.fxml");
        loadReturns();
    }

    private void handleViewDetails(Return returnRecord) {
        SaleResponse saleResponse = salesService.getSaleDetails(returnRecord.saleId());
        Sale sale = saleResponse.sale();
        if (sale == null) return;
        
        java.util.Map<String, Object> params = new java.util.HashMap<>();
        params.put("sale", sale);
        workspaceManager.openOrFocusWindow("Bill: " + sale.invoiceNumber(), "/fxml/sales/sale-detail-view.fxml", params);
    }

    private BigDecimal parseBigDecimal(Object value) {
        if (value == null) return null;
        if (value instanceof BigDecimal) return (BigDecimal) value;
        try {
            String s = value.toString().replaceAll("[^0-9.\\-]", "");
            return s.isEmpty() ? null : new BigDecimal(s);
        } catch (Exception e) {
            return null;
        }
    }
}
