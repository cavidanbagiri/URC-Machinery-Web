// src/stores/purchase_request_slice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import PurchaseRequestService from '../services/PurchaseRequestService';

export const SPARE_TAB = 'spareParts';
export const SERVICE_TAB = 'serviceRequests';

const initialSpareFilters = {
  search: '',
  status: '',
  territory_id: '',
  request_type_id: '',
  date_from: '',
  date_to: '',
};

const initialServiceFilters = {
  search: '',
  date_from: '',
  date_to: '',
};

function initialList(filters) {
  return {
    items: [],
    total: 0,
    limit: 20,
    offset: 0,
    filters: { ...filters },
    loading: false,
    error: null,
    requestId: null,
  };
}

const initialState = {
  activeTab: SPARE_TAB,
  spareParts: initialList(initialSpareFilters),
  serviceRequests: initialList(initialServiceFilters),

  requestTypes: { items: [], loading: false, error: null },

  mutating: false,
  mutationError: null,
  // { id, scope } while a status toggle or a delete request runs
  rowBusy: null,
};

function errorMessage(err, fallback) {
  const detail = err.response?.data?.detail;
  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg).filter(Boolean).join(', ') || fallback;
  }
  return detail || err.message || fallback;
}

function applyItem(state, scope, item) {
  const list = state[scope];
  if (!list) return;
  const index = list.items.findIndex((row) => row.id === item.id);
  if (index !== -1) list.items[index] = item;
}

function removeItem(state, scope, id) {
  const list = state[scope];
  if (!list) return;
  const index = list.items.findIndex((row) => row.id === id);
  if (index === -1) return;
  list.items.splice(index, 1);
  list.total = Math.max(0, list.total - 1);
}

// =========================================================
// READ THUNKS
// =========================================================

export const fetchSparePartRequests = createAsyncThunk(
  'purchaseRequest/fetchSpareParts',
  async (_, { getState, rejectWithValue }) => {
    const { limit, offset, filters } = getState().purchaseRequest.spareParts;
    try {
      const data = await PurchaseRequestService.fetchSpareParts({
        limit,
        offset,
        ...filters,
      });
      return { ...data, offset };
    } catch (err) {
      return rejectWithValue(
        errorMessage(err, 'Yedek parça talepleri yüklenemedi')
      );
    }
  }
);

export const fetchServiceRequests = createAsyncThunk(
  'purchaseRequest/fetchServiceRequests',
  async (_, { getState, rejectWithValue }) => {
    const { limit, offset, filters } =
      getState().purchaseRequest.serviceRequests;
    try {
      const data = await PurchaseRequestService.fetchServiceRequests({
        limit,
        offset,
        ...filters,
      });
      return { ...data, offset };
    } catch (err) {
      return rejectWithValue(
        errorMessage(err, 'Servis/hizmet talepleri yüklenemedi')
      );
    }
  }
);

export const fetchPurchaseRequestTypes = createAsyncThunk(
  'purchaseRequest/fetchRequestTypes',
  async (_, { rejectWithValue }) => {
    try {
      return await PurchaseRequestService.fetchRequestTypes();
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Talep türleri yüklenemedi'));
    }
  }
);

// =========================================================
// WRITE THUNKS
// =========================================================

export const createSparePartRequest = createAsyncThunk(
  'purchaseRequest/createSparePart',
  async (payload, { rejectWithValue }) => {
    try {
      return await PurchaseRequestService.createSparePart(payload);
    } catch (err) {
      return rejectWithValue(
        errorMessage(err, 'Yedek parça talebi oluşturulamadı')
      );
    }
  }
);

export const updateSparePartStatus = createAsyncThunk(
  'purchaseRequest/updateSparePartStatus',
  async ({ requestId, status }, { rejectWithValue }) => {
    try {
      return await PurchaseRequestService.updateSparePartStatus(
        requestId,
        status
      );
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Durum güncellenemedi'));
    }
  }
);

