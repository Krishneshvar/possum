/**
 * Redux Store Configuration
 * Central store configuration for the application
 */
import { configureStore } from '@reduxjs/toolkit';
import { productsApi } from '@/services/productsApi';
import { categoriesApi } from '@/services/categoriesApi';
import productsReducer from '@/features/Products/productsSlice';

export const store = configureStore({
    reducer: {
        [productsApi.reducerPath]: productsApi.reducer,
        [categoriesApi.reducerPath]: categoriesApi.reducer,
        products: productsReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(productsApi.middleware, categoriesApi.middleware),
});
