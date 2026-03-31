package com.possum.ui.reports;

import com.possum.application.reports.ReportsService;
import com.possum.application.reports.dto.BreakdownItem;
import com.possum.application.sales.SalesService;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.fxml.FXML;
import javafx.geometry.Pos;
import javafx.scene.control.ComboBox;
import javafx.scene.control.DatePicker;
import javafx.scene.control.Label;
import javafx.scene.control.TableColumn;
import javafx.scene.control.TableView;
import javafx.scene.control.TextField;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;

public class SalesReportsController {

    @FXML private ComboBox<String> reportTypeCombo;
    @FXML private DatePicker startDatePicker;
    @FXML private DatePicker endDatePicker;
    @FXML private ComboBox<String> amountFilterColCombo;
    @FXML private TextField minAmountField;
    @FXML private TextField maxAmountField;
    @FXML private TableView<BreakdownItem> breakdownTable;
    @FXML private TableColumn<BreakdownItem, String> periodCol;
    @FXML private TableColumn<BreakdownItem, Integer> transactionsCol;
    @FXML private TableColumn<BreakdownItem, BigDecimal> salesCol;
    @FXML private TableColumn<BreakdownItem, BigDecimal> taxCol;
    @FXML private TableColumn<BreakdownItem, BigDecimal> discountCol;
    @FXML private TableColumn<BreakdownItem, BigDecimal> cashCol;
    @FXML private TableColumn<BreakdownItem, BigDecimal> upiCol;
    @FXML private TableColumn<BreakdownItem, BigDecimal> debitCardCol;
    @FXML private TableColumn<BreakdownItem, BigDecimal> creditCardCol;
    @FXML private TableColumn<BreakdownItem, BigDecimal> giftCardCol;
    @FXML private TableColumn<BreakdownItem, BigDecimal> refundsCol;
    @FXML private TableColumn<BreakdownItem, BigDecimal> netSalesCol;

    @FXML private Label totalLabel;
    @FXML private Label totalTransactionsLabel;
    @FXML private Label totalCashLabel;
    @FXML private Label totalUpiLabel;
    @FXML private Label totalDebitLabel;
    @FXML private Label totalCreditLabel;
    @FXML private Label totalGiftLabel;
    @FXML private Label totalSalesLabel;
    @FXML private Label totalTaxLabel;
    @FXML private Label totalDiscountLabel;
    @FXML private Label totalRefundsLabel;
    @FXML private Label totalNetSalesLabel;

    private final ReportsService reportsService;
    private final NumberFormat currencyFormat = NumberFormat.getCurrencyInstance(Locale.US);

    public SalesReportsController(ReportsService reportsService, SalesService salesService) {
        this.reportsService = reportsService;
    }

    @FXML
    public void initialize() {
        setupFilters();
        setupTable();
        bindTotalsToTable();
        handleRefresh();
    }

    private void setupFilters() {
        reportTypeCombo.setItems(FXCollections.observableArrayList("Daily", "Monthly", "Yearly"));
        reportTypeCombo.setValue("Daily");

        // Initial range: This month
        startDatePicker.setValue(LocalDate.now().withDayOfMonth(1));
        endDatePicker.setValue(LocalDate.now());

        amountFilterColCombo.setItems(FXCollections.observableArrayList(
            "None", "Transactions", "Cash", "UPI", "Debit Card", "Credit Card", "Gift Card", "Gross Sales", "Total Tax", "Discounts", "Refunds", "Net Sales"
        ));
        amountFilterColCombo.setValue("None");

        // Add change listeners for real-time filtering
        minAmountField.textProperty().addListener((obs, oldVal, newVal) -> handleRefresh());
        maxAmountField.textProperty().addListener((obs, oldVal, newVal) -> handleRefresh());
        amountFilterColCombo.setOnAction(e -> handleRefresh());
    }

