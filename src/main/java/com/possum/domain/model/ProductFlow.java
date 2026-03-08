package com.possum.domain.model;

import java.time.LocalDateTime;

public record ProductFlow(
        Long id,
        Long variantId,
        String eventType,
        Integer quantity,
        String referenceType,
        Long referenceId,
        String variantName,
        String productName,
        String paymentMethodNames,
        LocalDateTime eventDate
) {
}
