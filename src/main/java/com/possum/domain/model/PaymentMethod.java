package com.possum.domain.model;

public record PaymentMethod(
        Long id,
        String name,
        Boolean active
) {
}
