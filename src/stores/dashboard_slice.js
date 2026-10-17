// src/store/slices/dashboard_slice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import DashboardService from '../services/DashboardService';

const initialState = {
  total: 0,
  byStatus: [],
  loading: false,
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
        'Statistika yüklənə bilmədi';
      return rejectWithValue(String(message));
    }
  }
);

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
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
      });
  },
});

export default dashboardSlice.reducer;