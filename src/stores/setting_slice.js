// src/store/slices/setting_slice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import SettingService, { LOOKUP_CONFIG } from '../services/SettingsService';

// =========================================================
// INITIAL STATE
// =========================================================

const initialState = {
  activeTab: 'territory',         // hansı lookup aktivdir
  data: {},                       // { territory: [...], type_transport: [...] }
  loading: false,
  error: null,
};

// Hər lookup üçün boş array başlanğıcda
Object.keys(LOOKUP_CONFIG).forEach((key) => {
  initialState.data[key] = [];
});


// =========================================================
// ASYNC THUNKS
// =========================================================

export const fetchLookup = createAsyncThunk(
  'setting/fetchLookup',
  async (key, { rejectWithValue }) => {
    try {
      const data = await SettingService.fetchAll(key);
      return { key, data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Fetch xətası');
    }
  }
);

export const createLookup = createAsyncThunk(
  'setting/createLookup',
  async ({ key, payload }, { rejectWithValue }) => {
    try {
      const data = await SettingService.create(key, payload);
      return { key, data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Create xətası');
    }
  }
);

export const updateLookup = createAsyncThunk(
  'setting/updateLookup',
  async ({ key, id, payload }, { rejectWithValue }) => {
    try {
      const data = await SettingService.update(key, id, payload);
      return { key, data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Update xətası');
    }
  }
);

export const deleteLookup = createAsyncThunk(
  'setting/deleteLookup',
  async ({ key, id }, { rejectWithValue }) => {
    try {
      await SettingService.delete(key, id);
      return { key, id };
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Delete xətası');
    }
  }
);


// =========================================================
// SLICE
// =========================================================

const settingSlice = createSlice({
  name: 'setting',
  initialState,
  reducers: {
    setActiveTab(state, action) {
      state.activeTab = action.payload;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // ---------- FETCH ----------
    builder
      .addCase(fetchLookup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLookup.fulfilled, (state, action) => {
        state.loading = false;
        state.data[action.payload.key] = action.payload.data;
      })
      .addCase(fetchLookup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // ---------- CREATE ----------
    builder
      .addCase(createLookup.fulfilled, (state, action) => {
        state.data[action.payload.key].push(action.payload.data);
      })
      .addCase(createLookup.rejected, (state, action) => {
        state.error = action.payload;
      });

    // ---------- UPDATE ----------
    builder
      .addCase(updateLookup.fulfilled, (state, action) => {
        const { key, data } = action.payload;
        const arr = state.data[key];
        const idx = arr.findIndex((item) => item.id === data.id);
        if (idx !== -1) arr[idx] = data;
      })
      .addCase(updateLookup.rejected, (state, action) => {
        state.error = action.payload;
      });

    // ---------- DELETE ----------
    builder
      .addCase(deleteLookup.fulfilled, (state, action) => {
        const { key, id } = action.payload;
        state.data[key] = state.data[key].filter((item) => item.id !== id);
      })
      .addCase(deleteLookup.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { setActiveTab, clearError } = settingSlice.actions;
export default settingSlice.reducer;