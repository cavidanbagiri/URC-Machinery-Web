// src/stores/isg_slice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import IsgService from '../services/IsgService';

// =========================================================
// INITIAL STATE
// =========================================================

const initialFilters = {
  search: '',
  status: '',
  territory_id: '',
  responsible_name: '',
  date_from: '',
  date_to: '',
};

export const EMPTY_ISG_OVERVIEW = {
  total: 0,
  open_total: 0,
  closed_total: 0,
  sru_opened: 0,
  sru_open: 0,
  sru_closed: 0,
  dcu_opened: 0,
  dcu_open: 0,
  dcu_closed: 0,
  sites_closed_total: 0,
};

const initialState = {
  items: [],
  total: 0,
  limit: 50,
  offset: 0,
  filters: { ...initialFilters },
  loading: false,
  error: null,
  listRequestId: null,

  overview: null,
  overviewLoading: false,
  overviewError: null,

  responsibles: [],
  responsiblesLoaded: false,

  saving: false,
  deletingId: null,
  statusBusyId: null,
  // { itemId, action: 'upload' } or { itemId, attachmentId, action: 'delete' }
  attachmentBusy: null,
  mutationError: null,
};

function errorMessage(err, fallback) {
  const detail = err.response?.data?.detail;
  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg).filter(Boolean).join(', ') || fallback;
  }
  // Attachment downloads use responseType "blob", so a JSON error is a Blob.
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

export const fetchIsgItems = createAsyncThunk(
  'isg/fetchItems',
  async (_, { getState, rejectWithValue }) => {
    const { limit, offset, filters } = getState().isg;
    try {
      return await IsgService.fetchNonconformities({
        limit,
        offset,
        ...filters,
      });
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'ISG listesi yüklenemedi'));
    }
  }
);

export const fetchIsgOverview = createAsyncThunk(
  'isg/fetchOverview',
  async (_, { rejectWithValue }) => {
    try {
      return await IsgService.fetchOverview();
    } catch (err) {
      return rejectWithValue(
        errorMessage(err, 'ISG istatistikleri yüklenemedi')
      );
    }
  }
);

export const fetchIsgResponsibles = createAsyncThunk(
  'isg/fetchResponsibles',
  async (force = false, { getState, rejectWithValue }) => {
    const { responsibles, responsiblesLoaded } = getState().isg;
    if (responsiblesLoaded && !force) return responsibles;

    try {
      const data = await IsgService.fetchResponsibles();
      return data.items || [];
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Sorumlu listesi yüklenemedi'));
    }
  }
);

// =========================================================
// WRITE THUNKS
// =========================================================

export const createIsgItem = createAsyncThunk(
  'isg/createItem',
  async (payload, { rejectWithValue }) => {
    try {
      return await IsgService.create(payload);
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'ISG kaydı oluşturulamadı'));
    }
  }
);

export const updateIsgItem = createAsyncThunk(
  'isg/updateItem',
  async ({ itemId, payload }, { rejectWithValue }) => {
    try {
      return await IsgService.update(itemId, payload);
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'ISG kaydı güncellenemedi'));
    }
  }
);

export const changeIsgStatus = createAsyncThunk(
  'isg/changeStatus',
  async ({ itemId, status }, { rejectWithValue }) => {
    try {
      return await IsgService.setStatus(itemId, status);
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'ISG durumu güncellenemedi'));
    }
  }
);

export const deleteIsgItem = createAsyncThunk(
  'isg/deleteItem',
  async (itemId, { rejectWithValue }) => {
    try {
      await IsgService.remove(itemId);
      return itemId;
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'ISG kaydı silinemedi'));
    }
  }
);

export const uploadIsgAttachment = createAsyncThunk(
  'isg/uploadAttachment',
  async ({ itemId, file }, { rejectWithValue }) => {
    try {
      return await IsgService.uploadAttachment(itemId, file);
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Kanıt yüklenemedi'));
    }
  }
);

export const deleteIsgAttachment = createAsyncThunk(
  'isg/deleteAttachment',
  async ({ itemId, attachmentId }, { rejectWithValue }) => {
    try {
      return await IsgService.deleteAttachment(itemId, attachmentId);
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Kanıt silinemedi'));
    }
  }
);

// =========================================================
// SLICE
// =========================================================

