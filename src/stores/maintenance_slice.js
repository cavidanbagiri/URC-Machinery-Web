// src/stores/maintenance_slice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import MaintenanceService from '../services/MaintenanceService';

// =========================================================
// STATUS / UNIT META — backend ilə eyni kodlar
// =========================================================

export const MAINTENANCE_STATUS_OPTIONS = [
  { code: 'gecikmis', name: 'Gecikmiş', color: 'red' },
  { code: 'yaklasiyor', name: 'Yaklaşıyor', color: 'yellow' },
  { code: 'veri_uyarisi', name: 'Veri uyarısı', color: 'orange' },
  { code: 'veri_eksik', name: 'Veri eksik', color: 'gray' },
  { code: 'plan_yok', name: 'Plan yok', color: 'gray' },
  { code: 'uygun', name: 'Uygun', color: 'green' },
  { code: 'pasif', name: 'Pasif', color: 'slate' },
];

export const MAINTENANCE_UNIT_LABELS = {
  km: 'km',
  hour: 'saat',
};

// =========================================================
// INITIAL FILTERS
// =========================================================

const initialFilters = {
  search: '',
  status: '',
  usage_unit: '',
  has_plan: '',
  territory_id: '',
  type_id: '',
  company_id: '',
  include_inactive: false,
};

const initialState = {
  items: [],
  total: 0,
  limit: 20,
  offset: 0,
  filters: { ...initialFilters },
  // Sıralama filtrelerden ayrı tutulur: "Kalan" kolonu için asc/desc.
  sort_by: '',
  sort_order: '',
  loading: false,
  error: null,
  listRequestId: null,

  summary: null,
  summaryLoading: false,
  summaryError: null,

  history: {
    machineId: null,
    items: [],
    loading: false,
    error: null,
  },

  mutating: false,
  mutationError: null,
};

// =========================================================
// HELPERS
// =========================================================

function errorMessage(err, fallback) {
  const detail = err.response?.data?.detail;
  if (Array.isArray(detail)) {
    return detail.map((d) => d.msg).filter(Boolean).join(', ') || fallback;
  }
  return detail || err.message || fallback;
}

// =========================================================
// ASYNC THUNKS
// =========================================================

export const fetchMaintenance = createAsyncThunk(
  'maintenance/fetchMaintenance',
  async (_, { getState, rejectWithValue }) => {
    const { limit, offset, filters, sort_by, sort_order } = getState().maintenance;
    try {
      return await MaintenanceService.fetchMaintenance({
        limit,
        offset,
        ...filters,
        // Boş değerler servis tarafında temizlenir; varsayılan sıralama korunur.
        sort_by,
        sort_order,
      });
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Bakım listesi yüklenemedi'));
    }
  }
);

export const fetchMaintenanceSummary = createAsyncThunk(
  'maintenance/fetchMaintenanceSummary',
  async (_, { rejectWithValue }) => {
    try {
      return await MaintenanceService.fetchSummary();
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Bakım özeti yüklenemedi'));
    }
  }
);

export const fetchMaintenanceHistory = createAsyncThunk(
  'maintenance/fetchMaintenanceHistory',
  async ({ machineId, limit = 50, offset = 0 }, { rejectWithValue }) => {
    try {
      const items = await MaintenanceService.fetchHistory(machineId, {
        limit,
        offset,
      });
      return { machineId, items };
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Bakım geçmişi yüklenemedi'));
    }
  }
);

export const upsertMaintenanceSettings = createAsyncThunk(
  'maintenance/upsertMaintenanceSettings',
  async ({ machineId, payload }, { rejectWithValue }) => {
    try {
      return await MaintenanceService.upsertSettings(machineId, payload);
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Bakım planı kaydedilemedi'));
    }
  }
);

export const recordMaintenanceReading = createAsyncThunk(
  'maintenance/recordMaintenanceReading',
  async ({ machineId, payload }, { rejectWithValue }) => {
    try {
      return await MaintenanceService.addReading(machineId, payload);
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Sayaç kaydı eklenemedi'));
    }
  }
);

export const completeMaintenance = createAsyncThunk(
  'maintenance/completeMaintenance',
  async ({ machineId, payload }, { rejectWithValue }) => {
    try {
      return await MaintenanceService.complete(machineId, payload);
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Bakım tamamlanamadı'));
    }
  }
);

// =========================================================
// SLICE
// =========================================================

