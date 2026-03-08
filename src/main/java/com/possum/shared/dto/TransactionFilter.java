package com.possum.shared.dto;

public record TransactionFilter(
        String startDate,
        String endDate,
        String type,
        Long paymentMethodId,
        String status,
        String searchTerm,
        int currentPage,
        int itemsPerPage,
        String sortBy,
        String sortOrder
) {
}