const isgSlice = createSlice({
  name: 'isg',
  initialState,
  reducers: {
    setFilter(state, action) {
      const { key, value } = action.payload;
      state.filters[key] = value;
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
  },
  extraReducers: (builder) => {
    // ---------- LIST ----------
    builder
      .addCase(fetchIsgItems.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.listRequestId = action.meta.requestId;
      })
      .addCase(fetchIsgItems.fulfilled, (state, action) => {
        // Ignore a late response after a newer filter request was sent.
        if (action.meta.requestId !== state.listRequestId) return;
        state.loading = false;
        state.items = action.payload.items;
        state.total = action.payload.total;
        state.limit = action.payload.limit;
        state.offset = action.payload.offset;
      })
      .addCase(fetchIsgItems.rejected, (state, action) => {
        if (action.meta.requestId !== state.listRequestId) return;
        state.loading = false;
        state.error = action.payload;
      });

    // ---------- STATS ----------
    builder
      .addCase(fetchIsgOverview.pending, (state) => {
        state.overviewLoading = true;
        state.overviewError = null;
      })
      .addCase(fetchIsgOverview.fulfilled, (state, action) => {
        state.overviewLoading = false;
        state.overview = { ...EMPTY_ISG_OVERVIEW, ...(action.payload || {}) };
      })
      .addCase(fetchIsgOverview.rejected, (state, action) => {
        state.overviewLoading = false;
        state.overviewError = action.payload;
      });

    // ---------- RESPONSIBLES ----------
    builder
      .addCase(fetchIsgResponsibles.fulfilled, (state, action) => {
        state.responsibles = action.payload;
        state.responsiblesLoaded = true;
      })
      .addCase(fetchIsgResponsibles.rejected, (state, action) => {
        state.mutationError = action.payload;
      });

    // ---------- CREATE / UPDATE ----------
    builder
      .addCase(createIsgItem.pending, (state) => {
        state.saving = true;
        state.mutationError = null;
      })
      .addCase(createIsgItem.fulfilled, (state) => {
        state.saving = false;
        // The page reloads the list so the new row lands on the right page.
        state.offset = 0;
      })
      .addCase(createIsgItem.rejected, (state, action) => {
        state.saving = false;
        state.mutationError = action.payload;
      })
      .addCase(updateIsgItem.pending, (state) => {
        state.saving = true;
        state.mutationError = null;
      })
      .addCase(updateIsgItem.fulfilled, (state, action) => {
        state.saving = false;
        applyItem(state, action.payload);
      })
      .addCase(updateIsgItem.rejected, (state, action) => {
        state.saving = false;
        state.mutationError = action.payload;
      });

    // ---------- STATUS ----------
    builder
      .addCase(changeIsgStatus.pending, (state, action) => {
        state.statusBusyId = action.meta.arg.itemId;
        state.mutationError = null;
      })
      .addCase(changeIsgStatus.fulfilled, (state, action) => {
        state.statusBusyId = null;
        applyItem(state, action.payload);
      })
      .addCase(changeIsgStatus.rejected, (state, action) => {
        state.statusBusyId = null;
        state.mutationError = action.payload;
      });

    // ---------- DELETE ----------
    builder
      .addCase(deleteIsgItem.pending, (state, action) => {
        state.deletingId = action.meta.arg;
        state.mutationError = null;
      })
      .addCase(deleteIsgItem.fulfilled, (state, action) => {
        state.deletingId = null;
        state.items = state.items.filter(
          (item) => item.id !== action.payload
        );
        state.total = Math.max(0, state.total - 1);
        // The last row of a page was removed: step back one page instead of
        // showing an empty page while the counters say otherwise.
        if (state.items.length === 0 && state.offset > 0) {
          state.offset = Math.max(0, state.offset - state.limit);
        }
      })
      .addCase(deleteIsgItem.rejected, (state, action) => {
        state.deletingId = null;
        state.mutationError = action.payload;
      });

    // ---------- EVIDENCE ----------
    builder
      .addCase(uploadIsgAttachment.pending, (state, action) => {
        state.attachmentBusy = {
          itemId: action.meta.arg.itemId,
          action: 'upload',
        };
        state.mutationError = null;
      })
      .addCase(uploadIsgAttachment.fulfilled, (state, action) => {
        state.attachmentBusy = null;
        applyItem(state, action.payload);
      })
      .addCase(uploadIsgAttachment.rejected, (state, action) => {
        state.attachmentBusy = null;
        state.mutationError = action.payload;
      })
      .addCase(deleteIsgAttachment.pending, (state, action) => {
        state.attachmentBusy = {
          itemId: action.meta.arg.itemId,
          attachmentId: action.meta.arg.attachmentId,
          action: 'delete',
        };
        state.mutationError = null;
      })
      .addCase(deleteIsgAttachment.fulfilled, (state, action) => {
        state.attachmentBusy = null;
        applyItem(state, action.payload);
      })
      .addCase(deleteIsgAttachment.rejected, (state, action) => {
        state.attachmentBusy = null;
        state.mutationError = action.payload;
      });
  },
});

export const {
  setFilter,
  resetFilters,
  setLimit,
  setOffset,
  clearMutationError,
} = isgSlice.actions;

export default isgSlice.reducer;