const maintenanceSlice = createSlice({
  name: 'maintenance',
  initialState,
  reducers: {
    setFilter(state, action) {
      const { key, value } = action.payload;
      state.filters[key] = value;
      state.offset = 0;
    },
    setFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload };
      state.offset = 0;
    },
    resetFilters(state) {
      state.filters = { ...initialFilters };
      state.offset = 0;
    },
    setSort(state, action) {
      const { field = '', order = 'asc' } = action.payload || {};
      state.sort_by = field;
      state.sort_order = field ? order : '';
      state.offset = 0;
    },
    resetSort(state) {
      state.sort_by = '';
      state.sort_order = '';
      state.offset = 0;
    },
    setLimit(state, action) {
      state.limit = action.payload;
      state.offset = 0;
    },
    setOffset(state, action) {
      state.offset = action.payload;
    },
    clearMutationError(state) {
      state.mutationError = null;
    },
    clearHistory(state) {
      state.history = { machineId: null, items: [], loading: false, error: null };
    },
  },
  extraReducers: (builder) => {
    // ---------- LIST ----------
    builder
      .addCase(fetchMaintenance.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.listRequestId = action.meta.requestId;
      })
      .addCase(fetchMaintenance.fulfilled, (state, action) => {
        // Hızlı filtre değişimlerinde eski (geç gelen) yanıtı yok say.
        if (action.meta.requestId !== state.listRequestId) return;
        state.loading = false;
        state.items = action.payload.items;
        state.total = action.payload.total;
        state.limit = action.payload.limit;
        state.offset = action.payload.offset;
      })
      .addCase(fetchMaintenance.rejected, (state, action) => {
        if (action.meta.requestId !== state.listRequestId) return;
        state.loading = false;
        state.error = action.payload;
      });

    // ---------- SUMMARY ----------
    builder
      .addCase(fetchMaintenanceSummary.pending, (state) => {
        state.summaryLoading = true;
        state.summaryError = null;
      })
      .addCase(fetchMaintenanceSummary.fulfilled, (state, action) => {
        state.summaryLoading = false;
        state.summary = action.payload;
      })
      .addCase(fetchMaintenanceSummary.rejected, (state, action) => {
        state.summaryLoading = false;
        state.summaryError = action.payload;
      });

    // ---------- HISTORY ----------
    builder
      .addCase(fetchMaintenanceHistory.pending, (state, action) => {
        state.history.machineId = action.meta.arg.machineId;
        state.history.loading = true;
        state.history.error = null;
      })
      .addCase(fetchMaintenanceHistory.fulfilled, (state, action) => {
        // Drawer başka bir makine için açıldıysa eski yanıtı yok say.
        if (state.history.machineId !== action.payload.machineId) return;
        state.history.loading = false;
        state.history.items = action.payload.items;
      })
      .addCase(fetchMaintenanceHistory.rejected, (state, action) => {
        if (state.history.machineId !== action.meta.arg.machineId) return;
        state.history.loading = false;
        state.history.error = action.payload;
      });

    // ---------- MUTATIONS ----------
    builder
      .addCase(upsertMaintenanceSettings.pending, (state) => {
        state.mutating = true;
        state.mutationError = null;
      })
      .addCase(upsertMaintenanceSettings.fulfilled, (state, action) => {
        state.mutating = false;
        const idx = state.items.findIndex(
          (item) => item.machine_id === action.payload.machine_id
        );
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(upsertMaintenanceSettings.rejected, (state, action) => {
        state.mutating = false;
        state.mutationError = action.payload;
      });

    builder
      .addCase(recordMaintenanceReading.pending, (state) => {
        state.mutating = true;
        state.mutationError = null;
      })
      .addCase(recordMaintenanceReading.fulfilled, (state, action) => {
        state.mutating = false;
        const idx = state.items.findIndex(
          (item) => item.machine_id === action.payload.machine_id
        );
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(recordMaintenanceReading.rejected, (state, action) => {
        state.mutating = false;
        state.mutationError = action.payload;
      });

    builder
      .addCase(completeMaintenance.pending, (state) => {
        state.mutating = true;
        state.mutationError = null;
      })
      .addCase(completeMaintenance.fulfilled, (state, action) => {
        state.mutating = false;
        const idx = state.items.findIndex(
          (item) => item.machine_id === action.payload.machine_id
        );
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(completeMaintenance.rejected, (state, action) => {
        state.mutating = false;
        state.mutationError = action.payload;
      });
  },
});

export const {
  setFilter,
  setFilters,
  resetFilters,
  setSort,
  resetSort,
  setLimit,
  setOffset,
  clearMutationError,
  clearHistory,
} = maintenanceSlice.actions;

export default maintenanceSlice.reducer;
