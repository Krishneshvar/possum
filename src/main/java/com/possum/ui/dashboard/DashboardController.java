package com.possum.ui.dashboard;

import com.possum.application.inventory.InventoryService;
import com.possum.application.reports.ReportsService;
import com.possum.application.reports.dto.SalesReportSummary;
import com.possum.application.reports.dto.TopProduct;
import com.possum.domain.model.Variant;
import javafx.collections.FXCollections;
import javafx.fxml.FXML;
import javafx.scene.control.Label;
import javafx.scene.control.TableColumn;
import javafx.scene.control.TableView;
import javafx.scene.control.cell.PropertyValueFactory;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;

public class DashboardController {
    
    @FXML private Label dailySalesLabel;
    @FXML private Label transactionsLabel;
    @FXML private Label lowStockLabel;
    @FXML private TableView<TopProduct> topProductsTable;
    @FXML private TableView<Variant> lowStockTable;
    
    private ReportsService reportsService;
    private InventoryService inventoryService;
    private final NumberFormat currencyFormat = NumberFormat.getCurrencyInstance(Locale.US);

    public void initialize(ReportsService reportsService, InventoryService inventoryService) {
        this.reportsService = reportsService;
        this.inventoryService = inventoryService;
        
        setupTopProductsTable();
        setupLowStockTable();
        loadDashboardData();
    }

    private void setupTopProductsTable() {
        TableColumn<TopProduct, String> nameCol = new TableColumn<>("Product");
        nameCol.setCellValueFactory(new PropertyValueFactory<>("productName"));
        
        TableColumn<TopProduct, String> variantCol = new TableColumn<>("Variant");
        variantCol.setCellValueFactory(new PropertyValueFactory<>("variantName"));
        
        TableColumn<TopProduct, Integer> qtyCol = new TableColumn<>("Qty Sold");
        qtyCol.setCellValueFactory(new PropertyValueFactory<>("totalQuantitySold"));
        
        TableColumn<TopProduct, BigDecimal> revenueCol = new TableColumn<>("Revenue");
        revenueCol.setCellValueFactory(new PropertyValueFactory<>("totalRevenue"));
        revenueCol.setCellFactory(col -> new javafx.scene.control.TableCell<>() {
            @Override
            protected void updateItem(BigDecimal item, boolean empty) {
                super.updateItem(item, empty);
                setText(empty || item == null ? null : currencyFormat.format(item));
            }
        });
        
        topProductsTable.getColumns().addAll(nameCol, variantCol, qtyCol, revenueCol);
    }

    private void setupLowStockTable() {
        TableColumn<Variant, String> nameCol = new TableColumn<>("Product");
        nameCol.setCellValueFactory(new PropertyValueFactory<>("productName"));
        
        TableColumn<Variant, String> variantCol = new TableColumn<>("Variant");
        variantCol.setCellValueFactory(new PropertyValueFactory<>("name"));
        
        TableColumn<Variant, String> skuCol = new TableColumn<>("SKU");
        skuCol.setCellValueFactory(new PropertyValueFactory<>("sku"));
        
        TableColumn<Variant, Integer> stockCol = new TableColumn<>("Stock");
        stockCol.setCellValueFactory(new PropertyValueFactory<>("stock"));
        
        TableColumn<Variant, Integer> alertCol = new TableColumn<>("Alert Level");
        alertCol.setCellValueFactory(new PropertyValueFactory<>("stockAlertCap"));
        
        lowStockTable.getColumns().addAll(nameCol, variantCol, skuCol, stockCol, alertCol);
    }

    private void loadDashboardData() {
        LocalDate today = LocalDate.now();
        
        SalesReportSummary summary = reportsService.getSalesSummary(today, today, null);
        dailySalesLabel.setText(currencyFormat.format(summary.totalSales()));
        transactionsLabel.setText(String.valueOf(summary.totalTransactions()));
        
        List<TopProduct> topProducts = reportsService.getTopProducts(today, today, 10, null);
        topProductsTable.setItems(FXCollections.observableArrayList(topProducts));
        
        List<Variant> lowStockVariants = inventoryService.getLowStockAlerts();
        lowStockLabel.setText(String.valueOf(lowStockVariants.size()));
        lowStockTable.setItems(FXCollections.observableArrayList(lowStockVariants));
    }

    public void refresh() {
        loadDashboardData();
    }
}
