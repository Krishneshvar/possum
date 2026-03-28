package com.possum.domain.model;

import java.time.LocalDateTime;

public record PurchaseOrder(
        Long id,
        String invoiceNumber,
        Long supplierId,
        String supplierName,
        Long paymentMethodId,
        String paymentMethodName,
        String status,
        LocalDateTime orderDate,
        LocalDateTime receivedDate,
        Long createdBy,
        String createdByName,
        Integer itemCount
) {
}
