import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    searchTerm: '',
    currentPage: 1,
    itemsPerPage: 10,
    sortBy: 'p.name',
    sortOrder: 'ASC',
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
        resetFilters: (state) => {
            return initialState;
        },
    },
});

export const { setSearchTerm, setCurrentPage, setSorting, resetFilters } = variantsSlice.actions;
export default variantsSlice.reducer;
