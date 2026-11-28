// src/stores/repair_slice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import RepairService from '../services/RepairService';

export const REPAIR_STATUS_OPTIONS = [
  { code: 'tamirde', name: 'Tamirde', color: 'blue' },
  { code: 'tamamlandi', name: 'Tamamlandı', color: 'green' },
  { code: 'iptal', name: 'İptal edildi', color: 'slate' },
];

const initialFilters = {
  search: '',
  status: '',
  repair_type_id: '',
  garage_service_id: '',
  territory_id: '',
  type_id: '',
  company_id: '',
  date_from: '',
  date_to: '',
  overdue: false,
  due_soon: false,
};

const initialState = {
  items: [],
  total: 0,
  limit: 100,
  offset: 0,
  filters: { ...initialFilters },
  // "Mevcut" (açık tamirler) / "Arşiv" (kapanmış tamirler) sekmesi. Filtreden
  // ayrı tutulur: sekme yalnızca listeyi böler, sütun filtreleri değişmez.
  archive: false,
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

  machineOptions: {
    items: [],
    loading: false,
    error: null,
    requestId: null,
  },

  estimate: {
    repairTypeId: null,
    data: null,
    loading: false,
    error: null,
  },

  mutating: false,
  mutationError: null,

  // { repairId, documentId, action: 'upload' | 'delete' } while a PDF runs
  documentBusy: null,
};

function errorMessage(err, fallback) {
  const detail = err.response?.data?.detail;
  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg).filter(Boolean).join(', ') || fallback;
  }
  return detail || err.message || fallback;
}

function applyItem(state, item) {
  const index = state.items.findIndex((row) => row.id === item.id);
  if (index !== -1) state.items[index] = item;

  const historyIndex = state.history.items.findIndex((row) => row.id === item.id);
  if (historyIndex !== -1) state.history.items[historyIndex] = item;
}

// =========================================================
// READ THUNKS
// =========================================================

export const fetchRepairs = createAsyncThunk(
  'repair/fetchRepairs',
  async (_, { getState, rejectWithValue }) => {
    const { limit, offset, filters, archive } = getState().repair;
    try {
      return await RepairService.fetchRepairs({
        limit,
        offset,
        ...filters,
        // Arşiv sekmesi kapanmış kayıtları ister; "Mevcut" varsayılanı korur.
        archived: archive ? true : undefined,
      });
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Tamir listesi yüklenemedi'));
    }
  }
);

export const fetchRepairSummary = createAsyncThunk(
  'repair/fetchRepairSummary',
  async (_, { rejectWithValue }) => {
    try {
      return await RepairService.fetchSummary();
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Tamir özeti yüklenemedi'));
    }
  }
);

export const fetchRepairHistory = createAsyncThunk(
  'repair/fetchRepairHistory',
  async (machineId, { rejectWithValue }) => {
    try {
      const items = await RepairService.fetchHistory(machineId);
      return { machineId, items };
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Tamir geçmişi yüklenemedi'));
    }
  }
);

export const fetchRepairMachineOptions = createAsyncThunk(
  'repair/fetchMachineOptions',
  async ({ search = '', limit = 20 } = {}, { rejectWithValue }) => {
    try {
      const items = await RepairService.fetchMachineOptions({ search, limit });
      return items;
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Makine listesi yüklenemedi'));
    }
  }
);

export const fetchRepairEstimate = createAsyncThunk(
  'repair/fetchEstimate',
  async (repairTypeId, { rejectWithValue }) => {
    try {
      const data = await RepairService.fetchEstimate(repairTypeId);
      return { repairTypeId, data };
    } catch (err) {
      return rejectWithValue(
        errorMessage(err, 'Tahmini çıkış tarihi hesaplanamadı')
      );
    }
  }
);

// =========================================================
// WRITE THUNKS
// =========================================================

export const createRepair = createAsyncThunk(
  'repair/createRepair',
  async (payload, { rejectWithValue }) => {
    try {
      return await RepairService.createRepair(payload);
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Tamir kaydı oluşturulamadı'));
    }
  }
);

export const quickOpenRepair = createAsyncThunk(
  'repair/quickOpenRepair',
  async (machineId, { rejectWithValue }) => {
    try {
      return await RepairService.quickOpenRepair(machineId);
    } catch (err) {
      return rejectWithValue(
        errorMessage(err, 'Makine tamire alınamadı')
      );
    }
  }
);

