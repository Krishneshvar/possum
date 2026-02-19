import { createSlice } from '@reduxjs/toolkit';

interface AuditLogState {
    searchTerm: string;
    currentPage: number;
    itemsPerPage: number;
    sortBy: string;
    sortOrder: string;
    filters: {
        tableName: string | null;
        action: string | null;
        userId: number | null;
        startDate: string | null;
        endDate: string | null;
        [key: string]: any;
    };
}

const initialState: AuditLogState = {
    searchTerm: '',
    currentPage: 1,
    itemsPerPage: 20,
    sortBy: 'created_at',
    sortOrder: 'DESC',
    filters: {
        tableName: null,
        action: null,
        userId: null,
        startDate: null,
        endDate: null,
    },
};

const auditLogSlice = createSlice({
    name: 'auditLog',
    initialState,
    reducers: {
        setSearchTerm: (state, action) => {
            state.searchTerm = action.payload;
            state.currentPage = 1;
        },
        setCurrentPage: (state, action) => {
            state.currentPage = action.payload;
        },
        setSort: (state, action) => {
            const { sortBy, sortOrder } = action.payload;
            state.sortBy = sortBy;
            state.sortOrder = sortOrder;
            state.currentPage = 1;
        },
        setFilter: (state, action) => {
            const { key, value } = action.payload;
            state.filters[key] = value;
            state.currentPage = 1;
        },
        setDateRange: (state, action) => {
            const { startDate, endDate } = action.payload;
            state.filters.startDate = startDate || null;
            state.filters.endDate = endDate || null;
            state.currentPage = 1;
        },
        clearAllFilters: (state) => {
            state.filters = initialState.filters;
            state.currentPage = 1;
            state.searchTerm = '';
        },
    },
});

export const { setSearchTerm, setCurrentPage, setSort, setFilter, setDateRange, clearAllFilters } = auditLogSlice.actions;
export default auditLogSlice.reducer;
