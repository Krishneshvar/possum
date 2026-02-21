import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface VariantsState {
    searchTerm: string;
    currentPage: number;
    itemsPerPage: number;
    sortBy: string;
    sortOrder: string;
    filters: {
        stockStatus: string[];
        status: string[];
        categories: string[];
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
        categories: [],
    },
};

const variantsSlice = createSlice({
    name: 'variants',
    initialState,
    reducers: {
        setSearchTerm: (state, action: PayloadAction<string>) => {
            state.searchTerm = action.payload;
            state.currentPage = 1;
        },
        setCurrentPage: (state, action: PayloadAction<number>) => {
            state.currentPage = action.payload;
        },
        setSorting: (state, action: PayloadAction<{ sortBy: string; sortOrder: string }>) => {
            state.sortBy = action.payload.sortBy;
            state.sortOrder = action.payload.sortOrder;
        },
        setFilter: (state, action: PayloadAction<{ key: keyof VariantsState['filters']; value: string[] }>) => {
            const { key, value } = action.payload;
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
