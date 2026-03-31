package com.possum.shared.dto;

import java.math.BigDecimal;

public record TransactionFilter(
        String startDate,
        String endDate,
        String type,
        BigDecimal minAmount,
        BigDecimal maxAmount,
        Long paymentMethodId,
        String status,
        String searchTerm,
        int currentPage,
        int itemsPerPage,
        String sortBy,
        String sortOrder
) {
}
