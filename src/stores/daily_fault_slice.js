// src/stores/daily_fault_slice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import DailyFaultService from '../services/DailyFaultService';

const initialFilters = {
  search: '',
  territory_id: '',
  repair_type_id: '',
  date_from: '',
  date_to: '',
};

const initialState = {
  items: [],
  total: 0,
  limit: 20,
  offset: 0,
  filters: { ...initialFilters },
  loading: false,
  error: null,
  listRequestId: null,

  machineOptions: {
    items: [],
    loading: false,
    error: null,
    requestId: null,
  },

  mutating: false,
  mutationError: null,

  // { faultId, documentId, action: 'upload' | 'delete' } while a PDF request runs
  documentBusy: null,
};

function errorMessage(err, fallback) {
  const detail = err.response?.data?.detail;
  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg).filter(Boolean).join(', ') || fallback;
  }
  // Document downloads use responseType "blob", so the JSON body is a Blob.
  if (typeof Blob !== 'undefined' && detail instanceof Blob) return fallback;
  return detail || err.message || fallback;
}

function applyItem(state, item) {
  const index = state.items.findIndex((row) => row.id === item.id);
  if (index !== -1) state.items[index] = item;
}

// =========================================================
// READ THUNKS
// =========================================================

export const fetchDailyFaults = createAsyncThunk(
  'dailyFault/fetchFaults',
  async (_, { getState, rejectWithValue }) => {
    const { limit, offset, filters } = getState().dailyFault;
    try {
      return await DailyFaultService.fetchFaults({ limit, offset, ...filters });
    } catch (err) {
      return rejectWithValue(
        errorMessage(err, 'Günlük arıza listesi yüklenemedi')
      );
    }
  }
);

export const fetchDailyFaultMachineOptions = createAsyncThunk(
  'dailyFault/fetchMachineOptions',
  async ({ search = '', limit = 20 } = {}, { rejectWithValue }) => {
    try {
      return await DailyFaultService.fetchMachineOptions({ search, limit });
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Makine listesi yüklenemedi'));
    }
  }
);

// =========================================================
// WRITE THUNKS
// =========================================================

export const createDailyFault = createAsyncThunk(
  'dailyFault/createFault',
  async (payload, { rejectWithValue }) => {
    try {
      return await DailyFaultService.createFault(payload);
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Günlük arıza kaydı açılamadı'));
    }
  }
);

export const uploadDailyFaultDocument = createAsyncThunk(
  'dailyFault/uploadDocument',
  async ({ faultId, file }, { rejectWithValue }) => {
    try {
      return await DailyFaultService.uploadDocument(faultId, file);
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Evrak yüklenemedi'));
    }
  }
);

export const deleteDailyFaultDocument = createAsyncThunk(
  'dailyFault/deleteDocument',
  async ({ faultId, documentId }, { rejectWithValue }) => {
    try {
      return await DailyFaultService.deleteDocument(faultId, documentId);
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Evrak silinemedi'));
    }
  }
);

// =========================================================
// SLICE
// =========================================================

const dailyFaultSlice = createSlice({
  name: 'dailyFault',
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
    clearMachineOptions(state) {
      state.machineOptions = { ...initialState.machineOptions };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDailyFaults.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.listRequestId = action.meta.requestId;
      })
      .addCase(fetchDailyFaults.fulfilled, (state, action) => {
        if (action.meta.requestId !== state.listRequestId) return;
        state.loading = false;
        state.items = action.payload.items;
        state.total = action.payload.total;
      })
      .addCase(fetchDailyFaults.rejected, (state, action) => {
        if (action.meta.requestId !== state.listRequestId) return;
        state.loading = false;
        state.error = action.payload;
      });

    builder
      .addCase(fetchDailyFaultMachineOptions.pending, (state, action) => {
        state.machineOptions.loading = true;
        state.machineOptions.error = null;
        state.machineOptions.requestId = action.meta.requestId;
      })
      .addCase(fetchDailyFaultMachineOptions.fulfilled, (state, action) => {
        if (action.meta.requestId !== state.machineOptions.requestId) return;
        state.machineOptions.loading = false;
        state.machineOptions.items = action.payload;
      })
      .addCase(fetchDailyFaultMachineOptions.rejected, (state, action) => {
        if (action.meta.requestId !== state.machineOptions.requestId) return;
        state.machineOptions.loading = false;
        state.machineOptions.error = action.payload;
      });

    builder
      .addCase(createDailyFault.pending, (state) => {
        state.mutating = true;
        state.mutationError = null;
      })
      .addCase(createDailyFault.fulfilled, (state, action) => {
        state.mutating = false;
        state.items.unshift(action.payload);
        state.total += 1;
      })
      .addCase(createDailyFault.rejected, (state, action) => {
        state.mutating = false;
        state.mutationError = action.payload;
      });

    builder
      .addCase(uploadDailyFaultDocument.pending, (state, action) => {
        state.mutationError = null;
        state.documentBusy = {
          faultId: action.meta.arg.faultId,
          action: 'upload',
        };
      })
      .addCase(uploadDailyFaultDocument.fulfilled, (state, action) => {
        state.documentBusy = null;
        applyItem(state, action.payload);
      })
      .addCase(uploadDailyFaultDocument.rejected, (state, action) => {
        state.documentBusy = null;
        state.mutationError = action.payload;
      });

    builder
      .addCase(deleteDailyFaultDocument.pending, (state, action) => {
        state.mutationError = null;
        state.documentBusy = {
          faultId: action.meta.arg.faultId,
          documentId: action.meta.arg.documentId,
          action: 'delete',
        };
      })
      .addCase(deleteDailyFaultDocument.fulfilled, (state, action) => {
        state.documentBusy = null;
        applyItem(state, action.payload);
      })
      .addCase(deleteDailyFaultDocument.rejected, (state, action) => {
        state.documentBusy = null;
        state.mutationError = action.payload;
      });
  },
});

export const {
  setFilter,
  setFilters,
  resetFilters,
  setLimit,
  setOffset,
  clearMutationError,
  clearMachineOptions,
} = dailyFaultSlice.actions;

export default dailyFaultSlice.reducer;

