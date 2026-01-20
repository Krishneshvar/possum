import { configureStore } from '@reduxjs/toolkit';
import { productsApi } from '@/services/productsApi';
import { categoriesApi } from '@/services/categoriesApi';
import { customersApi } from '@/services/customersApi';
import { inventoryApi } from '@/services/inventoryApi';
import { salesApi } from '@/services/salesApi';
import { returnsApi } from '@/services/returnsApi';
import { productFlowApi } from '@/services/productFlowApi';
import { reportsApi } from '@/services/reportsApi';
import { taxesApi } from '@/services/taxesApi';
import productsReducer from '@/features/Products/productsSlice';
import variantsReducer from '@/features/Variants/variantsSlice';

export const store = configureStore({
    reducer: {
        [productsApi.reducerPath]: productsApi.reducer,
        [categoriesApi.reducerPath]: categoriesApi.reducer,
        [customersApi.reducerPath]: customersApi.reducer,
        [inventoryApi.reducerPath]: inventoryApi.reducer,
        [salesApi.reducerPath]: salesApi.reducer,
        [returnsApi.reducerPath]: returnsApi.reducer,
        [productFlowApi.reducerPath]: productFlowApi.reducer,
        [reportsApi.reducerPath]: reportsApi.reducer,
        [taxesApi.reducerPath]: taxesApi.reducer,
        products: productsReducer,
        variants: variantsReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(
            productsApi.middleware,
            categoriesApi.middleware,
            customersApi.middleware,
            inventoryApi.middleware,
            salesApi.middleware,
            returnsApi.middleware,
            productFlowApi.middleware,
            reportsApi.middleware,
            taxesApi.middleware
        ),
});
