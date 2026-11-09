// src/stores/tire_slice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import TireService from '../services/TireService';

const initialFilters = {
  search: '',
  position: '',
  date_from: '',
  date_to: '',
};

const initialHistory = {
  tireId: null,
  items: [],
  loading: false,
  error: null,
  requestId: null,
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

  // { tireId, documentId, action: 'upload' | 'delete' } while a PDF request runs
  documentBusy: null,

  // "Eski kayıtlar" panel of one record
  history: { ...initialHistory },
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

export const fetchTires = createAsyncThunk(
  'tire/fetchTires',
  async (_, { getState, rejectWithValue }) => {
    const { limit, offset, filters } = getState().tire;
    try {
      return await TireService.fetchTires({ limit, offset, ...filters });
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Lastik listesi yüklenemedi'));
    }
  }
);

export const fetchTireMachineOptions = createAsyncThunk(
  'tire/fetchMachineOptions',
  async ({ search = '', limit = 20 } = {}, { rejectWithValue }) => {
    try {
      return await TireService.fetchMachineOptions({ search, limit });
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Makine listesi yüklenemedi'));
    }
  }
);

export const fetchTireHistory = createAsyncThunk(
  'tire/fetchHistory',
  async ({ tireId }, { rejectWithValue }) => {
    try {
      return await TireService.fetchHistory(tireId);
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Eski kayıtlar yüklenemedi'));
    }
  }
);

// =========================================================
// WRITE THUNKS
// =========================================================

export const createTireChange = createAsyncThunk(
  'tire/createChange',
  async (payload, { rejectWithValue }) => {
    try {
      return await TireService.createChange(payload);
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Lastik kaydı oluşturulamadı'));
    }
  }
);

export const uploadTireDocument = createAsyncThunk(
  'tire/uploadDocument',
  async ({ tireId, file }, { rejectWithValue }) => {
    try {
      return await TireService.uploadDocument(tireId, file);
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Evrak yüklenemedi'));
    }
  }
);

export const deleteTireDocument = createAsyncThunk(
  'tire/deleteDocument',
  async ({ tireId, documentId }, { rejectWithValue }) => {
    try {
      return await TireService.deleteDocument(tireId, documentId);
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Evrak silinemedi'));
    }
  }
);

// =========================================================
// SLICE
// =========================================================

const tireSlice = createSlice({
  name: 'tire',
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
    clearHistory(state) {
      state.history = { ...initialHistory };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTires.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.listRequestId = action.meta.requestId;
      })
      .addCase(fetchTires.fulfilled, (state, action) => {
        if (action.meta.requestId !== state.listRequestId) return;
        state.loading = false;
        state.items = action.payload.items;
        state.total = action.payload.total;
      })
      .addCase(fetchTires.rejected, (state, action) => {
        if (action.meta.requestId !== state.listRequestId) return;
        state.loading = false;
        state.error = action.payload;
      });

    builder
      .addCase(fetchTireMachineOptions.pending, (state, action) => {
        state.machineOptions.loading = true;
        state.machineOptions.error = null;
        state.machineOptions.requestId = action.meta.requestId;
      })
      .addCase(fetchTireMachineOptions.fulfilled, (state, action) => {
        if (action.meta.requestId !== state.machineOptions.requestId) return;
        state.machineOptions.loading = false;
        state.machineOptions.items = action.payload;
      })
      .addCase(fetchTireMachineOptions.rejected, (state, action) => {
        if (action.meta.requestId !== state.machineOptions.requestId) return;
        state.machineOptions.loading = false;
        state.machineOptions.error = action.payload;
      });

    builder
      .addCase(fetchTireHistory.pending, (state, action) => {
        state.history.loading = true;
        state.history.error = null;
        state.history.items = [];
        state.history.tireId = action.meta.arg.tireId;
        state.history.requestId = action.meta.requestId;
      })
      .addCase(fetchTireHistory.fulfilled, (state, action) => {
        if (action.meta.requestId !== state.history.requestId) return;
        state.history.loading = false;
        state.history.items = action.payload;
      })
      .addCase(fetchTireHistory.rejected, (state, action) => {
        if (action.meta.requestId !== state.history.requestId) return;
        state.history.loading = false;
        state.history.error = action.payload;
      });

    builder
      .addCase(createTireChange.pending, (state) => {
        state.mutating = true;
        state.mutationError = null;
      })
      .addCase(createTireChange.fulfilled, (state, action) => {
        state.mutating = false;
        state.items.unshift(action.payload);
        state.total += 1;
      })
      .addCase(createTireChange.rejected, (state, action) => {
        state.mutating = false;
        state.mutationError = action.payload;
      });

    builder
      .addCase(uploadTireDocument.pending, (state, action) => {
        state.mutationError = null;
        state.documentBusy = {
          tireId: action.meta.arg.tireId,
          action: 'upload',
        };
      })
      .addCase(uploadTireDocument.fulfilled, (state, action) => {
        state.documentBusy = null;
        applyItem(state, action.payload);
      })
      .addCase(uploadTireDocument.rejected, (state, action) => {
        state.documentBusy = null;
        state.mutationError = action.payload;
      });

    builder
      .addCase(deleteTireDocument.pending, (state, action) => {
        state.mutationError = null;
        state.documentBusy = {
          tireId: action.meta.arg.tireId,
          documentId: action.meta.arg.documentId,
          action: 'delete',
        };
      })
      .addCase(deleteTireDocument.fulfilled, (state, action) => {
        state.documentBusy = null;
        applyItem(state, action.payload);
      })
      .addCase(deleteTireDocument.rejected, (state, action) => {
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
  clearHistory,
} = tireSlice.actions;

export default tireSlice.reducer;

