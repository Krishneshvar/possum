package com.possum.application.reports.dto;

import java.math.BigDecimal;

public record BreakdownItem(
        String period,
        String name,
        int totalTransactions,
        BigDecimal totalSales,
        BigDecimal sales,
        BigDecimal totalTax,
        BigDecimal totalDiscount
) {
    public BigDecimal getNetSales() {
        return totalSales.subtract(totalDiscount != null ? totalDiscount : BigDecimal.ZERO);
    }
}
