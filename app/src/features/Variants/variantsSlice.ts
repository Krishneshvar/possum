import { createSlice } from '@reduxjs/toolkit';

interface VariantsState {
    searchTerm: string;
    currentPage: number;
    itemsPerPage: number;
    sortBy: string;
    sortOrder: string;
    filters: {
        stockStatus: string[];
        status: string[];
    };
}

const initialState: VariantsState = {
    searchTerm: '',
    currentPage: 1,
    itemsPerPage: 10,
    sortBy: 'p.name',
    sortOrder: 'ASC',
    filters: {
        stockStatus: [],
        status: [],
    },
};

const variantsSlice = createSlice({
    name: 'variants',
    initialState,
    reducers: {
        setSearchTerm: (state, action) => {
            state.searchTerm = action.payload;
            state.currentPage = 1;
        },
        setCurrentPage: (state, action) => {
            state.currentPage = action.payload;
        },
        setSorting: (state, action) => {
            state.sortBy = action.payload.sortBy;
            state.sortOrder = action.payload.sortOrder;
        },
        setFilter: (state, action) => {
            const { key, value } = action.payload;
            // @ts-ignore
            state.filters[key] = value;
            state.currentPage = 1;
        },
        clearAllFilters: (state) => {
            state.filters = initialState.filters;
            state.currentPage = 1;
            state.searchTerm = '';
        },
        resetFilters: () => {
            return initialState;
        },
    },
});

export const { setSearchTerm, setCurrentPage, setSorting, setFilter, clearAllFilters, resetFilters } = variantsSlice.actions;
export default variantsSlice.reducer;