export const updateRepair = createAsyncThunk(
  'repair/updateRepair',
  async ({ repairId, payload }, { rejectWithValue }) => {
    try {
      return await RepairService.updateRepair(repairId, payload);
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Tamir kaydı güncellenemedi'));
    }
  }
);

export const closeRepair = createAsyncThunk(
  'repair/closeRepair',
  async ({ repairId, payload }, { rejectWithValue }) => {
    try {
      return await RepairService.closeRepair(repairId, payload);
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Tamir tamamlanamadı'));
    }
  }
);

export const cancelRepair = createAsyncThunk(
  'repair/cancelRepair',
  async ({ repairId, payload }, { rejectWithValue }) => {
    try {
      return await RepairService.cancelRepair(repairId, payload);
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Tamir iptal edilemedi'));
    }
  }
);

export const reopenRepair = createAsyncThunk(
  'repair/reopenRepair',
  async ({ repairId, payload = {} }, { rejectWithValue }) => {
    try {
      return await RepairService.reopenRepair(repairId, payload);
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Tamir yeniden açılamadı'));
    }
  }
);

export const addRepairNote = createAsyncThunk(
  'repair/addRepairNote',
  async ({ repairId, payload }, { rejectWithValue }) => {
    try {
      return await RepairService.addNote(repairId, payload);
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Not eklenemedi'));
    }
  }
);

// Arşivde yanlış girilmiş notu düzeltir. API yalnızca yetkili hesabı kabul
// eder (fyildiz@ustay.com + status 2); diğer kullanıcılar 403 alır.
export const updateRepairArchiveNote = createAsyncThunk(
  'repair/updateArchiveNote',
  async ({ repairId, payload }, { rejectWithValue }) => {
    try {
      return await RepairService.updateArchiveNote(repairId, payload);
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Arşiv notu güncellenemedi'));
    }
  }
);

export const uploadRepairDocument = createAsyncThunk(
  'repair/uploadDocument',
  async ({ repairId, file }, { rejectWithValue }) => {
    try {
      return await RepairService.uploadDocument(repairId, file);
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Evrak yüklenemedi'));
    }
  }
);

export const deleteRepairDocument = createAsyncThunk(
  'repair/deleteDocument',
  async ({ repairId, documentId }, { rejectWithValue }) => {
    try {
      return await RepairService.deleteDocument(repairId, documentId);
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Evrak silinemedi'));
    }
  }
);

// =========================================================
// SLICE
// =========================================================

