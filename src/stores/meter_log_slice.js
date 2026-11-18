// src/stores/meter_log_slice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import MeterLogService from '../services/MeterLogService';

const initialState = {
  overview: {
    start_date: null,
    end_date: null,
    days: 7,
    total_recent_logs: 0,
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
  const machine = overview.machines.find(
    (item) => item.machine_id === entry.machine_id
  );
  if (!machine) return;

  const logs = machine.recent_logs || [];
  if (!logs.some((log) => log.id === entry.id)) {
    logs.push(entry);
    logs.sort(
      (a, b) =>
        String(a.log_date).localeCompare(String(b.log_date)) ||
        new Date(a.created_at || 0) - new Date(b.created_at || 0) ||
        (a.id || 0) - (b.id || 0)
    );
    machine.recent_logs = logs;

    if (
      overview.start_date &&
      overview.end_date &&
      entry.log_date >= overview.start_date &&
      entry.log_date <= overview.end_date
    ) {
      overview.total_recent_logs += 1;
    }
  }

  // Yeni kayıt makinenin en güncel okuması mı? Tarih + oluşturulma zamanı.
  const isLatest =
    !machine.last_log_date ||
    entry.log_date > machine.last_log_date ||
    (entry.log_date === machine.last_log_date &&
      new Date(entry.created_at || 0) >= new Date(machine.last_logged_at || 0));

  if (isLatest) {
    machine.last_km = entry.km;
    machine.last_engine_hours = entry.engine_hours;
    machine.last_log_date = entry.log_date;
    machine.last_logged_at = entry.created_at;
  }
}

export const fetchMeterLogOverview = createAsyncThunk(
  'meterLog/fetchOverview',
  async (params = {}, { rejectWithValue }) => {
    try {
      return await MeterLogService.fetchOverview(params);
    } catch (err) {
      return rejectWithValue(
        errorMessage(err, 'KM / motor saati kayıtları yüklenemedi')
      );
    }
  }
);

export const createMeterLog = createAsyncThunk(
  'meterLog/createLog',
  async (payload, { rejectWithValue }) => {
    try {
      return await MeterLogService.createLog(payload);
    } catch (err) {
      return rejectWithValue(
        errorMessage(err, 'KM / motor saati kaydedilemedi')
      );
    }
  }
);

const meterLogSlice = createSlice({
  name: 'meterLog',
  initialState,
  reducers: {
    clearMutationError(state) {
      state.mutationError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMeterLogOverview.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.listRequestId = action.meta.requestId;
      })
      .addCase(fetchMeterLogOverview.fulfilled, (state, action) => {
        if (action.meta.requestId !== state.listRequestId) return;
        state.loading = false;
        state.overview = action.payload;
      })
      .addCase(fetchMeterLogOverview.rejected, (state, action) => {
        if (action.meta.requestId !== state.listRequestId) return;
        state.loading = false;
        state.error = action.payload;
      });

    builder
      .addCase(createMeterLog.pending, (state, action) => {
        state.savingMachineId = action.meta.arg.machine_id;
        state.mutationError = null;
      })
      .addCase(createMeterLog.fulfilled, (state, action) => {
        state.savingMachineId = null;
        applySavedEntry(state, action.payload);
      })
      .addCase(createMeterLog.rejected, (state, action) => {
        state.savingMachineId = null;
        state.mutationError = action.payload;
      });
  },
});

export const { clearMutationError } = meterLogSlice.actions;

export default meterLogSlice.reducer;
