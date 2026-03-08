package com.possum.shared.dto;

public record SupplierFilter(
        int page,
        int limit,
        String searchTerm,
        Long paymentPolicyId,
        String sortBy,
        String sortOrder
) {
}
