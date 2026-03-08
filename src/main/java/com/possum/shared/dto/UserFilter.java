package com.possum.shared.dto;

public record UserFilter(
        String searchTerm,
        Integer page,
        Integer limit
) {
}
