import { configureStore } from '@reduxjs/toolkit';
import { productsApi } from '@/services/productsApi';
import { categoriesApi } from '@/services/categoriesApi';
import { customersApi } from '@/services/customersApi';
import productsReducer from '@/features/Products/productsSlice';

export const store = configureStore({
    reducer: {
        [productsApi.reducerPath]: productsApi.reducer,
        [categoriesApi.reducerPath]: categoriesApi.reducer,
        [customersApi.reducerPath]: customersApi.reducer,
        products: productsReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(
            productsApi.middleware,
            categoriesApi.middleware,
            customersApi.middleware
        ),
});
