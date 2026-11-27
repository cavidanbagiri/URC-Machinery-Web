// src/stores/meter_log_slice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import MeterLogService from '../services/MeterLogService';

/** İşlemler → Düzenle penceresinin durumu; kapatınca sıfırlanır. */
function emptyEditing() {
  return {
    machineId: null,
    entries: [],
    loading: false,
    error: null,
    savingEntryId: null,
  };
}

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
  editing: emptyEditing(),
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

/**
 * Bir makinenin son okumalarını getirir (İşlemler → Düzenle).
 * `endDate` sayfadaki seçili gündür; sunucu pencereyi bugünden ileri taşımaz.
 */
export const fetchMeterLogEntries = createAsyncThunk(
  'meterLog/fetchEntries',
  async ({ machineId, endDate, days }, { rejectWithValue }) => {
    try {
      const entries = await MeterLogService.fetchEntries({
        machine_id: machineId,
        end_date: endDate,
        days,
      });
      return { machineId, entries };
    } catch (err) {
      return rejectWithValue(
        errorMessage(err, 'KM / motor saati kayıtları yüklenemedi')
      );
    }
  }
);

/** Kaydedilmiş bir okumayı yerinde düzeltir; yeni satır eklemez. */
export const updateMeterLogEntry = createAsyncThunk(
  'meterLog/updateEntry',
  async ({ entryId, changes }, { rejectWithValue }) => {
    try {
      return await MeterLogService.updateLog(entryId, changes);
    } catch (err) {
      return rejectWithValue(
        errorMessage(err, 'KM / motor saati kaydı güncellenemedi')
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
    /** Düzenle penceresi kapanınca satırlar ve hata durumu arkada kalmasın. */
    resetMeterLogEntries(state) {
      state.editing = emptyEditing();
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

    builder
      .addCase(fetchMeterLogEntries.pending, (state, action) => {
        state.editing.machineId = action.meta.arg.machineId;
        // Başka makinenin satırları pencere açılırken görünmesin.
        state.editing.entries = [];
        state.editing.loading = true;
        state.editing.error = null;
        state.editing.savingEntryId = null;
      })
      .addCase(fetchMeterLogEntries.fulfilled, (state, action) => {
        state.editing.loading = false;
        state.editing.machineId = action.payload.machineId;
        state.editing.entries = action.payload.entries;
      })
      .addCase(fetchMeterLogEntries.rejected, (state, action) => {
        state.editing.loading = false;
        state.editing.error = action.payload;
      });

    builder
      .addCase(updateMeterLogEntry.pending, (state, action) => {
        state.editing.savingEntryId = action.meta.arg.entryId;
        state.editing.error = null;
        state.mutationError = null;
      })
      .addCase(updateMeterLogEntry.fulfilled, (state, action) => {
        state.editing.savingEntryId = null;
        // Düzeltilen satır listede yerinde güncellenir. Sayfa ayrıca özeti
        // sunucudan yeniler: "en yeni okuma" ve fark sütunları değişebilir.
        const index = state.editing.entries.findIndex(
          (entry) => entry.id === action.payload.id
        );
        if (index !== -1) {
          state.editing.entries[index] = action.payload;
        }
      })
      .addCase(updateMeterLogEntry.rejected, (state, action) => {
        state.editing.savingEntryId = null;
        state.editing.error = action.payload;
        state.mutationError = action.payload;
      });
  },
});

export const { clearMutationError, resetMeterLogEntries } = meterLogSlice.actions;

export default meterLogSlice.reducer;
