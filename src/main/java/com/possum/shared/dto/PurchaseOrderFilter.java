package com.possum.shared.dto;

public record PurchaseOrderFilter(
        int page,
        int limit,
        String searchTerm,
        String status,
        String fromDate,
        String toDate,
        String sortBy,
        String sortOrder
) {
}
