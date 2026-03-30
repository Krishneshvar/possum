package com.possum.ui.sales;

import com.possum.application.sales.SalesService;
import com.possum.application.sales.dto.SaleResponse;
import com.possum.application.sales.dto.SaleStats;
import com.possum.domain.model.Sale;
import com.possum.shared.dto.PagedResult;
import com.possum.shared.dto.SaleFilter;
import com.possum.ui.common.controls.FilterBar;
import com.possum.ui.common.controls.PaginationBar;
import com.possum.infrastructure.filesystem.SettingsStore;
import com.possum.infrastructure.printing.BillRenderer;
import com.possum.infrastructure.printing.PrinterService;
import com.possum.ui.common.controls.*;
import com.possum.ui.workspace.WorkspaceManager;
import javafx.application.Platform;
import javafx.beans.property.SimpleObjectProperty;
import javafx.beans.property.SimpleStringProperty;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.fxml.FXML;
import javafx.scene.control.*;
import javafx.scene.layout.VBox;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.concurrent.CompletableFuture;

public class SalesHistoryController {

    @FXML private VBox container;
    @FXML private Label totalBillsLabel;
    @FXML private Label paidLabel;
    @FXML private Label partialLabel;
    @FXML private Label cancelledLabel;

    @FXML private DataTableView<Sale> salesTable;

    @FXML private PaginationBar paginationBar;

    private FilterBar filterBar;
    private final SalesService salesService;
    private final SettingsStore settingsStore;
    private final PrinterService printerService;
    private final WorkspaceManager workspaceManager;
    private final ObservableList<Sale> salesList = FXCollections.observableArrayList();
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("MMM dd, yyyy HH:mm");
    private static final NumberFormat CURRENCY_FORMAT = NumberFormat.getCurrencyInstance(Locale.US);

    private int currentPage = 1;
    private int pageSize = 15;
    private String currentSearch = "";
    private List<String> currentStatus = null;
    private java.time.LocalDate currentFromDate = null;
    private java.time.LocalDate currentToDate = null;
    private BigDecimal currentMinAmount = null;
    private BigDecimal currentMaxAmount = null;

    public SalesHistoryController(SalesService salesService, 
                                  SettingsStore settingsStore, 
                                  PrinterService printerService,
                                  WorkspaceManager workspaceManager) {
        this.salesService = salesService;
        this.settingsStore = settingsStore;
        this.printerService = printerService;
        this.workspaceManager = workspaceManager;
    }

    @FXML
    public void initialize() {
        setupTable();
        setupFilters();
        setupPagination();
        loadHistory();
    }

    private void setupTable() {
        salesTable.getTableView().setItems(salesList);

        salesTable.addColumn("Invoice #", cellData -> new SimpleStringProperty(cellData.getValue().invoiceNumber()));
        
        salesTable.addColumn("Customer", cellData -> new SimpleStringProperty(
                cellData.getValue().customerName() != null ? cellData.getValue().customerName() : "Walk-in Customer"));
        
        salesTable.addColumn("Date & Time", cellData -> {
            LocalDateTime saleDate = cellData.getValue().saleDate();
            if (saleDate == null) return new SimpleStringProperty("");
            ZonedDateTime utcZoned = saleDate.atZone(ZoneId.of("UTC"));
            ZonedDateTime localZoned = utcZoned.withZoneSameInstant(ZoneId.systemDefault());
            return new SimpleStringProperty(localZoned.format(DATE_FORMATTER));
        });

        TableColumn<Sale, BigDecimal> amountCol = (TableColumn<Sale, BigDecimal>) salesTable.addColumn("Bill Total", cellData -> new SimpleObjectProperty<>(cellData.getValue().totalAmount()));
        amountCol.setCellFactory(column -> new TableCell<>() {
            @Override
            protected void updateItem(BigDecimal item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || item == null) {
                    setText(null);
                } else {
                    setText(CURRENCY_FORMAT.format(item));
                }
            }
        });
        amountCol.setStyle("-fx-alignment: CENTER-RIGHT;");

