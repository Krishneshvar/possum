package com.possum.ui.sales;

import com.possum.application.auth.AuthContext;
import com.possum.application.auth.AuthUser;
import com.possum.shared.util.TimeUtil;
import com.possum.application.sales.SalesService;
import com.possum.application.sales.dto.SaleResponse;
import com.possum.domain.model.LegacySale;
import com.possum.domain.model.PaymentMethod;
import com.possum.domain.model.Sale;
import com.possum.shared.dto.PagedResult;
import com.possum.shared.dto.SaleFilter;
import com.possum.shared.util.CsvImportUtil;
import com.possum.ui.common.controls.FilterBar;
import com.possum.ui.common.controls.PaginationBar;
import com.possum.infrastructure.filesystem.SettingsStore;
import com.possum.infrastructure.printing.BillRenderer;
import com.possum.infrastructure.printing.PrintOutcome;
import com.possum.infrastructure.printing.PrinterService;
import com.possum.ui.common.controls.*;
import com.possum.ui.common.dialogs.ImportProgressDialog;
import com.possum.ui.workspace.WorkspaceManager;
import javafx.application.Platform;
import javafx.concurrent.Task;
import javafx.beans.property.SimpleObjectProperty;
import javafx.beans.property.SimpleStringProperty;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.fxml.FXML;
import javafx.scene.control.*;
import javafx.scene.layout.VBox;
import com.possum.ui.common.dialogs.DialogStyler;
import javafx.stage.FileChooser;

import java.io.File;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.time.LocalDateTime;
import java.util.concurrent.CompletableFuture;
import javafx.geometry.Insets;
import javafx.scene.layout.GridPane;
import javafx.scene.layout.ColumnConstraints;
import javafx.scene.layout.Priority;
import javafx.scene.layout.Region;

public class SalesHistoryController {

    @FXML private VBox container;
    @FXML private VBox mainCard;
    @FXML private DataTableView<Sale> salesTable;

    @FXML private PaginationBar paginationBar;
    @FXML private Button importLegacyButton;

    private FilterBar filterBar;
    private final SalesService salesService;
    private final SettingsStore settingsStore;
    private final PrinterService printerService;
    private final WorkspaceManager workspaceManager;
    private final ObservableList<Sale> salesList = FXCollections.observableArrayList();
    private static final NumberFormat CURRENCY_FORMAT = NumberFormat.getCurrencyInstance(Locale.US);

    private int currentPage = 1;
    private int pageSize = 15;
    private String currentSearch = "";
    private List<String> currentStatus = null;
    private java.time.LocalDate currentFromDate = null;
    private java.time.LocalDate currentToDate = null;
    private BigDecimal currentMinAmount = null;
    private BigDecimal currentMaxAmount = null;
    private List<Long> currentPaymentMethodIds = null;
    private static final DateTimeFormatter CSV_DATE_MDY = DateTimeFormatter.ofPattern("M/d/yyyy");
    private static final DateTimeFormatter CSV_DATE_DMY = DateTimeFormatter.ofPattern("d/M/yyyy");
    private static final DateTimeFormatter CSV_TIME = DateTimeFormatter.ofPattern("h:mm a", Locale.ENGLISH);

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
        if (importLegacyButton != null) {
            com.possum.ui.common.UIPermissionUtil.requirePermission(importLegacyButton, com.possum.application.auth.Permissions.SALES_MANAGE);
        }
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
        
