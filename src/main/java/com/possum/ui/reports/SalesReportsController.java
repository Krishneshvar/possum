package com.possum.ui.reports;

import com.possum.application.reports.ReportsService;
import com.possum.application.reports.dto.BreakdownItem;
import com.possum.application.sales.SalesService;
import com.possum.ui.common.controls.DataTableView;
import com.possum.ui.common.controls.MultiSelectFilter;
import javafx.collections.FXCollections;
import javafx.collections.ListChangeListener;
import javafx.fxml.FXML;
import javafx.geometry.Pos;
import javafx.scene.control.*;
import javafx.scene.layout.VBox;
import javafx.stage.FileChooser;
import javafx.util.Callback;
import javafx.beans.property.SimpleStringProperty;
import javafx.beans.property.SimpleObjectProperty;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

public class SalesReportsController {

    @FXML private ComboBox<String> reportTypeCombo;
    @FXML private DatePicker startDatePicker;
    @FXML private DatePicker endDatePicker;
    @FXML private ComboBox<String> amountFilterColCombo;
    @FXML private TextField minAmountField;
    @FXML private TextField maxAmountField;
    @FXML private DataTableView<BreakdownItem> breakdownTable;
    
    private TableColumn<BreakdownItem, String> periodCol;
    private TableColumn<BreakdownItem, Integer> transactionsCol;
    private TableColumn<BreakdownItem, BigDecimal> salesCol;
    private TableColumn<BreakdownItem, BigDecimal> cashCol;
    private TableColumn<BreakdownItem, BigDecimal> upiCol;
    private TableColumn<BreakdownItem, BigDecimal> debitCardCol;
    private TableColumn<BreakdownItem, BigDecimal> creditCardCol;
    private TableColumn<BreakdownItem, BigDecimal> giftCardCol;
    private TableColumn<BreakdownItem, BigDecimal> refundsCol;
    private TableColumn<BreakdownItem, BigDecimal> netSalesCol;

    @FXML private VBox columnFilterContainer;
    private MultiSelectFilter<TableColumn<BreakdownItem, ?>> columnFilter;

    @FXML private Label totalLabel;
    @FXML private Label totalTransactionsLabel;
    @FXML private Label totalCashLabel;
    @FXML private Label totalUpiLabel;
    @FXML private Label totalDebitLabel;
    @FXML private Label totalCreditLabel;
    @FXML private Label totalGiftLabel;
    @FXML private Label totalSalesLabel;
    @FXML private Label totalRefundsLabel;
    @FXML private Label totalNetSalesLabel;

    private final ReportsService reportsService;
    private final NumberFormat currencyFormat = NumberFormat.getCurrencyInstance(Locale.US);

    public SalesReportsController(ReportsService reportsService, SalesService salesService) {
        this.reportsService = reportsService;
    }

    @FXML
    public void handleExportCsv() {
        exportData(".csv");
    }

    @FXML
    public void handleExportExcel() {
        exportData(".xlsx");
    }

