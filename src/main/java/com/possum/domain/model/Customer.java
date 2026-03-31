package com.possum.domain.model;

import java.time.LocalDateTime;

public record Customer(
        Long id,
        String name,
        String phone,
        String email,
        String address,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        LocalDateTime deletedAt
) {
}