        salesTable.addColumn("Payment", cellData -> new SimpleStringProperty(
                cellData.getValue().paymentMethodName() != null ? cellData.getValue().paymentMethodName() : "-"));

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
                if (empty || getTableRow() == null || getTableRow().getItem() == null || item == null) {
                    setText(null);
                    setGraphic(null);
                } else {
                    String status = item;
                    Label badge = new Label(status.replace("_", " ").toUpperCase());
                    badge.getStyleClass().addAll("badge", "badge-status");
                    switch (status.toLowerCase()) {
                        case "paid" -> badge.getStyleClass().add("badge-success");
                        case "cancelled", "refunded" -> badge.getStyleClass().add("badge-error");
                        case "partially_paid", "partially_refunded", "draft" -> badge.getStyleClass().add("badge-warning");
                        case "legacy" -> badge.getStyleClass().add("badge-neutral");
                        default -> badge.getStyleClass().add("badge-neutral");
                    }
                    setGraphic(badge);
                    setContentDisplay(ContentDisplay.GRAPHIC_ONLY);
                    setAlignment(javafx.geometry.Pos.CENTER);
                    setText(null);
                }
            }
        });
        statusCol.setStyle("-fx-alignment: CENTER;");
        statusCol.setSortable(false);

        salesTable.addColumn("Date & Time", cellData -> {
            LocalDateTime saleDate = cellData.getValue().saleDate();
            if (saleDate == null) return new SimpleStringProperty("");
            LocalDateTime localZoned = TimeUtil.toLocal(saleDate);
            return new SimpleStringProperty(TimeUtil.formatStandard(localZoned));
        });

        salesTable.addMenuActionColumn("Actions", this::buildActionsMenu);
    }

    private java.util.List<MenuItem> buildActionsMenu(Sale sale) {
        java.util.List<MenuItem> items = new java.util.ArrayList<>();

        if (isLegacySale(sale)) {
            MenuItem viewLegacy = new MenuItem("📄 View Legacy Summary");
            viewLegacy.setOnAction(e -> showLegacySummary(sale));
            items.add(viewLegacy);
            return items;
        }

        MenuItem viewItem = new MenuItem("👁 View Details");
        viewItem.setOnAction(e -> handleView(sale));
        items.add(viewItem);

        MenuItem printItem = new MenuItem("🖨 Print Invoice");
        printItem.setOnAction(e -> handlePrint(sale));
        items.add(printItem);

        if (!"cancelled".equals(sale.status()) && !"refunded".equals(sale.status())) {
            MenuItem returnItem = new MenuItem("↩ Return Items");
            returnItem.setOnAction(e -> handleReturn(sale));
            items.add(returnItem);

            if (com.possum.ui.common.UIPermissionUtil.hasPermission(com.possum.application.auth.Permissions.SALES_MANAGE)) {
                MenuItem editItem = new MenuItem("✏️ Edit Bill");
                editItem.setOnAction(e -> handleEdit(sale));

                MenuItem cancelItem = new MenuItem("❌ Cancel Sale");
                cancelItem.getStyleClass().add("logout-menu-item");
                cancelItem.setOnAction(e -> handleCancel(sale));
                
                items.add(new SeparatorMenuItem());
                items.add(editItem);
                items.add(cancelItem);
            }
        }

        return items;
    }

    private void handleEdit(Sale sale) {
        if (sale == null) return;
        if (isLegacySale(sale)) {
            showLegacySummary(sale);
            return;
        }
        Map<String, Object> params = new HashMap<>();
        params.put("sale", sale);
        params.put("editing", true);
        workspaceManager.openOrFocusWindow("Bill: " + sale.invoiceNumber(), "/fxml/sales/sale-detail-view.fxml", params);
    }

    private void handleReturn(Sale sale) {
        if (sale == null) return;
        if (isLegacySale(sale)) {
            NotificationService.warning("Legacy bills do not have item-level rows for returns.");
            return;
        }
        Map<String, Object> params = new HashMap<>();
        params.put("invoiceNumber", sale.invoiceNumber());
        workspaceManager.openDialog("Process Return", "/fxml/returns/create-return-dialog.fxml", params);
        
        // Refresh the list after return dialog might have changed statuses
        loadHistory();
    }

    private void setupFilters() {
        filterBar = new FilterBar();
        
        filterBar.addMultiSelectFilter("status", "All Statuses", 
                List.of("Paid", "Partially Paid", "Draft", "Cancelled", "Refunded", "Partially Refunded", "Legacy"),
                s -> s,
                false
        );

        List<com.possum.domain.model.PaymentMethod> pms = salesService.getPaymentMethods();
        filterBar.addMultiSelectFilter("paymentMethod", "All Payments", pms, 
                com.possum.domain.model.PaymentMethod::name,
                false);
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
            
            List<String> statuses = (List<String>) filters.get("status");
            if (statuses == null || statuses.isEmpty()) {
                currentStatus = null;
            } else {
                currentStatus = statuses.stream()
                        .map(s -> s.toLowerCase().replace(" ", "_"))
                        .toList();
            }

            List<com.possum.domain.model.PaymentMethod> selectedPms = (List<com.possum.domain.model.PaymentMethod>) filters.get("paymentMethod");
            if (selectedPms == null || selectedPms.isEmpty()) {
                currentPaymentMethodIds = null;
            } else {
                currentPaymentMethodIds = selectedPms.stream()
                        .map(com.possum.domain.model.PaymentMethod::id)
                        .toList();
            }

            paginationBar.reset();
            loadHistory();
        });

        mainCard.getChildren().add(0, filterBar);
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
                null, // fulfillmentStatus
                currentPaymentMethodIds
        );

        salesTable.setLoading(true);
        CompletableFuture.runAsync(() -> {
            PagedResult<Sale> results = salesService.findSales(filter);

            Platform.runLater(() -> {
                salesList.setAll(results.items());
                paginationBar.setTotalItems(results.totalCount());
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
        if (isLegacySale(sale)) {
            showLegacySummary(sale);
            return;
        }
        Map<String, Object> params = new HashMap<>();
        params.put("sale", sale);
        workspaceManager.openOrFocusWindow("Bill: " + sale.invoiceNumber(), "/fxml/sales/sale-detail-view.fxml", params);
    }

    private void handlePrint(Sale sale) {
        if (sale == null) return;
        if (isLegacySale(sale)) {
            NotificationService.warning("Legacy bills cannot be reprinted because line-item details are unavailable.");
            return;
        }
        try {
            SaleResponse saleResponse = salesService.getSaleDetails(sale.id());
            com.possum.shared.dto.GeneralSettings generalSettings = settingsStore.loadGeneralSettings();
            com.possum.shared.dto.BillSettings billSettings = settingsStore.loadBillSettings();
            String billHtml = BillRenderer.renderBill(saleResponse, generalSettings, billSettings);

            printerService.printInvoiceDetailed(
                            billHtml,
                            generalSettings.getDefaultPrinterName(),
                            billSettings.getPaperWidth()
                    )
                    .thenAccept(this::notifyPrintResult)
                    .exceptionally(ex -> {
                        Platform.runLater(() -> NotificationService.error("Print error: " + ex.getMessage()));
                        return null;
                    });
        } catch (Exception ex) {
            NotificationService.error("Unable to print this bill: " + ex.getMessage());
        }
    }

    private void notifyPrintResult(PrintOutcome outcome) {
        Platform.runLater(() -> {
            if (outcome.success()) {
                String printer = outcome.printerName() != null ? outcome.printerName() : "configured printer";
                NotificationService.success("Invoice sent to " + printer);
            } else {
                NotificationService.warning("Print failed: " + outcome.message());
            }
        });
    }

    private void handleCancel(Sale sale) {
        if (sale == null) return;
        if (isLegacySale(sale)) {
            NotificationService.warning("Legacy bills are read-only and cannot be cancelled.");
            return;
        }
        
        Alert alert = new Alert(Alert.AlertType.CONFIRMATION);
        
        DialogStyler.apply(alert);
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
                            DialogStyler.apply(error);
                            error.setContentText("Failed to cancel sale: " + ex.getMessage());
                            error.show();
                        });
                        return null;
            });
        }
    }

    @FXML
    private void handleImportLegacySales() {
        FileChooser fileChooser = new FileChooser();
        fileChooser.setTitle("Import Legacy Bills (Serieswise CSV)");
        fileChooser.getExtensionFilters().add(new FileChooser.ExtensionFilter("CSV Files", "*.csv"));

        File file = fileChooser.showOpenDialog(salesTable != null && salesTable.getScene() != null ? salesTable.getScene().getWindow() : null);
        if (file == null) {
            return;
        }

        AuthUser currentUser = AuthContext.getCurrentUser();
        if (currentUser == null) {
            NotificationService.error("No active user session found. Please sign in again and retry import.");
            return;
        }

        ImportProgressDialog progressDialog = new ImportProgressDialog(
                salesTable != null && salesTable.getScene() != null ? salesTable.getScene().getWindow() : null,
                "Import Legacy Bills"
        );
        progressDialog.show();

        Task<ImportResult> importTask = new Task<>() {
            @Override
            protected ImportResult call() throws Exception {
                AuthContext.setCurrentUser(currentUser);
                try {
                    List<LegacySale> records = parseLegacySalesFromCsv(file.toPath(), file.getName());
                    progressDialog.setTotalRecords(records.size());

                    int processed = 0;
                    int imported = 0;
                    int skipped = 0;
                    for (LegacySale record : records) {
                        processed++;
                        try {
                            boolean saved = salesService.upsertLegacySale(record);
                            if (saved) {
                                imported++;
                            } else {
                                skipped++;
                            }
                        } catch (Exception ex) {
                            skipped++;
                        }
                        progressDialog.updateProgress(processed, imported);
                    }
                    return new ImportResult(records.size(), imported, skipped);
                } finally {
                    AuthContext.clear();
                }
            }
        };

        importTask.setOnSucceeded(event -> {
            ImportResult result = importTask.getValue();
            progressDialog.complete(result.totalRecords(), result.imported(), result.skipped());
            loadHistory();
            if (result.skipped() == 0) {
                NotificationService.success("Imported " + result.imported() + " legacy bill(s) successfully.");
            } else {
                NotificationService.warning("Imported " + result.imported() + " legacy bill(s). " + result.skipped() + " row(s) skipped.");
            }
        });

        importTask.setOnFailed(event -> {
            Throwable ex = importTask.getException();
            String message = ex != null && ex.getMessage() != null ? ex.getMessage() : "Unknown error";
            progressDialog.fail(message);
            NotificationService.error("Failed to import legacy bills: " + message);
        });

        Thread worker = new Thread(importTask, "legacy-sales-import-task");
        worker.setDaemon(true);
        worker.start();
    }

    private List<LegacySale> parseLegacySalesFromCsv(java.nio.file.Path filePath, String sourceFile) throws Exception {
        List<List<String>> rows = CsvImportUtil.readCsv(filePath);
        int headerIndex = CsvImportUtil.findHeaderRowIndex(rows, "Bill Date", "Bill Number", "Net amount");
        if (headerIndex < 0) {
            throw new IllegalArgumentException("Could not find legacy bill headers in CSV.");
        }

        Map<String, Integer> headers = CsvImportUtil.buildHeaderIndex(rows.get(headerIndex));
        Map<String, PaymentMethod> paymentMethodsByCanonicalName = new HashMap<>();
        for (PaymentMethod method : salesService.getPaymentMethods()) {
            if (method == null || method.name() == null || method.name().isBlank()) {
                continue;
            }
            paymentMethodsByCanonicalName.put(canonicalPaymentKey(method.name()), method);
            if (method.code() != null && !method.code().isBlank()) {
                paymentMethodsByCanonicalName.putIfAbsent(canonicalPaymentKey(method.code()), method);
            }
        }

        List<LegacySale> sales = new ArrayList<>();

        for (int i = headerIndex + 1; i < rows.size(); i++) {
            List<String> row = rows.get(i);
            if (CsvImportUtil.isRowEmpty(row)) {
                continue;
            }

            String billNumber = CsvImportUtil.emptyToNull(CsvImportUtil.getValue(row, headers, "Bill Number"));
            if (billNumber == null || "Grand Total".equalsIgnoreCase(billNumber)) {
                continue;
            }

            String billDate = CsvImportUtil.emptyToNull(CsvImportUtil.getValue(row, headers, "Bill Date"));
            String billTime = CsvImportUtil.emptyToNull(CsvImportUtil.getValue(row, headers, "Bill Time"));
            if (billDate == null) {
                continue;
            }

            LocalDate parsedDate = parseCsvDate(billDate);
            LocalTime parsedTime = parseCsvTime(billTime);
            LocalDateTime localDateTime = LocalDateTime.of(parsedDate, parsedTime);
            LocalDateTime utcDateTime = TimeUtil.toUTC(localDateTime);

            BigDecimal netAmount = CsvImportUtil.parseDecimal(
                    CsvImportUtil.getValue(row, headers, "Net amount", "Net Amount"),
                    BigDecimal.ZERO
            );
            if (netAmount.compareTo(BigDecimal.ZERO) < 0) {
                netAmount = BigDecimal.ZERO;
            }

            String paymentMethodName = inferLegacyPaymentMethodName(billNumber);
            Long paymentMethodId = resolvePaymentMethodId(paymentMethodName, paymentMethodsByCanonicalName);

            sales.add(new LegacySale(
                    billNumber,
                    utcDateTime,
                    CsvImportUtil.emptyToNull(CsvImportUtil.getValue(row, headers, "Customer Code")),
                    CsvImportUtil.emptyToNull(CsvImportUtil.getValue(row, headers, "Customer Name")),
                    netAmount,
                    paymentMethodId,
                    paymentMethodName,
                    sourceFile
            ));
        }
        return sales;
    }

    private String inferLegacyPaymentMethodName(String billNumber) {
        if (billNumber == null || billNumber.isBlank()) {
            return "Legacy Import";
        }
        char prefix = Character.toUpperCase(billNumber.trim().charAt(0));
        return switch (prefix) {
            case 'C', 'X' -> "Cash";
            case 'K' -> "Debit Card";
            default -> "Legacy Import";
        };
    }

    private Long resolvePaymentMethodId(String paymentMethodName, Map<String, PaymentMethod> paymentMethodsByCanonicalName) {
        if (paymentMethodName == null || paymentMethodName.isBlank() || paymentMethodsByCanonicalName.isEmpty()) {
            return null;
        }
        PaymentMethod method = paymentMethodsByCanonicalName.get(canonicalPaymentKey(paymentMethodName));
        return method != null ? method.id() : null;
    }

    private String canonicalPaymentKey(String value) {
        if (value == null) {
            return "";
        }
        return value
                .trim()
                .toLowerCase(Locale.ENGLISH)
                .replace('_', ' ')
                .replaceAll("\\s+", " ");
    }

    private LocalDate parseCsvDate(String rawDate) {
        try {
            return LocalDate.parse(rawDate.trim(), CSV_DATE_MDY);
        } catch (DateTimeParseException ex) {
            return LocalDate.parse(rawDate.trim(), CSV_DATE_DMY);
        }
    }

    private LocalTime parseCsvTime(String rawTime) {
        if (rawTime == null || rawTime.isBlank()) {
            return LocalTime.MIDNIGHT;
        }
        return LocalTime.parse(rawTime.trim().toUpperCase(Locale.ENGLISH), CSV_TIME);
    }

    private boolean isLegacySale(Sale sale) {
        if (sale == null) {
            return false;
        }
        return "legacy".equalsIgnoreCase(sale.status()) || (sale.id() != null && sale.id() < 0);
    }

    private void showLegacySummary(Sale sale) {
        Alert alert = new Alert(Alert.AlertType.INFORMATION);
        DialogStyler.apply(alert);
        alert.setTitle("Legacy Bill Summary");
        alert.setHeaderText(null); // Custom header inside content for better control

        // Create a custom layout for better readability
        VBox content = new VBox(15);
        content.setPadding(new Insets(10, 20, 10, 20));
        content.setMinWidth(420);

        // Header Section
        VBox header = new VBox(5);
        Label titleLabel = new Label("Invoice #" + (sale.invoiceNumber() != null ? sale.invoiceNumber() : "-"));
        titleLabel.setStyle("-fx-font-size: 20px; -fx-font-weight: 800; -fx-text-fill: -color-primary-dark;");
        Label subTitle = new Label("Legacy Row Summary");
        subTitle.setStyle("-fx-font-size: 13px; -fx-text-fill: -color-text-muted; -fx-font-weight: 600; -fx-text-transform: uppercase;");
        header.getChildren().addAll(subTitle, titleLabel);

        // Data Grid
        GridPane grid = new GridPane();
        grid.setHgap(20);
        grid.setVgap(12);
        grid.setPadding(new Insets(10, 0, 10, 0));
        
        ColumnConstraints col1 = new ColumnConstraints();
        col1.setMinWidth(140);
        col1.setPrefWidth(140);
        ColumnConstraints col2 = new ColumnConstraints();
        col2.setHgrow(Priority.ALWAYS);
        grid.getColumnConstraints().addAll(col1, col2);

        addSummaryRow(grid, 0, "👤 Customer", sale.customerName() != null && !sale.customerName().isBlank() ? sale.customerName() : "Walk-in Customer");
        addSummaryRow(grid, 1, "📅 Date & Time", sale.saleDate() != null ? TimeUtil.formatStandard(TimeUtil.toLocal(sale.saleDate())) : "-");
        addSummaryRow(grid, 2, "💰 Net Amount", sale.totalAmount() != null ? CURRENCY_FORMAT.format(sale.totalAmount()) : "$0.00");
        addSummaryRow(grid, 3, "💳 Payment", sale.paymentMethodName() != null ? sale.paymentMethodName() : "Unknown");

        // Footer / Info Section
        VBox footer = new VBox(8);
        footer.setPadding(new Insets(15, 12, 12, 12));
        footer.setStyle("-fx-background-color: -color-info-bg; -fx-background-radius: 8; -fx-border-color: -color-info; -fx-border-width: 0 0 0 4;");
        
        Label infoIcon = new Label("ℹ Note");
        infoIcon.setStyle("-fx-font-weight: 800; -fx-text-fill: -color-info-text; -fx-font-size: 13px;");
        
        Label infoText = new Label("This data was imported from a legacy Serieswise CSV. "
                + "Individual line-item details (products/quantities) are not available for this record.");
        infoText.setWrapText(true);
        infoText.setStyle("-fx-text-fill: -color-info-text; -fx-font-size: 13px; -fx-line-spacing: 1.2;");
        
        footer.getChildren().addAll(infoIcon, infoText);

        content.getChildren().addAll(header, new Separator(), grid, footer);
        alert.getDialogPane().setContent(content);
        
        // Remove standard text to avoid duplication
        alert.setContentText(null);
        alert.setGraphic(null);

        alert.showAndWait();
    }

    private void addSummaryRow(GridPane grid, int row, String label, String value) {
        Label keyLabel = new Label(label);
        keyLabel.setStyle("-fx-font-weight: 700; -fx-text-fill: -color-text-secondary; -fx-font-size: 14px;");
        keyLabel.setMinWidth(Region.USE_PREF_SIZE);
        
        Label valLabel = new Label(value);
        valLabel.setStyle("-fx-font-weight: 600; -fx-text-fill: -color-text-main; -fx-font-size: 14px;");
        valLabel.setWrapText(true);

        grid.add(keyLabel, 0, row);
        grid.add(valLabel, 1, row);
    }

    private record ImportResult(int totalRecords, int imported, int skipped) {}
}
