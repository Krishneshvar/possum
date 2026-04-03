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
import javafx.beans.property.SimpleStringProperty;
import javafx.beans.property.SimpleObjectProperty;

import java.text.NumberFormat;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;

public class SalesAnalyticsController {
    
    @FXML private javafx.scene.control.DatePicker startDatePicker;
    @FXML private javafx.scene.control.DatePicker endDatePicker;
    @FXML private ComboBox<String> reportTypeCombo;
    @FXML private javafx.scene.layout.VBox paymentMethodContainer;
    private com.possum.ui.common.controls.MultiSelectFilter<PaymentMethod> paymentMethodFilter;
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
        setupPaymentMethods();
        setupDatePickers();
        setupInventoryTable();
        loadReports();
    }

    private void setupDatePickers() {
        // Default range: This month
        startDatePicker.setValue(LocalDate.now().withDayOfMonth(1));
        endDatePicker.setValue(LocalDate.now());
        
        startDate = startDatePicker.getValue();
        endDate = endDatePicker.getValue();
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
            paymentMethodFilter = new com.possum.ui.common.controls.MultiSelectFilter<>(
                "All Methods",
                PaymentMethod::name
            );
            paymentMethodFilter.setItems(methods);
            paymentMethodFilter.setPrefWidth(180);
            paymentMethodFilter.getSelectedItems().addListener((javafx.collections.ListChangeListener<PaymentMethod>) c -> loadReports());
            
            paymentMethodContainer.getChildren().add(paymentMethodFilter);
        } catch (Exception e) {
            NotificationService.error("Failed to load payment methods");
        }
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
    private void handleDateChange() {
        startDate = startDatePicker.getValue();
        endDate = endDatePicker.getValue();
        loadReports();
    }

    @FXML
    private void handleReset() {
        reportTypeCombo.setValue("Daily");
        if (paymentMethodFilter != null) {
            paymentMethodFilter.clearSelection();
        }
        startDatePicker.setValue(LocalDate.now().withDayOfMonth(1));
        endDatePicker.setValue(LocalDate.now());
        startDate = startDatePicker.getValue();
        endDate = endDatePicker.getValue();
        loadReports();
    }

    @FXML
    private void handleReportTypeChange() {
        loadReports();
    }



    @FXML
    private void handleRefresh() {
        loadReports();
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
        List<Long> paymentMethodIds = getSelectedPaymentMethodIds();
        SalesReportSummary summary = reportsService.getSalesSummary(startDate, endDate, paymentMethodIds);
        
        totalSalesLabel.setText(currencyFormat.format(summary.totalSales()));
        transactionsLabel.setText(String.valueOf(summary.totalTransactions()));
        avgSaleLabel.setText(currencyFormat.format(summary.averageSale()));
        totalTaxLabel.setText(currencyFormat.format(summary.totalTax()));
    }

    private List<Long> getSelectedPaymentMethodIds() {
        if (paymentMethodFilter == null) return null;
        List<PaymentMethod> selected = paymentMethodFilter.getSelectedItems();
        if (selected == null || selected.isEmpty()) {
            return null;
        }
        return selected.stream().map(PaymentMethod::id).toList();
    }

    private void loadTopProducts() {
        List<Long> paymentMethodIds = getSelectedPaymentMethodIds();
        List<TopProduct> topProducts = reportsService.getTopProducts(startDate, endDate, 10, paymentMethodIds);
        
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
        List<Long> paymentMethodIds = getSelectedPaymentMethodIds();
        String type = reportTypeCombo.getValue();
        List<? extends BreakdownItem> breakdown;
        
        if ("Monthly".equals(type)) {
            breakdown = reportsService.getMonthlyReport(startDate, endDate, paymentMethodIds).breakdown();
        } else if ("Yearly".equals(type)) {
            breakdown = reportsService.getYearlyReport(startDate, endDate, paymentMethodIds).breakdown();
        } else {
            breakdown = reportsService.getSalesAnalytics(startDate, endDate, paymentMethodIds).breakdown();
        }
        
        XYChart.Series<String, Number> series = new XYChart.Series<>();
        series.setName("Sales");
        
        for (BreakdownItem item : breakdown) {
            series.getData().add(new XYChart.Data<>(item.name(), item.totalSales()));
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
