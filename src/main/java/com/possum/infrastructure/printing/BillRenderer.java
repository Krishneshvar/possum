package com.possum.infrastructure.printing;

import com.possum.application.sales.dto.SaleResponse;
import com.possum.domain.model.Sale;
import com.possum.domain.model.SaleItem;
import com.possum.shared.dto.BillSettings;
import com.possum.shared.dto.GeneralSettings;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.format.DateTimeFormatter;

public class BillRenderer {

    private static final String STYLES = """
      body {
        margin: 0;
        padding: 0;
        font-family: 'Courier New', Courier, monospace;
        color: black;
        background: white;
      }
      .bill-container {
        padding: 5px;
        box-sizing: border-box;
      }
      .w-58mm { width: 58mm; }
      .w-80mm { width: 80mm; }
      
      .text-left { text-align: left; }
      .text-center { text-align: center; }
      .text-right { text-align: right; }
      
      .text-small { font-size: 12px; }
      .text-medium { font-size: 14px; }
      .text-large { font-size: 18px; font-weight: bold; }
      
      .bold { font-weight: bold; }
      
      table { width: 100%; border-collapse: collapse; }
      th, td { text-align: left; vertical-align: top; padding: 2px 0; }
      
      .col-item { width: 40%; }
      .col-qty { width: 15%; text-align: center; }
      .col-rate { width: 20%; text-align: right; }
      .col-amount { width: 25%; text-align: right; }
      
      .divider { border-top: 1px dashed black; margin: 5px 0; }
      .double-divider { border-top: 3px double black; margin: 5px 0; }
      
      .section { margin-bottom: 8px; }
      
      .header-container { display: flex; align-items: center; justify-content: center; gap: 10px; }
      .header-logo { max-width: 50px; max-height: 50px; object-fit: contain; }
      .header-content { flex: 1; }
      
      .footer-text { white-space: pre-wrap; }
    """;

    public static String renderBill(SaleResponse saleResponse, GeneralSettings general, BillSettings billSettings) {
        Sale sale = saleResponse.sale();
        String paperWidth = billSettings.getPaperWidth() + "mm";
        String currency = general.getCurrencyCode().equals("INR") ? "₹" : "$";
        
        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html><html><head><meta charset=\"UTF-8\"><style>")
            .append(STYLES)
            .append("</style></head><body>");
        
        html.append("<div class=\"bill-container w-").append(paperWidth).append("\">");

        // Header
        html.append("<div class=\"section text-center\">");
        html.append("<div class=\"text-large\">").append(general.getStoreName()).append("</div>");
        html.append("</div><div class=\"divider\"></div>");

        // Meta
        html.append("<div class=\"section text-left text-small\">");
        html.append("<div><span class=\"bold\">Bill No:</span> ").append(sale.invoiceNumber()).append("</div>");
        html.append("<div><span class=\"bold\">Date:</span> ").append(sale.saleDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"))).append("</div>");
        if (sale.billerName() != null) {
            html.append("<div><span class=\"bold\">Cashier:</span> ").append(sale.billerName()).append("</div>");
        }
        if (sale.customerName() != null) {
            html.append("<div><span class=\"bold\">Customer:</span> ").append(sale.customerName()).append("</div>");
        }
        html.append("</div><div class=\"divider\"></div>");

        // Items
        html.append("<div class=\"section text-medium\">");
        html.append("<table><thead><tr class=\"text-small bold\" style=\"border-bottom: 1px dashed black;\">");
        html.append("<th class=\"col-item\">Item</th>");
        html.append("<th class=\"col-qty\" style=\"text-align: center;\">Qty</th>");
        html.append("<th class=\"col-rate\" style=\"text-align: right;\">Rate</th>");
        html.append("<th class=\"col-amount\" style=\"text-align: right;\">Amt</th>");
        html.append("</tr></thead><tbody>");

        for (SaleItem item : saleResponse.items()) {
            BigDecimal qty = BigDecimal.valueOf(item.quantity());
            BigDecimal rate = item.pricePerUnit();
            BigDecimal amount = rate.multiply(qty);
            
            html.append("<tr>");
            html.append("<td class=\"col-item\">").append(item.productName()).append("</td>");
            html.append("<td class=\"col-qty\">").append(item.quantity()).append("</td>");
            html.append("<td class=\"col-rate\">").append(formatCurrency(rate, currency)).append("</td>");
            html.append("<td class=\"col-amount\">").append(formatCurrency(amount, currency)).append("</td>");
            html.append("</tr>");
        }
        html.append("</tbody></table></div><div class=\"divider\"></div>");

        // Totals
        html.append("<div class=\"section text-medium\">");
        html.append("<table style=\"width: 100%\">");
        
        BigDecimal discount = sale.discount() != null ? sale.discount() : BigDecimal.ZERO;
        BigDecimal tax = sale.totalTax() != null ? sale.totalTax() : BigDecimal.ZERO;
        BigDecimal total = sale.totalAmount();
        BigDecimal subtotal = total.subtract(tax).add(discount);
        
        html.append("<tr><td>Subtotal:</td><td class=\"text-right\">").append(formatCurrency(subtotal, currency)).append("</td></tr>");
        if (tax.compareTo(BigDecimal.ZERO) > 0) {
            html.append("<tr><td>Tax:</td><td class=\"text-right\">").append(formatCurrency(tax, currency)).append("</td></tr>");
        }
        if (discount.compareTo(BigDecimal.ZERO) > 0) {
            html.append("<tr><td>Discount:</td><td class=\"text-right\">-").append(formatCurrency(discount, currency)).append("</td></tr>");
        }
        
        html.append("<tr class=\"text-large\" style=\"border-top: 1px dashed black;\">");
        html.append("<td style=\"padding-top: 5px;\">Total:</td>");
        html.append("<td class=\"text-right\" style=\"padding-top: 5px;\">").append(formatCurrency(total, currency)).append("</td>");
        html.append("</tr></table>");
        
        int totalItems = saleResponse.items().stream().mapToInt(SaleItem::quantity).sum();
        html.append("<div class=\"text-small text-left\" style=\"margin-top: 5px;\">Items: ").append(totalItems).append("</div>");
        html.append("</div><div class=\"divider\"></div>");

        // Footer
        if (billSettings.getFooterNote() != null && !billSettings.getFooterNote().isEmpty()) {
            html.append("<div class=\"section text-center text-small footer-text\">")
                .append(billSettings.getFooterNote())
                .append("</div>");
        } else {
            html.append("<div class=\"section text-center text-small\">Thank you for your visit!</div>");
        }

        html.append("</div></body></html>");
        
        return html.toString();
    }

    private static String formatCurrency(BigDecimal amount, String currency) {
        if (amount == null) return currency + "0.00";
        return currency + amount.setScale(2, RoundingMode.HALF_UP).toString();
    }
}
