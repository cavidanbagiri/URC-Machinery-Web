// src/stores/warehouse_slice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import WarehouseService from '../services/WarehouseService';

export const STOCK_TAB = 'stock';
export const RECEIPTS_TAB = 'receipts';
export const MOVEMENTS_TAB = 'movements';

export const EMPTY_SUMMARY = {
  stock_items: 0,
  critical_items: 0,
  pending_receipts: 0,
  total_quantity: 0,
  month_in_quantity: 0,
  month_out_quantity: 0,
};

const initialStockFilters = {
  search: '',
  territory_id: '',
  low_stock: false,
};

const initialMovementFilters = {
  search: '',
  movement_type: '',
  item_id: '',
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
  };
}

const initialState = {
  activeTab: STOCK_TAB,
  stock: initialList(initialStockFilters),
  movements: initialList(initialMovementFilters),
  pending: {
    items: [],
    total: 0,
    limit: 20,
    offset: 0,
    filters: { search: '' },
    loading: false,
    error: null,
  },
  summary: { data: { ...EMPTY_SUMMARY }, loading: false, error: null },

  mutating: false,
  mutationError: null,
  // { scope, id, action } while a row-level request runs
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

/** Keeps the row badge in sync after a local quantity change. */
function refreshStockStatus(row) {
  if (row.quantity <= 0) {
    row.stock_status = 'tukendi';
    row.stock_status_label = 'Stokta Yok';
  } else if (row.quantity <= Number(row.min_quantity || 0)) {
    row.stock_status = 'az';
    row.stock_status_label = 'Kritik Seviye';
  } else {
    row.stock_status = 'yeterli';
    row.stock_status_label = 'Yeterli';
  }
}

// =========================================================
// READ THUNKS
// =========================================================

export const fetchWarehouseSummary = createAsyncThunk(
  'warehouse/fetchSummary',
  async (_, { rejectWithValue }) => {
    try {
      return await WarehouseService.fetchSummary();
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Depo özeti yüklenemedi'));
    }
  }
);

export const fetchStock = createAsyncThunk(
  'warehouse/fetchStock',
  async (_, { getState, rejectWithValue }) => {
    const { limit, offset, filters } = getState().warehouse.stock;
    try {
      const data = await WarehouseService.fetchStock({
        limit,
        offset,
        ...filters,
      });
      return { ...data, offset };
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Stok listesi yüklenemedi'));
    }
  }
);

export const fetchMovements = createAsyncThunk(
  'warehouse/fetchMovements',
  async (_, { getState, rejectWithValue }) => {
    const { limit, offset, filters } = getState().warehouse.movements;
    try {
      const data = await WarehouseService.fetchMovements({
        limit,
        offset,
        ...filters,
      });
      return { ...data, offset };
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Hareketler yüklenemedi'));
    }
  }
);

export const fetchPendingReceipts = createAsyncThunk(
  'warehouse/fetchPendingReceipts',
  async (_, { getState, rejectWithValue }) => {
    const { limit, offset, filters } = getState().warehouse.pending;
    try {
      const data = await WarehouseService.fetchPendingReceipts({
        limit,
        offset,
        ...filters,
      });
      return { ...data, offset };
    } catch (err) {
      return rejectWithValue(
        errorMessage(err, 'Depoya alınacak kalemler yüklenemedi')
      );
    }
  }
);

// =========================================================
// WRITE THUNKS
// =========================================================

export const createStockItem = createAsyncThunk(
  'warehouse/createStockItem',
  async (payload, { rejectWithValue }) => {
    try {
      return await WarehouseService.createStockItem(payload);
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Stok kartı oluşturulamadı'));
    }
  }
);

export const updateStockItem = createAsyncThunk(
  'warehouse/updateStockItem',
  async ({ itemId, payload }, { rejectWithValue }) => {
    try {
      return await WarehouseService.updateStockItem(itemId, payload);
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Stok kartı güncellenemedi'));
    }
  }
);

export const deleteStockItem = createAsyncThunk(
  'warehouse/deleteStockItem',
  async (itemId, { rejectWithValue }) => {
    try {
      await WarehouseService.deleteStockItem(itemId);
      return itemId;
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Stok kartı silinemedi'));
    }
  }
);

export const createMovement = createAsyncThunk(
  'warehouse/createMovement',
  async (payload, { rejectWithValue }) => {
    try {
      return await WarehouseService.createMovement(payload);
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Hareket kaydedilemedi'));
    }
  }
);

export const receiveItems = createAsyncThunk(
  'warehouse/receiveItems',
  async (payload, { rejectWithValue }) => {
    try {
      return await WarehouseService.receiveItems(payload);
    } catch (err) {
      return rejectWithValue(
        errorMessage(err, 'Kalemler depoya alınamadı')
      );
    }
  }
);

// =========================================================
// SLICE
// =========================================================

const warehouseSlice = createSlice({
  name: 'warehouse',
  initialState,
  reducers: {
    setActiveTab(state, action) {
      state.activeTab = action.payload;
      state.mutationError = null;
    },
    setStockFilter(state, action) {
      const { key, value } = action.payload;
      state.stock.filters[key] = value;
      state.stock.offset = 0;
    },
    resetStockFilters(state) {
      state.stock.filters = { ...initialStockFilters };
      state.stock.offset = 0;
    },
    setStockLimit(state, action) {
      state.stock.limit = action.payload;
      state.stock.offset = 0;
    },
    setStockOffset(state, action) {
      state.stock.offset = action.payload;
    },
    setMovementFilter(state, action) {
      const { key, value } = action.payload;
      state.movements.filters[key] = value;
      state.movements.offset = 0;
    },
    resetMovementFilters(state) {
      state.movements.filters = { ...initialMovementFilters };
      state.movements.offset = 0;
    },
    setMovementLimit(state, action) {
      state.movements.limit = action.payload;
      state.movements.offset = 0;
    },
    setMovementOffset(state, action) {
      state.movements.offset = action.payload;
    },
    setPendingSearch(state, action) {
      state.pending.filters.search = action.payload;
      state.pending.offset = 0;
    },
    setPendingOffset(state, action) {
      state.pending.offset = action.payload;
    },
    /** "Hareketler" shortcut from a stock row. */
    showItemMovements(state, action) {
      state.movements.filters = {
        ...initialMovementFilters,
        item_id: String(action.payload),
      };
      state.movements.offset = 0;
      state.activeTab = MOVEMENTS_TAB;
    },
    clearMutationError(state) {
      state.mutationError = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchWarehouseSummary.pending, (state) => {
        state.summary.loading = true;
        state.summary.error = null;
      })
      .addCase(fetchWarehouseSummary.fulfilled, (state, action) => {
        state.summary.loading = false;
        state.summary.data = action.payload;
      })
      .addCase(fetchWarehouseSummary.rejected, (state, action) => {
        state.summary.loading = false;
        state.summary.error = action.payload;
      });

    builder
      .addCase(fetchStock.pending, (state) => {
        state.stock.loading = true;
        state.stock.error = null;
      })
      .addCase(fetchStock.fulfilled, (state, action) => {
        state.stock.loading = false;
        state.stock.items = action.payload.items;
        state.stock.total = action.payload.total;
        state.stock.limit = action.payload.limit;
        state.stock.offset = action.payload.offset;
      })
      .addCase(fetchStock.rejected, (state, action) => {
        state.stock.loading = false;
        state.stock.error = action.payload;
      });

    builder
      .addCase(fetchMovements.pending, (state) => {
        state.movements.loading = true;
        state.movements.error = null;
      })
      .addCase(fetchMovements.fulfilled, (state, action) => {
        state.movements.loading = false;
        state.movements.items = action.payload.items;
        state.movements.total = action.payload.total;
        state.movements.limit = action.payload.limit;
        state.movements.offset = action.payload.offset;
      })
      .addCase(fetchMovements.rejected, (state, action) => {
        state.movements.loading = false;
        state.movements.error = action.payload;
      });

    builder
      .addCase(fetchPendingReceipts.pending, (state) => {
        state.pending.loading = true;
        state.pending.error = null;
      })
      .addCase(fetchPendingReceipts.fulfilled, (state, action) => {
        state.pending.loading = false;
        state.pending.items = action.payload.items;
        state.pending.total = action.payload.total;
        state.pending.limit = action.payload.limit;
        state.pending.offset = action.payload.offset;
      })
      .addCase(fetchPendingReceipts.rejected, (state, action) => {
        state.pending.loading = false;
        state.pending.error = action.payload;
      });



    builder
      .addCase(createStockItem.pending, (state) => {
        state.mutating = true;
        state.mutationError = null;
      })
      .addCase(createStockItem.fulfilled, (state, action) => {
        state.mutating = false;
        if (state.stock.offset === 0) {
          state.stock.items.unshift(action.payload);
        }
        state.stock.total += 1;
      })
      .addCase(createStockItem.rejected, (state, action) => {
        state.mutating = false;
        state.mutationError = action.payload;
      });

    builder
      .addCase(updateStockItem.pending, (state, action) => {
        state.mutating = true;
        state.mutationError = null;
        state.rowBusy = {
          scope: STOCK_TAB,
          id: action.meta.arg.itemId,
          action: 'update',
        };
      })
      .addCase(updateStockItem.fulfilled, (state, action) => {
        state.mutating = false;
        state.rowBusy = null;
        applyItem(state, STOCK_TAB, action.payload);
      })
      .addCase(updateStockItem.rejected, (state, action) => {
        state.mutating = false;
        state.rowBusy = null;
        state.mutationError = action.payload;
      });

    builder
      .addCase(deleteStockItem.pending, (state, action) => {
        state.mutationError = null;
        state.rowBusy = {
          scope: STOCK_TAB,
          id: action.meta.arg,
          action: 'delete',
        };
      })
      .addCase(deleteStockItem.fulfilled, (state, action) => {
        state.rowBusy = null;
        removeItem(state, STOCK_TAB, action.payload);
      })
      .addCase(deleteStockItem.rejected, (state, action) => {
        state.rowBusy = null;
        state.mutationError = action.payload;
      });

    builder
      .addCase(createMovement.pending, (state) => {
        state.mutating = true;
        state.mutationError = null;
      })
      .addCase(createMovement.fulfilled, (state, action) => {
        const movement = action.payload;
        state.mutating = false;

        const { filters, offset } = state.movements;
        const sameItem =
          !filters.item_id ||
          String(filters.item_id) === String(movement.item_id);
        if (offset === 0 && sameItem) state.movements.items.unshift(movement);
        state.movements.total += 1;

        const row = state.stock.items.find(
          (item) => item.id === movement.item_id
        );
        if (row) {
          const delta =
            movement.movement_type === 'cikis'
              ? -movement.quantity
              : movement.quantity;
          row.quantity = Number((Number(row.quantity) + delta).toFixed(3));
          row.movement_count = (row.movement_count || 0) + 1;
          refreshStockStatus(row);
        }
      })
      .addCase(createMovement.rejected, (state, action) => {
        state.mutating = false;
        state.mutationError = action.payload;
      });

    builder
      .addCase(receiveItems.pending, (state) => {
        state.mutating = true;
        state.mutationError = null;
      })
      .addCase(receiveItems.fulfilled, (state, action) => {
        state.mutating = false;

        const receivedIds = new Set(
          action.payload.movements
            .map((movement) => movement.source_request_item_id)
            .filter(Boolean)
        );
        state.pending.items = state.pending.items.filter(
          (row) => !receivedIds.has(row.request_item_id)
        );
        state.pending.total = Math.max(
          0,
          state.pending.total - action.payload.received
        );
      })
      .addCase(receiveItems.rejected, (state, action) => {
        state.mutating = false;
        state.mutationError = action.payload;
      });
  },
});

export const {
  setActiveTab,
  setStockFilter,
  resetStockFilters,
  setStockLimit,
  setStockOffset,
  setMovementFilter,
  resetMovementFilters,
  setMovementLimit,
  setMovementOffset,
  setPendingSearch,
  setPendingOffset,
  showItemMovements,
  clearMutationError,
} = warehouseSlice.actions;

export default warehouseSlice.reducer;

