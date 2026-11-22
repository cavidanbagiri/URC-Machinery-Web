// src/stores/document_tracking_slice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import DocumentTrackingService from '../services/DocumentTrackingService';

const initialFilters = {
  search: '',
  territory_id: '',
  type_id: '',
  car_mark_id: '',
  car_model_id: '',
};

const initialState = {
  items: [],
  total: 0,
  limit: 100,
  offset: 0,
  filters: { ...initialFilters },
  loading: false,
  error: null,
  listRequestId: null,
  updating: false,
  updatingId: null,
  updateError: null,
};

function errorMessage(err, fallback) {
  const detail = err.response?.data?.detail;
  if (Array.isArray(detail)) {
    return detail.map((d) => d.msg).filter(Boolean).join(', ') || fallback;
  }
  return detail || err.message || fallback;
}

export const fetchDocumentTracking = createAsyncThunk(
  'documentTracking/fetchDocumentTracking',
  async (_, { getState, rejectWithValue }) => {
    const { limit, offset, filters } = getState().documentTracking;
    try {
      return await DocumentTrackingService.fetchDocumentTracking({
        limit,
        offset,
        ...filters,
      });
    } catch (err) {
      return rejectWithValue(
        errorMessage(err, 'Evrak takip listesi yüklenemedi')
      );
    }
  }
);

export const updateDocumentTracking = createAsyncThunk(
  'documentTracking/updateDocumentTracking',
  async ({ machineId, payload }, { rejectWithValue }) => {
    try {
      return await DocumentTrackingService.update(machineId, payload);
    } catch (err) {
      return rejectWithValue(
        errorMessage(err, 'Evrak bilgileri güncellenemedi')
      );
    }
  }
);

const documentTrackingSlice = createSlice({
  name: 'documentTracking',
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
    clearUpdateError(state) {
      state.updateError = null;
    },
  },
  extraReducers: (builder) => {
    // ---------- LIST ----------
    builder
      .addCase(fetchDocumentTracking.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.listRequestId = action.meta.requestId;
      })
      .addCase(fetchDocumentTracking.fulfilled, (state, action) => {
        // Ignore a late response after a newer filter request was sent.
        if (action.meta.requestId !== state.listRequestId) return;
        state.loading = false;
        state.items = action.payload.items;
        state.total = action.payload.total;
        state.limit = action.payload.limit;
        state.offset = action.payload.offset;
      })
      .addCase(fetchDocumentTracking.rejected, (state, action) => {
        if (action.meta.requestId !== state.listRequestId) return;
        state.loading = false;
        state.error = action.payload;
      });

    // ---------- ROW UPDATE ----------
    builder
      .addCase(updateDocumentTracking.pending, (state, action) => {
        state.updating = true;
        state.updatingId = action.meta.arg.machineId;
        state.updateError = null;
      })
      .addCase(updateDocumentTracking.fulfilled, (state, action) => {
        state.updating = false;
        state.updatingId = null;
        const idx = state.items.findIndex(
          (item) => item.machine_id === action.payload.machine_id
        );
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(updateDocumentTracking.rejected, (state, action) => {
        state.updating = false;
        state.updatingId = null;
        state.updateError = action.payload;
      });
  },
});

export const {
  setFilter,
  setFilters,
  resetFilters,
  setLimit,
  setOffset,
  clearUpdateError,
} = documentTrackingSlice.actions;

export default documentTrackingSlice.reducer;
