import { createSlice } from '@reduxjs/toolkit';

interface AuthState {
    user: any | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}

const initialState: AuthState = {
    user: null,
    token: sessionStorage.getItem('possum_token') || null,
    isAuthenticated: false,
    isLoading: !!sessionStorage.getItem('possum_token'),
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setCredentials: (state, { payload: { user, token } }) => {
            state.user = user;
            state.token = token;
            state.isAuthenticated = true;
            state.isLoading = false;
            sessionStorage.setItem('possum_token', token);
        },
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            state.isLoading = false;
            sessionStorage.removeItem('possum_token');
        },
        setLoading: (state, { payload }) => {
            state.isLoading = payload;
        },
        setUser: (state, { payload }) => {
            state.user = payload;
            state.isAuthenticated = !!payload;
            state.isLoading = false;
        }
    },
});

export const { setCredentials, logout, setLoading, setUser } = authSlice.actions;

export default authSlice.reducer;

export const selectCurrentUser = (state: any) => state.auth.user;
export const selectIsAuthenticated = (state: any) => state.auth.isAuthenticated;
export const selectAuthLoading = (state: any) => state.auth.isLoading;
