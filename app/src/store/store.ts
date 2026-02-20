import { configureStore } from '@reduxjs/toolkit';
import { productsApi } from '../services/productsApi';
import { variantsApi } from '../services/variantsApi';
import { categoriesApi } from '../services/categoriesApi';
import { customersApi } from '../services/customersApi';
import { inventoryApi } from '../services/inventoryApi';
import { salesApi } from '../services/salesApi';
import { returnsApi } from '../services/returnsApi';
import { productFlowApi } from '../services/productFlowApi';
import { reportsApi } from '../services/reportsApi';
import { taxesApi } from '../services/taxesApi';
import { usersApi } from '../services/usersApi';
import { suppliersApi } from '../services/suppliersApi';
import { purchaseApi } from '../services/purchaseApi';
import { authApi } from '../services/authApi';
import { auditLogApi } from '../services/auditLogApi';
import { transactionsApi } from '../services/transactionsApi';
import { dashboardApi } from '../services/dashboardApi';
import authReducer from '../features/Auth/authSlice';
import productsReducer from '../features/Products/productsSlice';
import variantsReducer from '../features/Variants/variantsSlice';
import auditLogReducer from '../features/AuditLog/auditLogSlice';
import settingsReducer from '../features/Settings/settingsSlice';

export const store = configureStore({
    reducer: {
        [productsApi.reducerPath]: productsApi.reducer,
        [variantsApi.reducerPath]: variantsApi.reducer,
        [categoriesApi.reducerPath]: categoriesApi.reducer,
        [customersApi.reducerPath]: customersApi.reducer,
        [inventoryApi.reducerPath]: inventoryApi.reducer,
        [salesApi.reducerPath]: salesApi.reducer,
        [returnsApi.reducerPath]: returnsApi.reducer,
        [productFlowApi.reducerPath]: productFlowApi.reducer,
        [reportsApi.reducerPath]: reportsApi.reducer,
        [taxesApi.reducerPath]: taxesApi.reducer,
        [usersApi.reducerPath]: usersApi.reducer,
        [suppliersApi.reducerPath]: suppliersApi.reducer,
        [purchaseApi.reducerPath]: purchaseApi.reducer,
        [authApi.reducerPath]: authApi.reducer,
        auth: authReducer,
        products: productsReducer,
        variants: variantsReducer,
        auditLog: auditLogReducer,
        settings: settingsReducer,
        [auditLogApi.reducerPath]: auditLogApi.reducer,
        [transactionsApi.reducerPath]: transactionsApi.reducer,
        [dashboardApi.reducerPath]: dashboardApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(
            productsApi.middleware,
            variantsApi.middleware,
            categoriesApi.middleware,
            customersApi.middleware,
            inventoryApi.middleware,
            salesApi.middleware,
            returnsApi.middleware,
            productFlowApi.middleware,
            reportsApi.middleware,
            taxesApi.middleware,
            usersApi.middleware,
            suppliersApi.middleware,
            purchaseApi.middleware,
            authApi.middleware,
            auditLogApi.middleware,
            transactionsApi.middleware,
            dashboardApi.middleware,
        ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
