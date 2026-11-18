// src/stores/fuel_log_slice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import FuelLogService from '../services/FuelLogService';

const initialState = {
  overview: {
    fuel_date: null,
    week_start: null,
    month_start: null,
    daily_total: 0,
    weekly_total: 0,
    monthly_total: 0,
    machines: [],
  },
  loading: false,
  error: null,
  listRequestId: null,
  savingMachineId: null,
  mutationError: null,
};

function errorMessage(err, fallback) {
  const detail = err.response?.data?.detail;
  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg).filter(Boolean).join(', ') || fallback;
  }
  return detail || err.message || fallback;
}

function applySavedEntry(state, entry) {
  const { overview } = state;

  // Kullanici kayit sirasinda baska bir gune gectiyse eski cevabi yansitma.
  if (overview.fuel_date !== entry.fuel_date) return;

  const machine = overview.machines.find(
    (item) => item.machine_id === entry.machine_id
  );
  if (!machine) return;

  const liters = Number(entry.liters) || 0;

  machine.day_liters = (Number(machine.day_liters) || 0) + liters;
  machine.day_entry_count = (Number(machine.day_entry_count) || 0) + 1;
  machine.last_given_by = entry.given_by;
  machine.last_note = entry.note;
  machine.last_created_at = entry.created_at;

  overview.daily_total = (Number(overview.daily_total) || 0) + liters;
  overview.weekly_total = (Number(overview.weekly_total) || 0) + liters;
  overview.monthly_total = (Number(overview.monthly_total) || 0) + liters;
}

export const fetchFuelLogOverview = createAsyncThunk(
  'fuelLog/fetchOverview',
  async (params = {}, { rejectWithValue }) => {
    try {
      return await FuelLogService.fetchOverview(params);
    } catch (err) {
      return rejectWithValue(
        errorMessage(err, 'Mazot dağılımı kayıtları yüklenemedi')
      );
    }
  }
);

export const createFuelLog = createAsyncThunk(
  'fuelLog/createLog',
  async (payload, { rejectWithValue }) => {
    try {
      return await FuelLogService.createLog(payload);
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Mazot kaydı kaydedilemedi'));
    }
  }
);

const fuelLogSlice = createSlice({
  name: 'fuelLog',
  initialState,
  reducers: {
    clearMutationError(state) {
      state.mutationError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFuelLogOverview.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.listRequestId = action.meta.requestId;
      })
      .addCase(fetchFuelLogOverview.fulfilled, (state, action) => {
        if (action.meta.requestId !== state.listRequestId) return;
        state.loading = false;
        state.overview = action.payload;
      })
      .addCase(fetchFuelLogOverview.rejected, (state, action) => {
        if (action.meta.requestId !== state.listRequestId) return;
        state.loading = false;
        state.error = action.payload;
      });

    builder
      .addCase(createFuelLog.pending, (state, action) => {
        state.savingMachineId = action.meta.arg.machine_id;
        state.mutationError = null;
      })
      .addCase(createFuelLog.fulfilled, (state, action) => {
        state.savingMachineId = null;
        applySavedEntry(state, action.payload);
      })
      .addCase(createFuelLog.rejected, (state, action) => {
        state.savingMachineId = null;
        state.mutationError = action.payload;
      });
  },
});

export const { clearMutationError } = fuelLogSlice.actions;

export default fuelLogSlice.reducer;
