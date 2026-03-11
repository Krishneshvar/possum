package com.possum.ui.reports;

import com.possum.application.inventory.InventoryService;
import com.possum.application.reports.ReportsService;
import com.possum.application.reports.dto.DailyReport;
import com.possum.application.reports.dto.SalesReportSummary;
import com.possum.application.reports.dto.TopProduct;
import com.possum.domain.model.Variant;
import com.possum.ui.common.controls.NotificationService;
import javafx.collections.FXCollections;
import javafx.fxml.FXML;
import javafx.scene.chart.BarChart;
import javafx.scene.chart.LineChart;
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

public class ReportsController {
    
    @FXML private ComboBox<String> dateRangeCombo;
    @FXML private Label totalSalesLabel;
    @FXML private Label transactionsLabel;
    @FXML private Label avgSaleLabel;
    @FXML private Label totalTaxLabel;
    @FXML private BarChart<String, Number> topProductsChart;
    @FXML private LineChart<String, Number> salesTrendChart;
    @FXML private TableView<Variant> inventoryTable;
    
    private ReportsService reportsService;
    private InventoryService inventoryService;
    private LocalDate startDate;
    private LocalDate endDate;
    private final NumberFormat currencyFormat = NumberFormat.getCurrencyInstance(Locale.US);

    public ReportsController(ReportsService reportsService, InventoryService inventoryService) {
this.reportsService = reportsService;
        this.inventoryService = inventoryService;
    }

    @FXML
    public void initialize() {
        
        setupDateRanges();
        setupInventoryTable();
        loadReports();
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
            loadInventoryMovement();
        } catch (Exception e) {
            NotificationService.error("Failed to load reports");
        }
    }

    private void loadSalesSummary() {
        SalesReportSummary summary = reportsService.getSalesSummary(startDate, endDate, null);
        
        totalSalesLabel.setText(currencyFormat.format(summary.totalSales()));
        transactionsLabel.setText(String.valueOf(summary.totalTransactions()));
        avgSaleLabel.setText(currencyFormat.format(summary.averageSale()));
        totalTaxLabel.setText(currencyFormat.format(summary.totalTax()));
    }

    private void loadTopProducts() {
        List<TopProduct> topProducts = reportsService.getTopProducts(startDate, endDate, 10, null);
        
        XYChart.Series<String, Number> series = new XYChart.Series<>();
        series.setName("Quantity Sold");
        
        for (TopProduct product : topProducts) {
            String label = product.productName() + " - " + product.variantName();
            if (label.length() > 20) label = label.substring(0, 20) + "...";
            series.getData().add(new XYChart.Data<>(label, product.totalQuantitySold()));
        }
        
        topProductsChart.getData().clear();
        topProductsChart.getData().add(series);
    }

    private void loadSalesTrend() {
        DailyReport report = reportsService.getSalesAnalytics(startDate, endDate, null);
        
        XYChart.Series<String, Number> series = new XYChart.Series<>();
        series.setName("Sales");
        
        for (var item : report.breakdown()) {
            series.getData().add(new XYChart.Data<>(item.name(), item.totalSales()));
        }
        
        salesTrendChart.getData().clear();
        salesTrendChart.getData().add(series);
    }

    private void loadInventoryMovement() {
        List<Variant> lowStock = inventoryService.getLowStockAlerts();
        inventoryTable.setItems(FXCollections.observableArrayList(lowStock));
    }
}
