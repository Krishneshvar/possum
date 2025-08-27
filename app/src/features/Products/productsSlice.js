import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  searchTerm: '',
  currentPage: 1,
  itemsPerPage: 10,
  filters: {
    status: [],
    stockStatus: [],
    categories: [],
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
      state.filters[key] = value;
      state.currentPage = 1;
    },
    clearAllFilters: (state) => {
      state.filters = initialState.filters;
      state.currentPage = 1;
    },
  },
});

export const { setSearchTerm, setCurrentPage, setFilter, clearAllFilters } = productsSlice.actions;
export default productsSlice.reducer;
