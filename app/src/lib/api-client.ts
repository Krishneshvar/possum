import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const API_BASE = 'http://localhost:3001/api';

/**
 * Base query with automatic auth token inclusion
 */
export const baseQuery = fetchBaseQuery({
    baseUrl: API_BASE,
    prepareHeaders: (headers, { getState }) => {
        const token = (getState() as any).auth?.token || sessionStorage.getItem('possum_token');
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }
        return headers;
    },
});
