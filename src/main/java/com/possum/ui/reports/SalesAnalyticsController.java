package com.possum.ui.reports;

import com.possum.application.inventory.InventoryService;
import com.possum.application.reports.ReportsService;
import com.possum.application.sales.SalesService;
import com.possum.application.reports.dto.*;
import com.possum.domain.model.PaymentMethod;
import com.possum.domain.model.Variant;
import com.possum.ui.common.controls.NotificationService;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.fxml.FXML;
import javafx.scene.chart.BarChart;
import javafx.scene.chart.LineChart;
import javafx.scene.chart.PieChart;
import javafx.scene.chart.XYChart;
import javafx.scene.control.ComboBox;
import javafx.scene.control.Label;
import javafx.scene.control.TableColumn;
import javafx.scene.control.TableView;
import javafx.scene.control.cell.PropertyValueFactory;
import javafx.beans.property.SimpleStringProperty;
import javafx.beans.property.SimpleObjectProperty;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;

public class SalesAnalyticsController {
    
    @FXML private ComboBox<String> dateRangeCombo;
    @FXML private ComboBox<String> reportTypeCombo;
    @FXML private ComboBox<String> paymentMethodCombo;
    @FXML private Label totalSalesLabel;
    @FXML private Label transactionsLabel;
    @FXML private Label avgSaleLabel;
    @FXML private Label totalTaxLabel;
    @FXML private BarChart<String, Number> topProductsChart;
    @FXML private LineChart<String, Number> salesTrendChart;
    @FXML private PieChart paymentMethodsChart;
    @FXML private TableView<Variant> inventoryTable;
    
    private ReportsService reportsService;
    private InventoryService inventoryService;
    private SalesService salesService;
    private LocalDate startDate;
    private LocalDate endDate;
    private final NumberFormat currencyFormat = NumberFormat.getCurrencyInstance(Locale.US);

    public SalesAnalyticsController(ReportsService reportsService, InventoryService inventoryService, SalesService salesService) {
        this.reportsService = reportsService;
        this.inventoryService = inventoryService;
        this.salesService = salesService;
    }

    @FXML
    public void initialize() {
        setupReportTypes();
        setupDateRanges();
        setupPaymentMethods();
        setupInventoryTable();
        loadReports();
    }

    private void setupReportTypes() {
        reportTypeCombo.setItems(FXCollections.observableArrayList(
            "Daily", "Monthly", "Yearly"
        ));
        reportTypeCombo.setValue("Daily");
    }

    private void setupPaymentMethods() {
        try {
            List<PaymentMethod> methods = salesService.getPaymentMethods();
            List<String> methodNames = new java.util.ArrayList<>();
            methodNames.add("All Methods");
            for (PaymentMethod m : methods) {
                methodNames.add(m.name());
            }
            paymentMethodCombo.setItems(FXCollections.observableArrayList(methodNames));
            paymentMethodCombo.setValue("All Methods");
        } catch (Exception e) {
            NotificationService.error("Failed to load payment methods");
        }
    }

    private void setupDateRanges() {
        dateRangeCombo.setItems(FXCollections.observableArrayList(
            "Today", "This Week", "This Month", "Last 30 Days", "This Year"
        ));
        dateRangeCombo.setValue("This Month");
        updateDateRange("This Month");
    }

    private void setupInventoryTable() {
        TableColumn<Variant, String> productCol = new TableColumn<>("Product");
        productCol.setCellValueFactory(cellData -> new SimpleStringProperty(cellData.getValue().productName()));
        
        TableColumn<Variant, String> variantCol = new TableColumn<>("Variant");
        variantCol.setCellValueFactory(cellData -> new SimpleStringProperty(cellData.getValue().name()));
        
        TableColumn<Variant, Integer> stockCol = new TableColumn<>("Stock");
        stockCol.setCellValueFactory(cellData -> new SimpleObjectProperty<>(cellData.getValue().stock()));
        
        TableColumn<Variant, Integer> alertCol = new TableColumn<>("Alert Level");
        alertCol.setCellValueFactory(cellData -> new SimpleObjectProperty<>(cellData.getValue().stockAlertCap()));
        
        inventoryTable.getColumns().addAll(productCol, variantCol, stockCol, alertCol);
    }

    @FXML
    private void handleDateRangeChange() {
        String range = dateRangeCombo.getValue();
        updateDateRange(range);
        loadReports();
    }

