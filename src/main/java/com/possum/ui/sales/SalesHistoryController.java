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
import com.possum.ui.common.dialogs.BillPreviewDialog;
import com.possum.ui.common.controls.*;
import javafx.application.Platform;
import javafx.beans.property.SimpleStringProperty;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.fxml.FXML;
import javafx.scene.control.*;
import javafx.scene.layout.HBox;
import javafx.scene.layout.VBox;
import javafx.util.Callback;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.CompletableFuture;

public class SalesHistoryController {

    @FXML private VBox container;
    @FXML private Label totalBillsLabel;
    @FXML private Label paidLabel;
    @FXML private Label partialLabel;
    @FXML private Label cancelledLabel;

    @FXML private TableView<Sale> salesTable;
    @FXML private TableColumn<Sale, String> invoiceCol;
    @FXML private TableColumn<Sale, String> customerCol;
    @FXML private TableColumn<Sale, String> dateCol;
    @FXML private TableColumn<Sale, String> amountCol;
    @FXML private TableColumn<Sale, String> paidAmountCol;
    @FXML private TableColumn<Sale, String> statusCol;
    @FXML private TableColumn<Sale, Void> actionsCol;

    @FXML private PaginationBar paginationBar;

    private FilterBar filterBar;
    private final SalesService salesService;
    private final SettingsStore settingsStore;
    private final PrinterService printerService;
    private final ObservableList<Sale> salesList = FXCollections.observableArrayList();
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("MMM dd, yyyy HH:mm");
    private static final NumberFormat CURRENCY_FORMAT = NumberFormat.getCurrencyInstance(Locale.US);

    private int currentPage = 1;
    private int pageSize = 15;
    private String currentSearch = "";
    private List<String> currentStatus = null;

    public SalesHistoryController(SalesService salesService, SettingsStore settingsStore, PrinterService printerService) {
        this.salesService = salesService;
        this.settingsStore = settingsStore;
        this.printerService = printerService;
    }

    @FXML
    public void initialize() {
        setupTable();
        setupFilters();
        setupPagination();
        loadHistory();
    }

    private void setupTable() {
        salesTable.setItems(salesList);

        invoiceCol.setCellValueFactory(cellData -> new SimpleStringProperty(cellData.getValue().invoiceNumber()));
        customerCol.setCellValueFactory(cellData -> new SimpleStringProperty(
                cellData.getValue().customerName() != null ? cellData.getValue().customerName() : "Walk-in Customer"));
        dateCol.setCellValueFactory(cellData -> new SimpleStringProperty(
                cellData.getValue().saleDate() != null ? cellData.getValue().saleDate().format(DATE_FORMATTER) : ""));
        amountCol.setCellValueFactory(cellData -> new SimpleStringProperty(CURRENCY_FORMAT.format(cellData.getValue().totalAmount())));
        paidAmountCol.setCellValueFactory(cellData -> new SimpleStringProperty(CURRENCY_FORMAT.format(cellData.getValue().paidAmount())));

        statusCol.setCellFactory(column -> new TableCell<>() {
            @Override
            protected void updateItem(String item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || getTableRow() == null || getTableRow().getItem() == null) {
                    setText(null);
                    setGraphic(null);
                } else {
                    Sale sale = getTableRow().getItem();
                    String status = sale.status();
                    setText(status.toUpperCase());
                    
                    String color;
                    switch (status.toLowerCase()) {
                        case "paid" -> color = "#10b981";
                        case "partially_paid" -> color = "#f59e0b";
                        case "cancelled", "refunded" -> color = "#ef4444";
                        default -> color = "#64748b";
                    }
                    setStyle("-fx-text-fill: white; -fx-background-color: " + color + "; -fx-background-radius: 4; -fx-padding: 2 6; -fx-font-weight: bold; -fx-font-size: 10px;");
                }
            }
        });
        statusCol.setCellValueFactory(cellData -> new SimpleStringProperty(cellData.getValue().status()));

        setupActions();
    }

    private void setupActions() {
        actionsCol.setCellFactory(new Callback<>() {
            @Override
            public TableCell<Sale, Void> call(TableColumn<Sale, Void> param) {
                return new TableCell<>() {
                    private final Button btnView = new Button("👁");
                    private final Button btnPrint = new Button("🖨");
                    private final Button btnCancel = new Button("❌");
                    private final HBox pane = new HBox(5, btnView, btnPrint, btnCancel);

                    {
                        btnView.getStyleClass().add("action-btn");
                        btnPrint.getStyleClass().add("action-btn");
                        btnCancel.getStyleClass().add("action-btn-destructive");
                        
                        btnView.setTooltip(new Tooltip("View Details"));
                        btnPrint.setTooltip(new Tooltip("Print Invoice"));
                        btnCancel.setTooltip(new Tooltip("Cancel Sale"));

                        btnView.setOnAction(e -> handleView(getTableRow().getItem()));
                        btnPrint.setOnAction(e -> handlePrint(getTableRow().getItem()));
                        btnCancel.setOnAction(e -> handleCancel(getTableRow().getItem()));
                    }

                    @Override
                    protected void updateItem(Void item, boolean empty) {
                        super.updateItem(item, empty);
                        if (empty || getTableRow() == null || getTableRow().getItem() == null) {
                            setGraphic(null);
                        } else {
                            Sale sale = getTableRow().getItem();
                            btnCancel.setVisible(!"cancelled".equals(sale.status()) && !"refunded".equals(sale.status()));
                            setGraphic(pane);
                        }
                    }
                };
            }
        });
    }

    private void setupFilters() {
        filterBar = new FilterBar();
        
        ComboBox<String> statusCombo = filterBar.addFilter("status", "All Statuses");
        statusCombo.setItems(FXCollections.observableArrayList(
                "All Statuses", "Paid", "Partially Paid", "Draft", "Cancelled", "Refunded"
        ));
        statusCombo.getSelectionModel().selectFirst();

        filterBar.setOnFilterChange(filters -> {
            currentSearch = (String) filters.get("search");
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
                null, // startDate
                null, // endDate
                currentSearch,
                currentPage,
                pageSize,
                "sale_date",
                "DESC",
                null // fulfillmentStatus
        );

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
            });
        }).exceptionally(ex -> {
            ex.printStackTrace();
            return null;
        });
    }

    private void handleView(Sale sale) {
        if (sale == null) return;
        SaleResponse saleResponse = salesService.getSaleDetails(sale.id());
        String billHtml = BillRenderer.renderBill(saleResponse, settingsStore.loadGeneralSettings(), settingsStore.loadBillSettings());
        
        BillPreviewDialog dialog = new BillPreviewDialog(billHtml, salesTable.getScene().getWindow());
        dialog.showAndWait();
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
