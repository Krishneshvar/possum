package com.possum.domain.model;

import java.time.LocalDateTime;

public record PurchaseOrder(
        Long id,
        Long supplierId,
        String supplierName,
        String status,
        LocalDateTime orderDate,
        LocalDateTime receivedDate,
        Long createdBy,
        String createdByName,
        Integer itemCount
) {
}
