import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    searchTerm: '',
    currentPage: 1,
    itemsPerPage: 50,
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
        clearAllFilters: (state) => {
            state.filters = initialState.filters;
            state.currentPage = 1;
            state.searchTerm = '';
        },
    },
});

export const { setSearchTerm, setCurrentPage, setSort, setFilter, clearAllFilters } = auditLogSlice.actions;
export default auditLogSlice.reducer;