    private void setupTable() {
        periodCol.setCellValueFactory(cellData -> {
            if (cellData.getValue() == null) return new javafx.beans.property.SimpleStringProperty("");
            return new javafx.beans.property.SimpleStringProperty(cellData.getValue().name());
        });
        transactionsCol.setCellValueFactory(cellData -> {
            if (cellData.getValue() == null) return new javafx.beans.property.SimpleObjectProperty<>(null);
            return new javafx.beans.property.SimpleObjectProperty<>(cellData.getValue().totalTransactions());
        });
        cashCol.setCellValueFactory(cellData -> cellData.getValue() == null ? new javafx.beans.property.SimpleObjectProperty<>(null) : new javafx.beans.property.SimpleObjectProperty<>(cellData.getValue().cash()));
        upiCol.setCellValueFactory(cellData -> cellData.getValue() == null ? new javafx.beans.property.SimpleObjectProperty<>(null) : new javafx.beans.property.SimpleObjectProperty<>(cellData.getValue().upi()));
        debitCardCol.setCellValueFactory(cellData -> cellData.getValue() == null ? new javafx.beans.property.SimpleObjectProperty<>(null) : new javafx.beans.property.SimpleObjectProperty<>(cellData.getValue().debitCard()));
        creditCardCol.setCellValueFactory(cellData -> cellData.getValue() == null ? new javafx.beans.property.SimpleObjectProperty<>(null) : new javafx.beans.property.SimpleObjectProperty<>(cellData.getValue().creditCard()));
        giftCardCol.setCellValueFactory(cellData -> cellData.getValue() == null ? new javafx.beans.property.SimpleObjectProperty<>(null) : new javafx.beans.property.SimpleObjectProperty<>(cellData.getValue().giftCard()));
        salesCol.setCellValueFactory(cellData -> cellData.getValue() == null ? new javafx.beans.property.SimpleObjectProperty<>(null) : new javafx.beans.property.SimpleObjectProperty<>(cellData.getValue().totalSales()));
        taxCol.setCellValueFactory(cellData -> cellData.getValue() == null ? new javafx.beans.property.SimpleObjectProperty<>(null) : new javafx.beans.property.SimpleObjectProperty<>(cellData.getValue().totalTax()));
        discountCol.setCellValueFactory(cellData -> cellData.getValue() == null ? new javafx.beans.property.SimpleObjectProperty<>(null) : new javafx.beans.property.SimpleObjectProperty<>(cellData.getValue().totalDiscount()));
        refundsCol.setCellValueFactory(cellData -> cellData.getValue() == null ? new javafx.beans.property.SimpleObjectProperty<>(null) : new javafx.beans.property.SimpleObjectProperty<>(cellData.getValue().refunds()));
        netSalesCol.setCellValueFactory(cellData -> cellData.getValue() == null ? new javafx.beans.property.SimpleObjectProperty<>(null) : new javafx.beans.property.SimpleObjectProperty<>(cellData.getValue().getNetSales()));
        
        // Custom cell formatters for currency
        javafx.util.Callback<TableColumn<BreakdownItem, BigDecimal>, javafx.scene.control.TableCell<BreakdownItem, BigDecimal>> currencyCellFactory = column -> new javafx.scene.control.TableCell<>() {
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
        taxCol.setCellFactory(currencyCellFactory);
        discountCol.setCellFactory(currencyCellFactory);
        refundsCol.setCellFactory(currencyCellFactory);
        
        netSalesCol.setCellFactory(column -> new javafx.scene.control.TableCell<>() {
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

        // Row factory for highlighting and 'spacing' feel
        breakdownTable.setRowFactory(tv -> new javafx.scene.control.TableRow<>() {
            @Override
            protected void updateItem(BreakdownItem item, boolean empty) {
                super.updateItem(item, empty);
                if (item == null || empty) {
                    setStyle("-fx-background-color: transparent; -fx-border-color: transparent;");
                    setPrefHeight(30); // Visual gap height
                } else {
                    setStyle("-fx-background-color: white;");
                    setPrefHeight(45);
                }
            }
        });
    }

    private void bindTotalsToTable() {
        // Bind widths
        totalLabel.prefWidthProperty().bind(periodCol.widthProperty());
        totalTransactionsLabel.prefWidthProperty().bind(transactionsCol.widthProperty());
        totalCashLabel.prefWidthProperty().bind(cashCol.widthProperty());
        totalUpiLabel.prefWidthProperty().bind(upiCol.widthProperty());
        totalDebitLabel.prefWidthProperty().bind(debitCardCol.widthProperty());
        totalCreditLabel.prefWidthProperty().bind(creditCardCol.widthProperty());
        totalGiftLabel.prefWidthProperty().bind(giftCardCol.widthProperty());
        totalSalesLabel.prefWidthProperty().bind(salesCol.widthProperty());
        totalTaxLabel.prefWidthProperty().bind(taxCol.widthProperty());
        totalDiscountLabel.prefWidthProperty().bind(discountCol.widthProperty());
        totalRefundsLabel.prefWidthProperty().bind(refundsCol.widthProperty());
        totalNetSalesLabel.prefWidthProperty().bind(netSalesCol.widthProperty());

        // Helper to bind alignment since TableColumn alignment is a style-based or complicated thing to get natively sometimes
        // But we can set the labels to match the preferred alignment of the standard columns
        totalTransactionsLabel.setAlignment(Pos.CENTER);
        totalCashLabel.setAlignment(Pos.CENTER_RIGHT);
        totalUpiLabel.setAlignment(Pos.CENTER_RIGHT);
        totalDebitLabel.setAlignment(Pos.CENTER_RIGHT);
        totalCreditLabel.setAlignment(Pos.CENTER_RIGHT);
        totalGiftLabel.setAlignment(Pos.CENTER_RIGHT);
        totalSalesLabel.setAlignment(Pos.CENTER_RIGHT);
        totalTaxLabel.setAlignment(Pos.CENTER_RIGHT);
        totalDiscountLabel.setAlignment(Pos.CENTER_RIGHT);
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

        // Apply column-based price/amount range filtering
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
                .collect(java.util.stream.Collectors.toList());
        }

        // Add 1 row space (dummy item) between all real reports
        ObservableList<BreakdownItem> displayItems = FXCollections.observableArrayList();
        for (int i = 0; i < breakdown.size(); i++) {
            displayItems.add(breakdown.get(i));
            if (i < breakdown.size() - 1) {
                displayItems.add(null); // This null item represents the 'space'
            }
        }

        breakdownTable.setItems(displayItems);
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
            case "Total Tax" -> item.totalTax();
            case "Discounts" -> item.totalDiscount();
            case "Refunds" -> item.refunds();
            case "Net Sales" -> item.getNetSales();
            default -> BigDecimal.ZERO;
        };
    }

    private void calculateTotals(List<BreakdownItem> items) {
        int totalTransactions = 0;
        BigDecimal cash = BigDecimal.ZERO;
        BigDecimal upi = BigDecimal.ZERO;
        BigDecimal debit = BigDecimal.ZERO;
        BigDecimal credit = BigDecimal.ZERO;
        BigDecimal gift = BigDecimal.ZERO;
        BigDecimal totalSales = BigDecimal.ZERO;
        BigDecimal totalTax = BigDecimal.ZERO;
        BigDecimal totalDiscount = BigDecimal.ZERO;
        BigDecimal refunds = BigDecimal.ZERO;
        BigDecimal netSales = BigDecimal.ZERO;

        for (BreakdownItem item : items) {
            totalTransactions += item.totalTransactions();
            cash = cash.add(item.cash() != null ? item.cash() : BigDecimal.ZERO);
            upi = upi.add(item.upi() != null ? item.upi() : BigDecimal.ZERO);
            debit = debit.add(item.debitCard() != null ? item.debitCard() : BigDecimal.ZERO);
            credit = credit.add(item.creditCard() != null ? item.creditCard() : BigDecimal.ZERO);
            gift = gift.add(item.giftCard() != null ? item.giftCard() : BigDecimal.ZERO);
            totalSales = totalSales.add(item.totalSales() != null ? item.totalSales() : BigDecimal.ZERO);
            totalTax = totalTax.add(item.totalTax() != null ? item.totalTax() : BigDecimal.ZERO);
            totalDiscount = totalDiscount.add(item.totalDiscount() != null ? item.totalDiscount() : BigDecimal.ZERO);
            refunds = refunds.add(item.refunds() != null ? item.refunds() : BigDecimal.ZERO);
            netSales = netSales.add(item.getNetSales() != null ? item.getNetSales() : BigDecimal.ZERO);
        }

        totalTransactionsLabel.setText(String.valueOf(totalTransactions));
        totalCashLabel.setText(currencyFormat.format(cash));
        totalUpiLabel.setText(currencyFormat.format(upi));
        totalDebitLabel.setText(currencyFormat.format(debit));
        totalCreditLabel.setText(currencyFormat.format(credit));
        totalGiftLabel.setText(currencyFormat.format(gift));
        totalSalesLabel.setText(currencyFormat.format(totalSales));
        totalTaxLabel.setText(currencyFormat.format(totalTax));
        totalDiscountLabel.setText(currencyFormat.format(totalDiscount));
        totalRefundsLabel.setText(currencyFormat.format(refunds));
        totalNetSalesLabel.setText(currencyFormat.format(netSales));
    }
}