        TableColumn<Sale, String> statusCol = (TableColumn<Sale, String>) salesTable.addColumn("Status", cellData -> new SimpleStringProperty(cellData.getValue().status()));
        statusCol.setCellFactory(column -> new TableCell<>() {
            @Override
            protected void updateItem(String item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || getTableRow() == null || getTableRow().getItem() == null) {
                    setText(null);
                    setGraphic(null);
                    setStyle(null);
                } else {
                    Sale sale = getTableRow().getItem();
                    String status = sale.status();
                    setText(status.toUpperCase());
                    String color = switch (status.toLowerCase()) {
                        case "paid" -> "#10b981";
                        case "partially_paid" -> "#f59e0b";
                        case "cancelled", "refunded" -> "#ef4444";
                        default -> "#64748b";
                    };
                    setStyle("-fx-text-fill: white; -fx-background-color: " + color + "; -fx-background-radius: 4; -fx-padding: 2 6; -fx-font-weight: bold; -fx-font-size: 10px;");
                }
            }
        });
        statusCol.setStyle("-fx-alignment: CENTER;");
        statusCol.setSortable(false);

        salesTable.addMenuActionColumn("Actions", this::buildActionsMenu);
    }

    private java.util.List<MenuItem> buildActionsMenu(Sale sale) {
        java.util.List<MenuItem> items = new java.util.ArrayList<>();

        MenuItem viewItem = new MenuItem("👁 View Details");
        viewItem.setOnAction(e -> handleView(sale));
        items.add(viewItem);

        MenuItem printItem = new MenuItem("🖨 Print Invoice");
        printItem.setOnAction(e -> handlePrint(sale));
        items.add(printItem);

        if (!"cancelled".equals(sale.status()) && !"refunded".equals(sale.status())) {
            if (com.possum.ui.common.UIPermissionUtil.hasPermission(com.possum.application.auth.Permissions.SALES_MANAGE)) {
                MenuItem cancelItem = new MenuItem("❌ Cancel Sale");
                cancelItem.setStyle("-fx-text-fill: red;");
                cancelItem.setOnAction(e -> handleCancel(sale));
                items.add(new SeparatorMenuItem());
                items.add(cancelItem);
            }
        }

        return items;
    }

    private void setupFilters() {
        filterBar = new FilterBar();
        
        ComboBox<String> statusCombo = filterBar.addFilter("status", "All Statuses");
        statusCombo.setItems(FXCollections.observableArrayList(
                "All Statuses", "Paid", "Partially Paid", "Draft", "Cancelled", "Refunded"
        ));
        filterBar.setDefaultValue("status", "All Statuses");
        statusCombo.getSelectionModel().selectFirst();

        filterBar.addDateFilter("fromDate", "From Date");
        filterBar.addDateFilter("toDate", "To Date");
        filterBar.addTextFilter("minAmount", "Min Total");
        filterBar.addTextFilter("maxAmount", "Max Total");

        filterBar.setOnFilterChange(filters -> {
            currentSearch = (String) filters.get("search");
            currentFromDate = (java.time.LocalDate) filters.get("fromDate");
            currentToDate = (java.time.LocalDate) filters.get("toDate");

            Object min = filters.get("minAmount");
            currentMinAmount = parseBigDecimal(min);

            Object max = filters.get("maxAmount");
            currentMaxAmount = parseBigDecimal(max);
            
            String status = (String) filters.get("status");
            if (status == null || "All Statuses".equals(status)) {
                currentStatus = null;
            } else {
                currentStatus = Collections.singletonList(status.toLowerCase().replace(" ", "_"));
            }
            paginationBar.reset();
            loadHistory();
        });

        container.getChildren().add(2, filterBar);
    }

    private void setupPagination() {
        paginationBar.setOnPageChange((page, size) -> {
            currentPage = page;
            pageSize = size;
            loadHistory();
        });
    }

    @FXML
    public void loadHistory() {
        SaleFilter filter = new SaleFilter(
                currentStatus,
                null, // customerId
                null, // userId
                currentFromDate != null ? currentFromDate.atStartOfDay().toString() : null,
                currentToDate != null ? currentToDate.atTime(23, 59, 59).toString() : null,
                currentMinAmount,
                currentMaxAmount,
                currentSearch,
                currentPage,
                pageSize,
                "sale_date",
                "DESC",
                null // fulfillmentStatus
        );

        salesTable.setLoading(true);
        CompletableFuture.runAsync(() -> {
            PagedResult<Sale> results = salesService.findSales(filter);
            SaleStats stats = salesService.getSaleStats(filter);

            Platform.runLater(() -> {
                salesList.setAll(results.items());
                paginationBar.setTotalItems(results.totalCount());
                
                totalBillsLabel.setText(String.valueOf(stats.totalBills()));
                paidLabel.setText(String.valueOf(stats.paidCount()));
                partialLabel.setText(String.valueOf(stats.partialOrDraftCount()));
                cancelledLabel.setText(String.valueOf(stats.cancelledOrRefundedCount()));
                salesTable.setLoading(false);
            });
        }).exceptionally(ex -> {
            ex.printStackTrace();
            Platform.runLater(() -> salesTable.setLoading(false));
            return null;
        });
    }

    private BigDecimal parseBigDecimal(Object value) {
        if (value == null) return null;
        if (value instanceof BigDecimal) return (BigDecimal) value;
        try {
            String s = value.toString().trim();
            if (s.isEmpty()) return null;
            return new BigDecimal(s);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private void handleView(Sale sale) {
        if (sale == null) return;
        Map<String, Object> params = new HashMap<>();
        params.put("sale", sale);
        workspaceManager.openOrFocusWindow("Bill: " + sale.invoiceNumber(), "/fxml/sales/sale-detail-view.fxml", params);
    }

    private void handlePrint(Sale sale) {
        if (sale == null) return;
        SaleResponse saleResponse = salesService.getSaleDetails(sale.id());
        String billHtml = BillRenderer.renderBill(saleResponse, settingsStore.loadGeneralSettings(), settingsStore.loadBillSettings());
        
        printerService.printInvoice(billHtml)
            .thenAccept(success -> {
                if (!success) Platform.runLater(() -> NotificationService.warning("Print failed"));
            });
    }

    private void handleCancel(Sale sale) {
        if (sale == null) return;
        
        Alert alert = new Alert(Alert.AlertType.CONFIRMATION);
        alert.setTitle("Cancel Sale");
        alert.setHeaderText("Cancel Invoice #" + sale.invoiceNumber());
        alert.setContentText("Are you sure you want to cancel this sale? This will restore inventory stock.");

        if (alert.showAndWait().orElse(ButtonType.CANCEL) == ButtonType.OK) {
            CompletableFuture.runAsync(() -> salesService.cancelSale(sale.id(), 1L)) // Assuming user ID 1 for now
                    .thenRun(() -> Platform.runLater(this::loadHistory))
                    .exceptionally(ex -> {
                        ex.printStackTrace();
                        Platform.runLater(() -> {
                            Alert error = new Alert(Alert.AlertType.ERROR);
                            error.setContentText("Failed to cancel sale: " + ex.getMessage());
                            error.show();
                        });
                        return null;
                    });
        }
    }
}
