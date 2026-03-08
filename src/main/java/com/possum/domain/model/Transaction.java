package com.possum.domain.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record Transaction(
        Long id,
        Long saleId,
        Long purchaseOrderId,
        BigDecimal amount,
        String type,
        Long paymentMethodId,
        String paymentMethodName,
        String status,
        LocalDateTime transactionDate,
        String invoiceNumber,
        String customerName,
        String supplierName
) {
}
