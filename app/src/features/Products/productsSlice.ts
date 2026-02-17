import { createSlice } from '@reduxjs/toolkit';

interface ProductsState {
    searchTerm: string;
    currentPage: number;
    itemsPerPage: number;
    filters: {
        stockStatus: string[];
        categories: string[];
        status: string[];
    };
}

const initialState: ProductsState = {
    searchTerm: '',
    currentPage: 1,
    itemsPerPage: 10,
    filters: {
        stockStatus: [],
        categories: [],
        status: [],
    },
};

const productsSlice = createSlice({
    name: 'products',
    initialState,
    reducers: {
        setSearchTerm: (state, action) => {
            state.searchTerm = action.payload;
            state.currentPage = 1;
        },
        setCurrentPage: (state, action) => {
            state.currentPage = action.payload;
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
    },
});

export const { setSearchTerm, setCurrentPage, setFilter, clearAllFilters } = productsSlice.actions;
export default productsSlice.reducer;