    private void exportData(String extension) {
        FileChooser fileChooser = new FileChooser();
        fileChooser.setTitle("Export Sales Report");
        fileChooser.setInitialFileName("sales_report_" + LocalDate.now() + extension);
        fileChooser.getExtensionFilters().add(new FileChooser.ExtensionFilter(
            extension.equals(".csv") ? "CSV Files" : "Excel Files", "*" + extension));

        java.io.File file = fileChooser.showSaveDialog(breakdownTable.getScene().getWindow());
        if (file == null) return;

        List<BreakdownItem> items = breakdownTable.getTableView().getItems();
        
        try {
            if (extension.equals(".csv")) {
                writeCsv(file, items);
            } else {
                writeExcel(file, items);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void writeCsv(java.io.File file, List<BreakdownItem> items) throws java.io.IOException {
        try (java.io.PrintWriter writer = new java.io.PrintWriter(new java.io.FileWriter(file))) {
            writer.println("Period,Transactions,Cash,UPI,Debit Card,Credit Card,Gift Card,Gross Sales,Refunds,Net Sales");
            for (BreakdownItem item : items) {
                if (item == null) continue;
                writer.printf("%s,%d,%.2f,%.2f,%.2f,%.2f,%.2f,%.2f,%.2f,%.2f%n",
                    item.name(), item.totalTransactions(), 
                    cashCol.isVisible() ? item.cash() : BigDecimal.ZERO,
                    upiCol.isVisible() ? item.upi() : BigDecimal.ZERO,
                    debitCardCol.isVisible() ? item.debitCard() : BigDecimal.ZERO,
                    creditCardCol.isVisible() ? item.creditCard() : BigDecimal.ZERO,
                    giftCardCol.isVisible() ? item.giftCard() : BigDecimal.ZERO,
                    calculateDynamicGrossSales(item),
                    item.refunds(),
                    calculateDynamicNetSales(item));
            }
        }
    }

    private void writeExcel(java.io.File file, List<BreakdownItem> items) throws java.io.IOException {
        try (org.apache.poi.xssf.usermodel.XSSFWorkbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook()) {
            org.apache.poi.ss.usermodel.Sheet sheet = workbook.createSheet("Sales Report");
            org.apache.poi.ss.usermodel.Row headerRow = sheet.createRow(0);
            String[] headers = {"Period", "Transactions", "Cash", "UPI", "Debit Card", "Credit Card", "Gift Card", "Gross Sales", "Refunds", "Net Sales"};
            for (int i = 0; i < headers.length; i++) {
                headerRow.createCell(i).setCellValue(headers[i]);
            }
            int rowIdx = 1;
            for (BreakdownItem item : items) {
                if (item == null) continue;
                org.apache.poi.ss.usermodel.Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(item.name());
                row.createCell(1).setCellValue(item.totalTransactions());
                row.createCell(2).setCellValue((cashCol.isVisible() ? item.cash() : BigDecimal.ZERO).doubleValue());
                row.createCell(3).setCellValue((upiCol.isVisible() ? item.upi() : BigDecimal.ZERO).doubleValue());
                row.createCell(4).setCellValue((debitCardCol.isVisible() ? item.debitCard() : BigDecimal.ZERO).doubleValue());
                row.createCell(5).setCellValue((creditCardCol.isVisible() ? item.creditCard() : BigDecimal.ZERO).doubleValue());
                row.createCell(6).setCellValue((giftCardCol.isVisible() ? item.giftCard() : BigDecimal.ZERO).doubleValue());
                row.createCell(7).setCellValue(calculateDynamicGrossSales(item).doubleValue());
                row.createCell(8).setCellValue((refundsCol.isVisible() ? item.refunds() : BigDecimal.ZERO).doubleValue());
                row.createCell(9).setCellValue(calculateDynamicNetSales(item).doubleValue());
            }
            try (java.io.FileOutputStream fileOut = new java.io.FileOutputStream(file)) {
                workbook.write(fileOut);
            }
        }
    }

    @FXML
    public void initialize() {
        setupFilters();
        setupTable();
        setupColumnFilter();
        bindTotalsToTable();
        handleRefresh();
    }

    private void setupFilters() {
        reportTypeCombo.setItems(FXCollections.observableArrayList("Daily", "Monthly", "Yearly"));
        reportTypeCombo.setValue("Daily");

        startDatePicker.setValue(LocalDate.now().withDayOfMonth(1));
        endDatePicker.setValue(LocalDate.now());

        amountFilterColCombo.setItems(FXCollections.observableArrayList(
            "None", "Transactions", "Cash", "UPI", "Debit Card", "Credit Card", "Gift Card", "Gross Sales", "Refunds", "Net Sales"
        ));
        amountFilterColCombo.setValue("None");

        minAmountField.textProperty().addListener((obs, oldVal, newVal) -> handleRefresh());
        maxAmountField.textProperty().addListener((obs, oldVal, newVal) -> handleRefresh());
        amountFilterColCombo.setOnAction(e -> handleRefresh());
    }

    private void setupTable() {
        periodCol = new TableColumn<>("Date");
        transactionsCol = new TableColumn<>("Transactions");
        cashCol = new TableColumn<>("Cash");
        upiCol = new TableColumn<>("UPI");
        debitCardCol = new TableColumn<>("Debit Card");
        creditCardCol = new TableColumn<>("Credit Card");
        giftCardCol = new TableColumn<>("Gift Card");
        salesCol = new TableColumn<>("Gross Sales");
        refundsCol = new TableColumn<>("Refunds");
        netSalesCol = new TableColumn<>("Net Sales");

        breakdownTable.getTableView().getColumns().setAll(
            periodCol, transactionsCol, cashCol, upiCol, debitCardCol, 
            creditCardCol, giftCardCol, salesCol, refundsCol, netSalesCol
        );
        
        breakdownTable.setEmptyMessage("No analytics records found");
        breakdownTable.setEmptySubtitle("Try adjusting your date range or filter criteria.");

        periodCol.setCellValueFactory(cellData -> new SimpleStringProperty(cellData.getValue().name()));
        transactionsCol.setCellValueFactory(cellData -> new SimpleObjectProperty<>(cellData.getValue().totalTransactions()));
        cashCol.setCellValueFactory(cellData -> new SimpleObjectProperty<>(cellData.getValue().cash()));
        upiCol.setCellValueFactory(cellData -> new SimpleObjectProperty<>(cellData.getValue().upi()));
        debitCardCol.setCellValueFactory(cellData -> new SimpleObjectProperty<>(cellData.getValue().debitCard()));
        creditCardCol.setCellValueFactory(cellData -> new SimpleObjectProperty<>(cellData.getValue().creditCard()));
        giftCardCol.setCellValueFactory(cellData -> new SimpleObjectProperty<>(cellData.getValue().giftCard()));
        salesCol.setCellValueFactory(cellData -> new SimpleObjectProperty<>(calculateDynamicGrossSales(cellData.getValue())));
        refundsCol.setCellValueFactory(cellData -> new SimpleObjectProperty<>(cellData.getValue().refunds()));
        netSalesCol.setCellValueFactory(cellData -> new SimpleObjectProperty<>(calculateDynamicNetSales(cellData.getValue())));
        
        Callback<TableColumn<BreakdownItem, BigDecimal>, TableCell<BreakdownItem, BigDecimal>> currencyCellFactory = column -> new TableCell<>() {
            @Override
            protected void updateItem(BigDecimal item, boolean empty) {
                super.updateItem(item, empty);
                setText(empty || item == null ? "" : currencyFormat.format(item));
            }
        };

        cashCol.setCellFactory(currencyCellFactory);
        upiCol.setCellFactory(currencyCellFactory);
        debitCardCol.setCellFactory(currencyCellFactory);
        creditCardCol.setCellFactory(currencyCellFactory);
        giftCardCol.setCellFactory(currencyCellFactory);
        salesCol.setCellFactory(currencyCellFactory);
        refundsCol.setCellFactory(currencyCellFactory);
        
        netSalesCol.setCellFactory(column -> new TableCell<>() {
            @Override
            protected void updateItem(BigDecimal item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || item == null) {
                    setText("");
                    setStyle("");
                } else {
                    setText(currencyFormat.format(item));
                    setStyle("-fx-font-weight: 800; -fx-text-fill: #0891b2; -fx-font-size: 13px;");
                }
            }
        });

        transactionsCol.setStyle("-fx-alignment: CENTER;");
        cashCol.setStyle("-fx-alignment: CENTER-RIGHT;");
        upiCol.setStyle("-fx-alignment: CENTER-RIGHT;");
        debitCardCol.setStyle("-fx-alignment: CENTER-RIGHT;");
        creditCardCol.setStyle("-fx-alignment: CENTER-RIGHT;");
        giftCardCol.setStyle("-fx-alignment: CENTER-RIGHT;");
        salesCol.setStyle("-fx-alignment: CENTER-RIGHT;");
        refundsCol.setStyle("-fx-alignment: CENTER-RIGHT;");
        netSalesCol.setStyle("-fx-alignment: CENTER-RIGHT;");

        periodCol.setPrefWidth(150);
        transactionsCol.setPrefWidth(100);
        cashCol.setPrefWidth(100);
        upiCol.setPrefWidth(100);
        debitCardCol.setPrefWidth(100);
        creditCardCol.setPrefWidth(100);
        giftCardCol.setPrefWidth(100);
        salesCol.setPrefWidth(120);
        refundsCol.setPrefWidth(100);
        netSalesCol.setPrefWidth(120);
    }

    private void setupColumnFilter() {
        List<TableColumn<BreakdownItem, ?>> columns = List.of(
            periodCol, transactionsCol, cashCol, upiCol, debitCardCol, creditCardCol, 
            giftCardCol, salesCol, refundsCol, netSalesCol
        );
        
        columnFilter = new MultiSelectFilter<>(
            "All Columns",
            TableColumn::getText
        );
        columnFilter.setItems(columns);
        columnFilter.setPrefWidth(160);
        columnFilter.selectItems(columns);
        
        columnFilter.getSelectedItems().addListener((ListChangeListener<TableColumn<BreakdownItem, ?>>) c -> {
            List<TableColumn<BreakdownItem, ?>> selected = columnFilter.getSelectedItems();
            for (TableColumn<BreakdownItem, ?> col : columns) {
                col.setVisible(selected.contains(col));
            }
            breakdownTable.getTableView().refresh();
            calculateTotals(breakdownTable.getItems());
        });
        
        columnFilterContainer.getChildren().add(columnFilter);
        
        totalLabel.visibleProperty().bind(periodCol.visibleProperty());
        totalLabel.managedProperty().bind(periodCol.visibleProperty());
        totalTransactionsLabel.visibleProperty().bind(transactionsCol.visibleProperty());
        totalTransactionsLabel.managedProperty().bind(transactionsCol.visibleProperty());
        totalCashLabel.visibleProperty().bind(cashCol.visibleProperty());
        totalCashLabel.managedProperty().bind(cashCol.visibleProperty());
        totalUpiLabel.visibleProperty().bind(upiCol.visibleProperty());
        totalUpiLabel.managedProperty().bind(upiCol.visibleProperty());
        totalDebitLabel.visibleProperty().bind(debitCardCol.visibleProperty());
        totalDebitLabel.managedProperty().bind(debitCardCol.visibleProperty());
        totalCreditLabel.visibleProperty().bind(creditCardCol.visibleProperty());
        totalCreditLabel.managedProperty().bind(creditCardCol.visibleProperty());
        totalGiftLabel.visibleProperty().bind(giftCardCol.visibleProperty());
        totalGiftLabel.managedProperty().bind(giftCardCol.visibleProperty());
        totalSalesLabel.visibleProperty().bind(salesCol.visibleProperty());
        totalSalesLabel.managedProperty().bind(salesCol.visibleProperty());
        totalRefundsLabel.visibleProperty().bind(refundsCol.visibleProperty());
        totalRefundsLabel.managedProperty().bind(refundsCol.visibleProperty());
        totalNetSalesLabel.visibleProperty().bind(netSalesCol.visibleProperty());
        totalNetSalesLabel.managedProperty().bind(netSalesCol.visibleProperty());
    }

    private void bindTotalsToTable() {
        totalLabel.prefWidthProperty().bind(periodCol.widthProperty());
        totalTransactionsLabel.prefWidthProperty().bind(transactionsCol.widthProperty());
        totalCashLabel.prefWidthProperty().bind(cashCol.widthProperty());
        totalUpiLabel.prefWidthProperty().bind(upiCol.widthProperty());
        totalDebitLabel.prefWidthProperty().bind(debitCardCol.widthProperty());
        totalCreditLabel.prefWidthProperty().bind(creditCardCol.widthProperty());
        totalGiftLabel.prefWidthProperty().bind(giftCardCol.widthProperty());
        totalSalesLabel.prefWidthProperty().bind(salesCol.widthProperty());
        totalRefundsLabel.prefWidthProperty().bind(refundsCol.widthProperty());
        totalNetSalesLabel.prefWidthProperty().bind(netSalesCol.widthProperty());

        totalTransactionsLabel.setAlignment(Pos.CENTER);
        totalCashLabel.setAlignment(Pos.CENTER_RIGHT);
        totalUpiLabel.setAlignment(Pos.CENTER_RIGHT);
        totalDebitLabel.setAlignment(Pos.CENTER_RIGHT);
        totalCreditLabel.setAlignment(Pos.CENTER_RIGHT);
        totalGiftLabel.setAlignment(Pos.CENTER_RIGHT);
        totalSalesLabel.setAlignment(Pos.CENTER_RIGHT);
        totalRefundsLabel.setAlignment(Pos.CENTER_RIGHT);
        totalNetSalesLabel.setAlignment(Pos.CENTER_RIGHT);
    }

    @FXML
    public void handleRefresh() {
        loadData();
    }

    @FXML
    public void handleReportTypeChange() {
        loadData();
    }

    @FXML
    public void handleDateChange() {
        loadData();
    }

    @FXML
    public void handleReset() {
        reportTypeCombo.setValue("Daily");
        startDatePicker.setValue(LocalDate.now().withDayOfMonth(1));
        endDatePicker.setValue(LocalDate.now());
        amountFilterColCombo.setValue("None");
        minAmountField.clear();
        maxAmountField.clear();
        loadData();
    }

    private void loadData() {
        String reportType = reportTypeCombo.getValue().toLowerCase();
        LocalDate startDate = startDatePicker.getValue();
        LocalDate endDate = endDatePicker.getValue();

        if (startDate == null || endDate == null) return;

        List<BreakdownItem> breakdown;
        if ("daily".equals(reportType)) {
            breakdown = reportsService.getSalesAnalytics(startDate, endDate, null).breakdown();
        } else if ("monthly".equals(reportType)) {
            breakdown = reportsService.getMonthlyReport(startDate, endDate, null).breakdown();
        } else {
            breakdown = reportsService.getYearlyReport(startDate, endDate, null).breakdown();
        }

        String filteredCol = amountFilterColCombo.getValue();
        if (filteredCol != null && !"None".equals(filteredCol)) {
            final BigDecimal min = parseAmount(minAmountField.getText(), null);
            final BigDecimal max = parseAmount(maxAmountField.getText(), null);

            breakdown = breakdown.stream()
                .filter(item -> {
                    BigDecimal val = getFieldValue(item, filteredCol);
                    if (val == null) val = BigDecimal.ZERO;
                    
                    boolean matchesMin = (min == null || val.compareTo(min) >= 0);
                    boolean matchesMax = (max == null || val.compareTo(max) <= 0);
                    
                    return matchesMin && matchesMax;
                })
                .collect(Collectors.toList());
        }

        breakdownTable.getTableView().setItems(FXCollections.observableArrayList(breakdown));
        calculateTotals(breakdown);
    }

    private BigDecimal parseAmount(String text, BigDecimal defaultValue) {
        if (text == null || text.trim().isEmpty()) return defaultValue;
        try {
            return new BigDecimal(text.trim());
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }

    private BigDecimal getFieldValue(BreakdownItem item, String column) {
        return switch (column) {
            case "Transactions" -> BigDecimal.valueOf(item.totalTransactions());
            case "Cash" -> item.cash();
            case "UPI" -> item.upi();
            case "Debit Card" -> item.debitCard();
            case "Credit Card" -> item.creditCard();
            case "Gift Card" -> item.giftCard();
            case "Gross Sales" -> item.totalSales();
            case "Refunds" -> item.refunds();
            case "Net Sales" -> item.getNetSales();
            default -> BigDecimal.ZERO;
        };
    }

    private BigDecimal calculateDynamicGrossSales(BreakdownItem item) {
        if (item == null) return BigDecimal.ZERO;
        BigDecimal gross = BigDecimal.ZERO;
        if (cashCol.isVisible() && item.cash() != null) gross = gross.add(item.cash());
        if (upiCol.isVisible() && item.upi() != null) gross = gross.add(item.upi());
        if (debitCardCol.isVisible() && item.debitCard() != null) gross = gross.add(item.debitCard());
        if (creditCardCol.isVisible() && item.creditCard() != null) gross = gross.add(item.creditCard());
        if (giftCardCol.isVisible() && item.giftCard() != null) gross = gross.add(item.giftCard());
        return gross;
    }

    private BigDecimal calculateDynamicNetSales(BreakdownItem item) {
        if (item == null) return BigDecimal.ZERO;
        BigDecimal gross = calculateDynamicGrossSales(item);
        BigDecimal deductions = BigDecimal.ZERO;
        if (refundsCol.isVisible() && item.refunds() != null) deductions = deductions.add(item.refunds());
        return gross.subtract(deductions);
    }

    private void calculateTotals(List<BreakdownItem> items) {
        int totalTransactions = 0;
        BigDecimal cash = BigDecimal.ZERO;
        BigDecimal upi = BigDecimal.ZERO;
        BigDecimal debit = BigDecimal.ZERO;
        BigDecimal credit = BigDecimal.ZERO;
        BigDecimal gift = BigDecimal.ZERO;
        BigDecimal totalSalesSum = BigDecimal.ZERO;
        BigDecimal totalRefundsSum = BigDecimal.ZERO;
        BigDecimal totalNetSalesSum = BigDecimal.ZERO;

        for (BreakdownItem item : items) {
            if (item == null) continue;
            if (transactionsCol.isVisible()) totalTransactions += item.totalTransactions();
            if (cashCol.isVisible()) cash = cash.add(item.cash() != null ? item.cash() : BigDecimal.ZERO);
            if (upiCol.isVisible()) upi = upi.add(item.upi() != null ? item.upi() : BigDecimal.ZERO);
            if (debitCardCol.isVisible()) debit = debit.add(item.debitCard() != null ? item.debitCard() : BigDecimal.ZERO);
            if (creditCardCol.isVisible()) credit = credit.add(item.creditCard() != null ? item.creditCard() : BigDecimal.ZERO);
            if (giftCardCol.isVisible()) gift = gift.add(item.giftCard() != null ? item.giftCard() : BigDecimal.ZERO);
            
            totalSalesSum = totalSalesSum.add(calculateDynamicGrossSales(item));
            if (refundsCol.isVisible()) totalRefundsSum = totalRefundsSum.add(item.refunds() != null ? item.refunds() : BigDecimal.ZERO);
            totalNetSalesSum = totalNetSalesSum.add(calculateDynamicNetSales(item));
        }

        totalTransactionsLabel.setText(String.valueOf(totalTransactions));
        totalCashLabel.setText(currencyFormat.format(cash));
        totalUpiLabel.setText(currencyFormat.format(upi));
        totalDebitLabel.setText(currencyFormat.format(debit));
        totalCreditLabel.setText(currencyFormat.format(credit));
        totalGiftLabel.setText(currencyFormat.format(gift));
        totalSalesLabel.setText(currencyFormat.format(totalSalesSum));
        totalRefundsLabel.setText(currencyFormat.format(totalRefundsSum));
        totalNetSalesLabel.setText(currencyFormat.format(totalNetSalesSum));
    }
}
