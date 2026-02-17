import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchGeneralSettings = createAsyncThunk(
    'settings/fetchGeneralSettings',
    async (_, { getState }) => {
        const state: any = getState();
        const token = state.auth.token;
        if ((window as any).electronAPI) {
            const settings = await (window as any).electronAPI.getGeneralSettings(token);
            return settings || { currency: '₹' };
        }
        return { currency: '₹' };
    }
);

export const saveGeneralSettings = createAsyncThunk(
    'settings/saveGeneralSettings',
    async (settings: any, { getState }) => {
        const state: any = getState();
        const token = state.auth.token;
        if ((window as any).electronAPI) {
            await (window as any).electronAPI.saveGeneralSettings(settings, token);
        }
        return settings;
    }
);

const settingsSlice = createSlice({
    name: 'settings',
    initialState: {
        currency: '₹',
        status: 'idle',
        error: null as string | null,
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
                state.error = action.error.message || 'Failed to fetch settings';
            })
            .addCase(saveGeneralSettings.fulfilled, (state, action) => {
                state.currency = action.payload.currency;
            });
    },
});

export const { setCurrency } = settingsSlice.actions;
export default settingsSlice.reducer;