export const deleteSparePartRequest = createAsyncThunk(
  'purchaseRequest/deleteSparePart',
  async (requestId, { rejectWithValue }) => {
    try {
      await PurchaseRequestService.deleteSparePart(requestId);
      return requestId;
    } catch (err) {
      return rejectWithValue(
        errorMessage(err, 'Yedek parça talebi silinemedi')
      );
    }
  }
);

export const createServiceRequest = createAsyncThunk(
  'purchaseRequest/createServiceRequest',
  async (payload, { rejectWithValue }) => {
    try {
      return await PurchaseRequestService.createServiceRequest(payload);
    } catch (err) {
      return rejectWithValue(
        errorMessage(err, 'Servis/hizmet talebi oluşturulamadı')
      );
    }
  }
);

export const deleteServiceRequest = createAsyncThunk(
  'purchaseRequest/deleteServiceRequest',
  async (requestId, { rejectWithValue }) => {
    try {
      await PurchaseRequestService.deleteServiceRequest(requestId);
      return requestId;
    } catch (err) {
      return rejectWithValue(
        errorMessage(err, 'Servis/hizmet talebi silinemedi')
      );
    }
  }
);

// =========================================================
// SLICE
// =========================================================

const purchaseRequestSlice = createSlice({
  name: 'purchaseRequest',
  initialState,
  reducers: {
    setActiveTab(state, action) {
      state.activeTab = action.payload;
    },
    setSpareFilter(state, action) {
      const { key, value } = action.payload;
      state.spareParts.filters[key] = value;
      state.spareParts.offset = 0;
    },
    // Kolon filtre satırı bir hadisədə bir neçə açarı dəyişə bilər.
    setSpareFilters(state, action) {
      Object.assign(state.spareParts.filters, action.payload);
      state.spareParts.offset = 0;
    },
    resetSpareFilters(state) {
      state.spareParts.filters = { ...initialSpareFilters };
      state.spareParts.offset = 0;
    },
    setSpareLimit(state, action) {
      state.spareParts.limit = action.payload;
      state.spareParts.offset = 0;
    },
    setSpareOffset(state, action) {
      state.spareParts.offset = action.payload;
    },
    setServiceFilter(state, action) {
      const { key, value } = action.payload;
      state.serviceRequests.filters[key] = value;
      state.serviceRequests.offset = 0;
    },
    setServiceFilters(state, action) {
      Object.assign(state.serviceRequests.filters, action.payload);
      state.serviceRequests.offset = 0;
    },
    resetServiceFilters(state) {
      state.serviceRequests.filters = { ...initialServiceFilters };
      state.serviceRequests.offset = 0;
    },
    setServiceLimit(state, action) {
      state.serviceRequests.limit = action.payload;
      state.serviceRequests.offset = 0;
    },
    setServiceOffset(state, action) {
      state.serviceRequests.offset = action.payload;
    },
    clearMutationError(state) {
      state.mutationError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSparePartRequests.pending, (state, action) => {
        state.spareParts.loading = true;
        state.spareParts.error = null;
        state.spareParts.requestId = action.meta.requestId;
      })
      .addCase(fetchSparePartRequests.fulfilled, (state, action) => {
        if (action.meta.requestId !== state.spareParts.requestId) return;
        state.spareParts.loading = false;
        state.spareParts.items = action.payload.items;
        state.spareParts.total = action.payload.total;
        state.spareParts.limit = action.payload.limit;
        state.spareParts.offset = action.payload.offset;
      })
      .addCase(fetchSparePartRequests.rejected, (state, action) => {
        if (action.meta.requestId !== state.spareParts.requestId) return;
        state.spareParts.loading = false;
        state.spareParts.error = action.payload;
      });

    builder
      .addCase(fetchServiceRequests.pending, (state, action) => {
        state.serviceRequests.loading = true;
        state.serviceRequests.error = null;
        state.serviceRequests.requestId = action.meta.requestId;
      })
      .addCase(fetchServiceRequests.fulfilled, (state, action) => {
        if (action.meta.requestId !== state.serviceRequests.requestId) return;
        state.serviceRequests.loading = false;
        state.serviceRequests.items = action.payload.items;
        state.serviceRequests.total = action.payload.total;
        state.serviceRequests.limit = action.payload.limit;
        state.serviceRequests.offset = action.payload.offset;
      })
      .addCase(fetchServiceRequests.rejected, (state, action) => {
        if (action.meta.requestId !== state.serviceRequests.requestId) return;
        state.serviceRequests.loading = false;
        state.serviceRequests.error = action.payload;
      });

    builder
      .addCase(fetchPurchaseRequestTypes.pending, (state) => {
        state.requestTypes.loading = true;
        state.requestTypes.error = null;
      })
      .addCase(fetchPurchaseRequestTypes.fulfilled, (state, action) => {
        state.requestTypes.loading = false;
        state.requestTypes.items = action.payload;
      })
      .addCase(fetchPurchaseRequestTypes.rejected, (state, action) => {
        state.requestTypes.loading = false;
        state.requestTypes.error = action.payload;
      });

    builder
      .addCase(createSparePartRequest.pending, (state) => {
        state.mutating = true;
        state.mutationError = null;
      })
      .addCase(createSparePartRequest.fulfilled, (state, action) => {
        state.mutating = false;
        if (state.spareParts.offset === 0) {
          state.spareParts.items.unshift(action.payload);
        }
        state.spareParts.total += 1;
      })
      .addCase(createSparePartRequest.rejected, (state, action) => {
        state.mutating = false;
        state.mutationError = action.payload;
      });

    builder
      .addCase(createServiceRequest.pending, (state) => {
        state.mutating = true;
        state.mutationError = null;
      })
      .addCase(createServiceRequest.fulfilled, (state, action) => {
        state.mutating = false;
        if (state.serviceRequests.offset === 0) {
          state.serviceRequests.items.unshift(action.payload);
        }
        state.serviceRequests.total += 1;
      })
      .addCase(createServiceRequest.rejected, (state, action) => {
        state.mutating = false;
        state.mutationError = action.payload;
      });

    builder
      .addCase(updateSparePartStatus.pending, (state, action) => {
        state.mutationError = null;
        state.rowBusy = {
          scope: SPARE_TAB,
          id: action.meta.arg.requestId,
          action: 'status',
        };
      })
      .addCase(updateSparePartStatus.fulfilled, (state, action) => {
        state.rowBusy = null;
        applyItem(state, SPARE_TAB, action.payload);
      })
      .addCase(updateSparePartStatus.rejected, (state, action) => {
        state.rowBusy = null;
        state.mutationError = action.payload;
      });

    builder
      .addCase(deleteSparePartRequest.pending, (state, action) => {
        state.mutationError = null;
        state.rowBusy = { scope: SPARE_TAB, id: action.meta.arg, action: 'delete' };
      })
      .addCase(deleteSparePartRequest.fulfilled, (state, action) => {
        state.rowBusy = null;
        removeItem(state, SPARE_TAB, action.payload);
      })
      .addCase(deleteSparePartRequest.rejected, (state, action) => {
        state.rowBusy = null;
        state.mutationError = action.payload;
      });

    builder
      .addCase(deleteServiceRequest.pending, (state, action) => {
        state.mutationError = null;
        state.rowBusy = {
          scope: SERVICE_TAB,
          id: action.meta.arg,
          action: 'delete',
        };
      })
      .addCase(deleteServiceRequest.fulfilled, (state, action) => {
        state.rowBusy = null;
        removeItem(state, SERVICE_TAB, action.payload);
      })
      .addCase(deleteServiceRequest.rejected, (state, action) => {
        state.rowBusy = null;
        state.mutationError = action.payload;
      });
  },
});

export const {
  setActiveTab,
  setSpareFilter,
  setSpareFilters,
  resetSpareFilters,
  setSpareLimit,
  setSpareOffset,
  setServiceFilter,
  setServiceFilters,
  resetServiceFilters,
  setServiceLimit,
  setServiceOffset,
  clearMutationError,
} = purchaseRequestSlice.actions;

export default purchaseRequestSlice.reducer;
