package com.possum.shared.dto;

public record AuditLogFilter(
        String tableName,
        Long rowId,
        Long userId,
        String action,
        String startDate,
        String endDate,
        String searchTerm,
        String sortBy,
        String sortOrder,
        int currentPage,
        int itemsPerPage
) {
}