const repairSlice = createSlice({
  name: 'repair',
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
    setArchive(state, action) {
      const archive = Boolean(action.payload);
      if (state.archive === archive) return;
      state.archive = archive;
      state.offset = 0;
      // Durum filtresi sekmeye özgüdür: "Mevcut" açık tamirleri, "Arşiv"
      // kapanmış kayıtları listeler. Sekme değişince önceki durum filtresi
      // (ve gecikmiş/yaklaşan kısayolları) temizlenir.
      state.filters = { ...state.filters, status: '', overdue: false, due_soon: false };
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
      state.history = {
        machineId: null,
        items: [],
        loading: false,
        error: null,
      };
    },
    clearEstimate(state) {
      state.estimate = {
        repairTypeId: null,
        data: null,
        loading: false,
        error: null,
      };
    },
    clearMachineOptions(state) {
      state.machineOptions = {
        items: [],
        loading: false,
        error: null,
        requestId: null,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRepairs.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.listRequestId = action.meta.requestId;
      })
      .addCase(fetchRepairs.fulfilled, (state, action) => {
        if (action.meta.requestId !== state.listRequestId) return;
        state.loading = false;
        state.items = action.payload.items;
        state.total = action.payload.total;
        state.limit = action.payload.limit;
        state.offset = action.payload.offset;
      })
      .addCase(fetchRepairs.rejected, (state, action) => {
        if (action.meta.requestId !== state.listRequestId) return;
        state.loading = false;
        state.error = action.payload;
      });

    builder
      .addCase(fetchRepairSummary.pending, (state) => {
        state.summaryLoading = true;
        state.summaryError = null;
      })
      .addCase(fetchRepairSummary.fulfilled, (state, action) => {
        state.summaryLoading = false;
        state.summary = action.payload;
      })
      .addCase(fetchRepairSummary.rejected, (state, action) => {
        state.summaryLoading = false;
        state.summaryError = action.payload;
      });

    builder
      .addCase(fetchRepairHistory.pending, (state, action) => {
        state.history.machineId = action.meta.arg;
        state.history.loading = true;
        state.history.error = null;
      })
      .addCase(fetchRepairHistory.fulfilled, (state, action) => {
        if (state.history.machineId !== action.payload.machineId) return;
        state.history.loading = false;
        state.history.items = action.payload.items;
      })
      .addCase(fetchRepairHistory.rejected, (state, action) => {
        if (state.history.machineId !== action.meta.arg) return;
        state.history.loading = false;
        state.history.error = action.payload;
      });

    builder
      .addCase(fetchRepairMachineOptions.pending, (state, action) => {
        state.machineOptions.loading = true;
        state.machineOptions.error = null;
        state.machineOptions.requestId = action.meta.requestId;
      })
      .addCase(fetchRepairMachineOptions.fulfilled, (state, action) => {
        if (action.meta.requestId !== state.machineOptions.requestId) return;
        state.machineOptions.loading = false;
        state.machineOptions.items = action.payload;
      })
      .addCase(fetchRepairMachineOptions.rejected, (state, action) => {
        if (action.meta.requestId !== state.machineOptions.requestId) return;
        state.machineOptions.loading = false;
        state.machineOptions.error = action.payload;
      });

    builder
      .addCase(fetchRepairEstimate.pending, (state, action) => {
        state.estimate.repairTypeId = action.meta.arg;
        state.estimate.loading = true;
        state.estimate.error = null;
      })
      .addCase(fetchRepairEstimate.fulfilled, (state, action) => {
        if (state.estimate.repairTypeId !== action.payload.repairTypeId) return;
        state.estimate.loading = false;
        state.estimate.data = action.payload.data;
      })
      .addCase(fetchRepairEstimate.rejected, (state, action) => {
        if (state.estimate.repairTypeId !== action.meta.arg) return;
        state.estimate.loading = false;
        state.estimate.error = action.payload;
      });

    const mutationThunks = [
      createRepair,
      quickOpenRepair,
      updateRepair,
      closeRepair,
      cancelRepair,
      reopenRepair,
      addRepairNote,
      updateRepairArchiveNote,
    ];

    mutationThunks.forEach((thunk) => {
      builder
        .addCase(thunk.pending, (state) => {
          state.mutating = true;
          state.mutationError = null;
        })
        .addCase(thunk.fulfilled, (state, action) => {
          state.mutating = false;
          applyItem(state, action.payload);
        })
        .addCase(thunk.rejected, (state, action) => {
          state.mutating = false;
          state.mutationError = action.payload;
        });
    });

    builder
      .addCase(uploadRepairDocument.pending, (state, action) => {
        state.mutationError = null;
        state.documentBusy = {
          repairId: action.meta.arg.repairId,
          action: 'upload',
        };
      })
      .addCase(uploadRepairDocument.fulfilled, (state, action) => {
        state.documentBusy = null;
        applyItem(state, action.payload);
      })
      .addCase(uploadRepairDocument.rejected, (state, action) => {
        state.documentBusy = null;
        state.mutationError = action.payload;
      });

    builder
      .addCase(deleteRepairDocument.pending, (state, action) => {
        state.mutationError = null;
        state.documentBusy = {
          repairId: action.meta.arg.repairId,
          documentId: action.meta.arg.documentId,
          action: 'delete',
        };
      })
      .addCase(deleteRepairDocument.fulfilled, (state, action) => {
        state.documentBusy = null;
        applyItem(state, action.payload);
      })
      .addCase(deleteRepairDocument.rejected, (state, action) => {
        state.documentBusy = null;
        state.mutationError = action.payload;
      });
  },
});

export const {
  setFilter,
  setFilters,
  resetFilters,
  setArchive,
  setLimit,
  setOffset,
  clearMutationError,
  clearHistory,
  clearEstimate,
  clearMachineOptions,
} = repairSlice.actions;

export default repairSlice.reducer;
