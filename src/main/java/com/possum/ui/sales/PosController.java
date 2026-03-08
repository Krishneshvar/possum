package com.possum.ui.sales;

import com.possum.application.auth.AuthContext;
import com.possum.application.sales.SalesService;
import com.possum.application.sales.TaxEngine;
import com.possum.application.sales.dto.*;
import com.possum.domain.model.PaymentMethod;
import com.possum.domain.model.Variant;
import com.possum.infrastructure.printing.PrinterService;
import com.possum.persistence.repositories.interfaces.VariantRepository;
import com.possum.shared.dto.PagedResult;
import com.possum.ui.common.controls.NotificationService;
import javafx.collections.FXCollections;
import javafx.fxml.FXML;
import javafx.scene.control.*;
import javafx.scene.layout.HBox;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.util.*;

public class PosController {
    
    @FXML private TextField searchField;
    @FXML private ListView<Variant> productList;
    @FXML private ListView<CartItem> cartList;
    @FXML private TextField discountField;
    @FXML private Label subtotalLabel;
    @FXML private Label taxLabel;
    @FXML private Label totalLabel;
    @FXML private ComboBox<PaymentMethod> paymentMethodCombo;
    
    private SalesService salesService;
    private ProductSearchIndex searchIndex;
    private TaxEngine taxEngine;
    private PrinterService printerService;
    
    private final List<CartItem> cart = new ArrayList<>();
    private BigDecimal discount = BigDecimal.ZERO;
    private final NumberFormat currencyFormat = NumberFormat.getCurrencyInstance(Locale.US);

    public void initialize(SalesService salesService, ProductSearchIndex searchIndex, 
                          TaxEngine taxEngine, PrinterService printerService) {
        this.salesService = salesService;
        this.searchIndex = searchIndex;
        this.taxEngine = taxEngine;
        this.printerService = printerService;
        
        setupProductList();
        setupCartList();
        loadPaymentMethods();
        updateTotals();
    }

    private void setupProductList() {
        productList.setCellFactory(lv -> new ListCell<>() {
            @Override
            protected void updateItem(Variant item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || item == null) {
                    setText(null);
                } else {
                    setText(String.format("%s - %s (%s) - %s - Stock: %d",
                        item.productName(), item.name(), item.sku(),
                        currencyFormat.format(item.price()), item.stock()));
                }
            }
        });
        
