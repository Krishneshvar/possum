import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchGeneralSettings = createAsyncThunk(
    'settings/fetchGeneralSettings',
    async (_, { getState }) => {
        const state = getState();
        const token = state.auth.token;
        if (window.electronAPI) {
            const settings = await window.electronAPI.getGeneralSettings(token);
            return settings || { currency: '₹' };
        }
        return { currency: '₹' };
    }
);

export const saveGeneralSettings = createAsyncThunk(
    'settings/saveGeneralSettings',
    async (settings, { getState }) => {
        const state = getState();
        const token = state.auth.token;
        if (window.electronAPI) {
            await window.electronAPI.saveGeneralSettings(settings, token);
        }
        return settings;
    }
);

const settingsSlice = createSlice({
    name: 'settings',
    initialState: {
        currency: '₹',
        status: 'idle',
        error: null,
    },
    reducers: {
        setCurrency: (state, action) => {
            state.currency = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchGeneralSettings.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchGeneralSettings.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.currency = action.payload.currency || '₹';
            })
            .addCase(fetchGeneralSettings.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.error.message;
            })
            .addCase(saveGeneralSettings.fulfilled, (state, action) => {
                state.currency = action.payload.currency;
            });
    },
});

export const { setCurrency } = settingsSlice.actions;
export default settingsSlice.reducer;
