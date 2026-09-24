// src/store/slices/lookup_slice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import SettingService, { LOOKUP_CONFIG } from '../services/SettingsService';

// =========================================================
// STATE
// =========================================================

const initialState = {
  data: {},        // { territory: [...], company: [...] }
  loaded: {},      // { territory: true, company: true } — bir dəfə fetch edilib?
  loading: false,
  error: null,
};

Object.keys(LOOKUP_CONFIG).forEach((key) => {
  initialState.data[key] = [];
  initialState.loaded[key] = false;
});


// =========================================================
// ASYNC THUNK
// =========================================================

export const fetchLookupIfNeeded = createAsyncThunk(
  'lookup/fetchIfNeeded',
  async (key, { getState, rejectWithValue }) => {
    const state = getState().lookup;

    // Əgər artıq yüklənibsə — fetch etmə
    if (state.loaded[key]) {
      return { key, data: state.data[key], cached: true };
    }

    try {
      const data = await SettingService.fetchAll(key);
      return { key, data, cached: false };
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Lookup fetch xətası');
    }
  }
);


// =========================================================
// SLICE
// =========================================================

const lookupSlice = createSlice({
  name: 'lookup',
  initialState,
  reducers: {
    invalidateLookup(state, action) {
      // Məsələn, yeni territory yaradıldıqda cache-i sıfırla
      const key = action.payload;
      state.loaded[key] = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLookupIfNeeded.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLookupIfNeeded.fulfilled, (state, action) => {
        state.loading = false;
        const { key, data, cached } = action.payload;
        if (!cached) {
          state.data[key] = data;
          state.loaded[key] = true;
        }
      })
      .addCase(fetchLookupIfNeeded.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { invalidateLookup } = lookupSlice.actions;
export default lookupSlice.reducer;