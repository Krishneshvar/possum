import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  searchTerm: '',
  currentPage: 1,
  itemsPerPage: 10,
  filters: {
    stockStatus: 'all',
    categories: [],
    status: 'all',
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
      const { name, value } = action.payload;
      state.filters[name] = value;
      state.currentPage = 1;
    },
  },
});

export const { setSearchTerm, setCurrentPage, setFilter } = productsSlice.actions;

export default productsSlice.reducer;