        productList.setOnMouseClicked(e -> {
            if (e.getClickCount() == 2) {
                Variant selected = productList.getSelectionModel().getSelectedItem();
                if (selected != null) addToCart(selected);
            }
        });
    }

    private void setupCartList() {
        cartList.setCellFactory(lv -> new ListCell<>() {
            @Override
            protected void updateItem(CartItem item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || item == null) {
                    setText(null);
                    setGraphic(null);
                } else {
                    HBox box = new HBox(10);
                    Label label = new Label(String.format("%s x%d - %s",
                        item.variant.name(), item.quantity,
                        currencyFormat.format(item.variant.price().multiply(BigDecimal.valueOf(item.quantity)))));
                    Button removeBtn = new Button("-");
                    Button addBtn = new Button("+");
                    
                    removeBtn.setOnAction(e -> adjustQuantity(item, -1));
                    addBtn.setOnAction(e -> adjustQuantity(item, 1));
                    
                    box.getChildren().addAll(label, removeBtn, addBtn);
                    setGraphic(box);
                }
            }
        });
    }

    private void loadPaymentMethods() {
        List<PaymentMethod> methods = salesService.getPaymentMethods();
        paymentMethodCombo.setItems(FXCollections.observableArrayList(methods));
        if (!methods.isEmpty()) {
            paymentMethodCombo.setValue(methods.get(0));
        }
    }

    @FXML
    private void handleSearch() {
        String query = searchField.getText().trim();
        if (query.isEmpty()) return;
        
        try {
            // Try barcode/SKU lookup first for instant results
            Optional<Variant> bySku = searchIndex.findBySku(query);
            if (bySku.isPresent()) {
                addToCart(bySku.get());
                searchField.clear();
                return;
            }
            
            Optional<Variant> byBarcode = searchIndex.findByBarcode(query);
            if (byBarcode.isPresent()) {
                addToCart(byBarcode.get());
                searchField.clear();
                return;
            }
            
            // Fall back to name search
            List<Variant> results = searchIndex.searchByName(query);
            productList.setItems(FXCollections.observableArrayList(results));
        } catch (Exception e) {
            NotificationService.error("Search failed");
        }
    }

    private void addToCart(Variant variant) {
        Optional<CartItem> existing = cart.stream()
            .filter(item -> item.variant.id().equals(variant.id()))
            .findFirst();
        
        if (existing.isPresent()) {
            existing.get().quantity++;
        } else {
            cart.add(new CartItem(variant, 1));
        }
        
        refreshCart();
    }

    private void adjustQuantity(CartItem item, int delta) {
        item.quantity += delta;
        if (item.quantity <= 0) {
            cart.remove(item);
        }
        refreshCart();
    }

    private void refreshCart() {
        cartList.setItems(FXCollections.observableArrayList(cart));
        updateTotals();
    }

    @FXML
    private void handleApplyDiscount() {
        try {
            discount = new BigDecimal(discountField.getText().isEmpty() ? "0" : discountField.getText());
            updateTotals();
        } catch (NumberFormatException e) {
            NotificationService.error("Invalid discount amount");
        }
    }

    private void updateTotals() {
        BigDecimal subtotal = cart.stream()
            .map(item -> item.variant.price().multiply(BigDecimal.valueOf(item.quantity)))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal taxAmount = subtotal.multiply(new BigDecimal("0.1")); // Simplified 10% tax
        BigDecimal total = subtotal.add(taxAmount).subtract(discount);
        
        subtotalLabel.setText(currencyFormat.format(subtotal));
        taxLabel.setText(currencyFormat.format(taxAmount));
        totalLabel.setText(currencyFormat.format(total));
    }

    @FXML
    private void handleCompleteSale() {
        if (cart.isEmpty()) {
            NotificationService.warning("Cart is empty");
            return;
        }
        
        PaymentMethod method = paymentMethodCombo.getValue();
        if (method == null) {
            NotificationService.warning("Select payment method");
            return;
        }
        
        try {
            BigDecimal total = new BigDecimal(totalLabel.getText().replace("$", "").replace(",", ""));
            
            List<CreateSaleItemRequest> items = cart.stream()
                .map(item -> new CreateSaleItemRequest(
                    item.variant.id(),
                    item.quantity,
                    null,
                    item.variant.price()
                ))
                .toList();
            
            CreateSaleRequest request = new CreateSaleRequest(
                items,
                null,
                discount.compareTo(BigDecimal.ZERO) > 0 ? discount : null,
                List.of(new PaymentRequest(total, method.id()))
            );
            
            long userId = AuthContext.getCurrentUser().id();
            SaleResponse response = salesService.createSale(request, userId);
            
            printReceipt(response);
            
            NotificationService.success("Sale completed: " + response.sale().invoiceNumber());
            handleClearCart();
            
        } catch (Exception e) {
            NotificationService.error("Sale failed: " + e.getMessage());
        }
    }

    private void printReceipt(SaleResponse sale) {
        StringBuilder html = new StringBuilder("<html><body style='font-family: monospace;'>");
        html.append("<h2>RECEIPT</h2>");
        html.append("<p>Invoice: ").append(sale.sale().invoiceNumber()).append("</p>");
        html.append("<p>Date: ").append(sale.sale().saleDate()).append("</p>");
        html.append("<hr>");
        
        for (var item : sale.items()) {
            html.append("<p>").append(item.quantity()).append(" x Item - ")
                .append(currencyFormat.format(item.pricePerUnit())).append("</p>");
        }
        
        html.append("<hr>");
        html.append("<p>Total: ").append(currencyFormat.format(sale.sale().totalAmount())).append("</p>");
        html.append("</body></html>");
        
        printerService.printInvoice(html.toString())
            .thenAccept(success -> {
                if (!success) NotificationService.warning("Print failed");
            });
    }

    @FXML
    private void handleClearCart() {
        cart.clear();
        discount = BigDecimal.ZERO;
        discountField.clear();
        searchField.clear();
        productList.getItems().clear();
        refreshCart();
    }

    private static class CartItem {
        Variant variant;
        int quantity;
        
        CartItem(Variant variant, int quantity) {
            this.variant = variant;
            this.quantity = quantity;
        }
    }
}
