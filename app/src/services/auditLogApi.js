import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE } from '@/lib/api-client';

export const auditLogApi = createApi({
    reducerPath: 'auditLogApi',
    baseQuery: fetchBaseQuery({
        baseUrl: API_BASE,
        prepareHeaders: (headers, { getState }) => {
            const token = getState().auth?.token || localStorage.getItem('possum_token') || sessionStorage.getItem('possum_token');
            if (token) {
                headers.set('Authorization', `Bearer ${token}`);
            }
            return headers;
        },
    }),
    tagTypes: ['AuditLog'],
    endpoints: (builder) => ({
        getAuditLogs: builder.query({
            query: (params) => {
                const query = new URLSearchParams();
                for (const key in params) {
                    if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
                        query.append(key, params[key]);
                    }
                }
                return `/audit?${query.toString()}`;
            },
            providesTags: ['AuditLog'],
        }),
    }),
});

export const { useGetAuditLogsQuery } = auditLogApi;
