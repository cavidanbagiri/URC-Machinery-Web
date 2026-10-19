// src/store/slices/dashboard_slice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import DashboardService from '../services/DashboardService';

const initialState = {
  total: 0,
  byStatus: [],
  pivot: {
    territories: [],
    rows: [],
    grand_totals: {},
    grand_total: 0,
  },
  loading: false,
  pivotLoading: false,
  error: null,
};

export const fetchStatusStatistics = createAsyncThunk(
  'dashboard/fetchStatusStatistics',
  async (_, { rejectWithValue }) => {
    try {
      return await DashboardService.fetchStatusStatistics();
    } catch (err) {
      const message =
        err?.response?.data?.detail ||
        err?.message ||
        'İstatistikler yüklenemedi';
      return rejectWithValue(String(message));
    }
  }
);

// YENİ
export const fetchPivotStatistics = createAsyncThunk(
  'dashboard/fetchPivotStatistics',
  async (_, { rejectWithValue }) => {
    try {
      return await DashboardService.fetchPivotStatistics();
    } catch (err) {
      return rejectWithValue(String(err?.message || 'Pivot verileri yüklenemedi'));
    }
  }
);

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Status
    builder
      .addCase(fetchStatusStatistics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStatusStatistics.fulfilled, (state, action) => {
        state.loading = false;
        state.total = action.payload.total;
        state.byStatus = action.payload.by_status;
      })
      .addCase(fetchStatusStatistics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // PIVOT
      .addCase(fetchPivotStatistics.pending, (state) => {
        state.pivotLoading = true;
        state.error = null;
      })
      .addCase(fetchPivotStatistics.fulfilled, (state, action) => {
        state.pivotLoading = false;
        state.pivot = action.payload;
      })
      .addCase(fetchPivotStatistics.rejected, (state, action) => {
        state.pivotLoading = false;
        state.error = action.payload;
      });
  },
});

export default dashboardSlice.reducer;