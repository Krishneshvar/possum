package com.possum.shared.dto;

public record ReturnFilter(
        Long saleId,
        Long userId,
        String startDate,
        String endDate,
        String searchTerm,
        int currentPage,
        int itemsPerPage,
        String sortBy,
        String sortOrder
) {
}
