package com.possum.ui.reports;

import com.possum.application.inventory.InventoryService;
import com.possum.application.reports.ReportsService;
import com.possum.application.reports.dto.BreakdownItem;
import com.possum.application.sales.SalesService;
import com.possum.ui.common.controls.NotificationService;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.fxml.FXML;
import javafx.scene.control.ComboBox;
import javafx.scene.control.TableColumn;
import javafx.scene.control.TableView;
import javafx.scene.control.cell.PropertyValueFactory;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;

public class SalesReportsController {

    @FXML private ComboBox<String> dateRangeCombo;
    @FXML private ComboBox<String> reportTypeCombo;
    @FXML private ComboBox<String> paymentMethodCombo;
    @FXML private TableView<BreakdownItem> breakdownTable;
    @FXML private TableColumn<BreakdownItem, String> periodCol;
    @FXML private TableColumn<BreakdownItem, Integer> transactionsCol;
    @FXML private TableColumn<BreakdownItem, BigDecimal> salesCol;
    @FXML private TableColumn<BreakdownItem, BigDecimal> taxCol;
    @FXML private TableColumn<BreakdownItem, BigDecimal> discountCol;
    @FXML private TableColumn<BreakdownItem, BigDecimal> netSalesCol;

    private final ReportsService reportsService;
    private final SalesService salesService;
    private LocalDate startDate;
    private LocalDate endDate;
    private final NumberFormat currencyFormat = NumberFormat.getCurrencyInstance(Locale.US);

    public SalesReportsController(ReportsService reportsService, SalesService salesService) {
        this.reportsService = reportsService;
        this.salesService = salesService;
    }

    @FXML
    public void initialize() {
        setupFilters();
        setupTable();
        handleRefresh();
    }

    private void setupFilters() {
        reportTypeCombo.setItems(FXCollections.observableArrayList("Daily", "Monthly", "Yearly"));
        reportTypeCombo.setValue("Daily");

        dateRangeCombo.setItems(FXCollections.observableArrayList(
                "Today", "Yesterday", "This Week", "This Month", "Last 30 Days", "This Year", "All Time"
        ));
        dateRangeCombo.setValue("This Month");
        updateDateRange("This Month");

        try {
            List<com.possum.domain.model.PaymentMethod> methods = salesService.getPaymentMethods();
            ObservableList<String> methodNames = FXCollections.observableArrayList("All Payment Modes");
            for (com.possum.domain.model.PaymentMethod m : methods) {
                methodNames.add(m.name());
            }
            paymentMethodCombo.setItems(methodNames);
            paymentMethodCombo.setValue("All Payment Modes");
        } catch (Exception e) {
            NotificationService.error("Failed to load payment methods: " + e.getMessage());
        }
    }

    private void setupTable() {
        periodCol.setCellValueFactory(cellData -> new javafx.beans.property.SimpleStringProperty(cellData.getValue().name()));
        transactionsCol.setCellValueFactory(cellData -> new javafx.beans.property.SimpleObjectProperty<>(cellData.getValue().totalTransactions()));
        salesCol.setCellValueFactory(cellData -> new javafx.beans.property.SimpleObjectProperty<>(cellData.getValue().totalSales()));
        taxCol.setCellValueFactory(cellData -> new javafx.beans.property.SimpleObjectProperty<>(cellData.getValue().totalTax()));
        discountCol.setCellValueFactory(cellData -> new javafx.beans.property.SimpleObjectProperty<>(cellData.getValue().totalDiscount()));
        
        // Custom cell formatters for currency
        salesCol.setCellFactory(column -> new javafx.scene.control.TableCell<>() {
            @Override
            protected void updateItem(BigDecimal item, boolean empty) {
                super.updateItem(item, empty);
                setText(empty || item == null ? "" : currencyFormat.format(item));
            }
        });
        taxCol.setCellFactory(column -> new javafx.scene.control.TableCell<>() {
            @Override
            protected void updateItem(BigDecimal item, boolean empty) {
                super.updateItem(item, empty);
                setText(empty || item == null ? "" : currencyFormat.format(item));
            }
        });
        discountCol.setCellFactory(column -> new javafx.scene.control.TableCell<>() {
            @Override
            protected void updateItem(BigDecimal item, boolean empty) {
                super.updateItem(item, empty);
                setText(empty || item == null ? "" : currencyFormat.format(item));
            }
        });
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
    public void handleDateRangeChange() {
        updateDateRange(dateRangeCombo.getValue());
        loadData();
    }

    @FXML
    public void handlePaymentMethodChange() {
        loadData();
    }

    private void loadData() {
        String reportType = reportTypeCombo.getValue().toLowerCase();
        String paymentMode = paymentMethodCombo.getValue();
        Long paymentMethodId = null;

        if (!"All Payment Modes".equals(paymentMode)) {
            try {
                paymentMethodId = salesService.getPaymentMethods().stream()
                        .filter(m -> m.name().equals(paymentMode))
                        .map(m -> m.id())
                        .findFirst()
                        .orElse(null);
            } catch (Exception e) {
                // Ignore
            }
        }

        List<BreakdownItem> breakdown = List.of();
        if ("daily".equals(reportType)) {
            breakdown = reportsService.getSalesAnalytics(startDate, endDate, paymentMethodId).breakdown();
        } else if ("monthly".equals(reportType)) {
            breakdown = reportsService.getMonthlyReport(startDate, endDate, paymentMethodId).breakdown();
        } else {
            breakdown = reportsService.getYearlyReport(startDate, endDate, paymentMethodId).breakdown();
        }

        breakdownTable.setItems(FXCollections.observableArrayList(breakdown));
    }

    private void updateDateRange(String range) {
        LocalDate today = LocalDate.now();
        switch (range) {
            case "Today" -> { startDate = today; endDate = today; }
            case "Yesterday" -> { startDate = today.minusDays(1); endDate = today.minusDays(1); }
            case "This Week" -> { startDate = today.minusDays(today.getDayOfWeek().getValue() - 1); endDate = today; }
            case "This Month" -> { startDate = today.withDayOfMonth(1); endDate = today; }
            case "Last 30 Days" -> { startDate = today.minusDays(30); endDate = today; }
            case "This Year" -> { startDate = today.withDayOfYear(1); endDate = today; }
            case "All Time" -> { startDate = today.minusYears(10); endDate = today; }
        }
    }
}
