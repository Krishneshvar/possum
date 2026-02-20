import { createSlice } from '@reduxjs/toolkit';

interface AuthState {
    user: any | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}

// Note: sessionStorage is used for token storage in this Electron desktop app.
// For web applications, consider using httpOnly cookies for better XSS protection.
// In Electron's controlled environment, sessionStorage provides adequate security
// as the renderer process is isolated and CSP policies are enforced.
const storedToken = sessionStorage.getItem('possum_token');

const initialState: AuthState = {
    user: null,
    token: storedToken,
    // Don't set isAuthenticated until user is verified
    isAuthenticated: false,
    // Set loading true if token exists (will verify on mount)
    isLoading: !!storedToken,
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
export const selectToken = (state: any) => state.auth.token;