    @FXML
    private void handleReportTypeChange() {
        loadReports();
    }

    @FXML
    private void handlePaymentMethodChange() {
        loadReports();
    }

    @FXML
    private void handleRefresh() {
        loadReports();
    }

    private void updateDateRange(String range) {
        LocalDate now = LocalDate.now();
        switch (range) {
            case "Today":
                startDate = now;
                endDate = now;
                break;
            case "This Week":
                startDate = now.minusDays(7);
                endDate = now;
                break;
            case "This Month":
                startDate = now.withDayOfMonth(1);
                endDate = now;
                break;
            case "Last 30 Days":
                startDate = now.minusDays(30);
                endDate = now;
                break;
            case "This Year":
                startDate = now.withDayOfYear(1);
                endDate = now;
                break;
        }
    }

    private void loadReports() {
        try {
            loadSalesSummary();
            loadTopProducts();
            loadSalesTrend();
            loadSalesByPaymentMethod();
            loadInventoryMovement();
        } catch (Exception e) {
            NotificationService.error("Failed to load reports");
        }
    }

    private void loadSalesSummary() {
        Long paymentMethodId = getSelectedPaymentMethodId();
        SalesReportSummary summary = reportsService.getSalesSummary(startDate, endDate, paymentMethodId);
        
        totalSalesLabel.setText(currencyFormat.format(summary.totalSales()));
        transactionsLabel.setText(String.valueOf(summary.totalTransactions()));
        avgSaleLabel.setText(currencyFormat.format(summary.averageSale()));
        totalTaxLabel.setText(currencyFormat.format(summary.totalTax()));
    }

    private Long getSelectedPaymentMethodId() {
        String selected = paymentMethodCombo.getValue();
        if (selected == null || "All Methods".equals(selected)) {
            return null;
        }
        
        return salesService.getPaymentMethods().stream()
                .filter(m -> m.name().equals(selected))
                .map(PaymentMethod::id)
                .findFirst()
                .orElse(null);
    }

    private void loadTopProducts() {
        Long paymentMethodId = getSelectedPaymentMethodId();
        List<TopProduct> topProducts = reportsService.getTopProducts(startDate, endDate, 10, paymentMethodId);
        
        XYChart.Series<String, Number> series = new XYChart.Series<>();
        series.setName("Quantity Sold");
        
        for (TopProduct product : topProducts) {
            String label = product.productName() + (product.variantName() != null ? " - " + product.variantName() : "");
            if (label.length() > 20) label = label.substring(0, 20) + "...";
            series.getData().add(new XYChart.Data<>(label, product.totalQuantitySold()));
        }
        
        topProductsChart.getData().clear();
        topProductsChart.getData().add(series);
    }

    private void loadSalesTrend() {
        Long paymentMethodId = getSelectedPaymentMethodId();
        String type = reportTypeCombo.getValue();
        List<? extends BreakdownItem> breakdown;
        
        if ("Monthly".equals(type)) {
            breakdown = reportsService.getMonthlyReport(startDate, endDate, paymentMethodId).breakdown();
        } else if ("Yearly".equals(type)) {
            breakdown = reportsService.getYearlyReport(startDate, endDate, paymentMethodId).breakdown();
        } else {
            breakdown = reportsService.getSalesAnalytics(startDate, endDate, paymentMethodId).breakdown();
        }
        
        XYChart.Series<String, Number> series = new XYChart.Series<>();
        series.setName("Sales");
        
        for (BreakdownItem item : breakdown) {
            series.getData().add(new XYChart.Data<>(item.name(), item.sales()));
        }
        
        salesTrendChart.getData().clear();
        salesTrendChart.getData().add(series);
        salesTrendChart.setTitle(type + " Sales Trend");
    }

    private void loadSalesByPaymentMethod() {
        List<PaymentMethodStat> stats = reportsService.getSalesByPaymentMethod(startDate, endDate);
        
        ObservableList<PieChart.Data> pieData = FXCollections.observableArrayList();
        for (PaymentMethodStat stat : stats) {
            pieData.add(new PieChart.Data(stat.paymentMethod(), stat.totalAmount().doubleValue()));
        }
        
        paymentMethodsChart.setData(pieData);
    }

    private void loadInventoryMovement() {
        List<Variant> lowStock = inventoryService.getLowStockAlerts();
        inventoryTable.setItems(FXCollections.observableArrayList(lowStock));
    }
}
