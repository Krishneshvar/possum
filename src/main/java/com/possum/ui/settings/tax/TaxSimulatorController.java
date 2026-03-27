package com.possum.ui.settings.tax;

import com.possum.application.sales.TaxEngine;
import com.possum.application.sales.dto.TaxCalculationResult;
import com.possum.application.sales.dto.TaxableInvoice;
import com.possum.application.sales.dto.TaxableItem;
import com.possum.application.taxes.TaxManagementService;
import com.possum.domain.model.TaxCategory;
import com.possum.infrastructure.serialization.JsonService;
import com.possum.persistence.repositories.interfaces.TaxRepository;
import com.possum.ui.common.controls.NotificationService;
import javafx.collections.FXCollections;
import javafx.fxml.FXML;
import javafx.scene.control.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public class TaxSimulatorController {

    @FXML private TextField amountField;
    @FXML private ComboBox<TaxCategory> categoryCombo;
    @FXML private TextField quantityField;
    @FXML private TextArea resultArea;
    @FXML private Button calculateButton;

    private TaxManagementService taxService;
    private TaxRepository taxRepository;
    private JsonService jsonService;

    public void setTaxService(TaxManagementService taxService) {
        this.taxService = taxService;
        loadCategories();
    }

    public void setTaxRepository(TaxRepository taxRepository) {
        this.taxRepository = taxRepository;
    }

    public void setJsonService(JsonService jsonService) {
        this.jsonService = jsonService;
    }

    @FXML
    public void initialize() {
        quantityField.setText("1");
        amountField.setText("100");
    }

    private void loadCategories() {
        if (taxService != null) {
            List<TaxCategory> categories = taxService.getAllTaxCategories();
            categoryCombo.setItems(FXCollections.observableArrayList(categories));
            categoryCombo.setCellFactory(lv -> new ListCell<>() {
                @Override
                protected void updateItem(TaxCategory item, boolean empty) {
                    super.updateItem(item, empty);
                    setText(empty || item == null ? "No Category" : item.name());
                }
            });
            categoryCombo.setButtonCell(new ListCell<>() {
                @Override
                protected void updateItem(TaxCategory item, boolean empty) {
                    super.updateItem(item, empty);
                    setText(empty || item == null ? "No Category" : item.name());
                }
            });
            
            if (!categories.isEmpty()) {
                categoryCombo.setValue(categories.get(0));
            }
        }
    }

    @FXML
    private void handleCalculate() {
        if (taxRepository == null || jsonService == null) {
            NotificationService.error("Tax engine not initialized");
            return;
        }

        try {
            BigDecimal amount = new BigDecimal(amountField.getText().trim());
            int quantity = Integer.parseInt(quantityField.getText().trim());
            TaxCategory category = categoryCombo.getValue();

            TaxableItem item = new TaxableItem(
                "Simulated Product",
                "Default Variant",
                amount,
                quantity,
                category != null ? category.id() : null,
                1L,
                1L
            );

            TaxableInvoice invoice = new TaxableInvoice(List.of(item));

            TaxEngine engine = new TaxEngine(taxRepository, jsonService);
            engine.init();
            
            TaxCalculationResult result = engine.calculate(invoice, null);

            displayResult(result, amount, quantity);
            NotificationService.success("Tax calculated successfully");
        } catch (NumberFormatException e) {
            NotificationService.error("Invalid number format");
        } catch (Exception e) {
            NotificationService.error("Calculation failed: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private void displayResult(TaxCalculationResult result, BigDecimal unitPrice, int quantity) {
        StringBuilder sb = new StringBuilder();
        sb.append("=== TAX CALCULATION RESULT ===\n\n");
        
        BigDecimal subtotal = unitPrice.multiply(BigDecimal.valueOf(quantity));
        sb.append(String.format("Unit Price: %.2f\n", unitPrice));
        sb.append(String.format("Quantity: %d\n", quantity));
        sb.append(String.format("Subtotal: %.2f\n\n", subtotal));
        
        if (!result.items().isEmpty()) {
            TaxableItem item = result.items().get(0);
            sb.append(String.format("Tax Amount: %.2f\n", item.getTaxAmount()));
            sb.append(String.format("Tax Rate: %.2f%%\n\n", item.getTaxRate()));
            
            if (item.getTaxRuleSnapshot() != null && !item.getTaxRuleSnapshot().equals("[]")) {
                sb.append("Tax Breakdown:\n");
                try {
                    List<Map<String, Object>> breakdown = jsonService.fromJson(item.getTaxRuleSnapshot(), List.class);
                    for (Map<String, Object> rule : breakdown) {
                        sb.append(String.format("  - %s: %.2f (%.2f%%)\n", 
                            rule.get("rule_name"),
                            rule.get("amount"),
                            rule.get("rate")));
                    }
                    sb.append("\n");
                } catch (Exception e) {
                    sb.append("  (Unable to parse breakdown)\n\n");
                }
            }
        }
        
        sb.append(String.format("Total Tax: %.2f\n", result.totalTax()));
        sb.append(String.format("Grand Total: %.2f\n", result.grandTotal()));
        
        resultArea.setText(sb.toString());
    }

    @FXML
    private void handleClear() {
        amountField.setText("100");
        quantityField.setText("1");
        categoryCombo.setValue(null);
        resultArea.clear();
    }
}
