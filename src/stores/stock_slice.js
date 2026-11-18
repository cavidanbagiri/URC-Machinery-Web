// src/stores/stock_slice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import StockService from '../services/StockService';

export const ITEMS_TAB = 'items';
export const ISSUES_TAB = 'issues';

export const EMPTY_SUMMARY = {
  item_count: 0,
  total_quantity: 0,
  out_of_stock_items: 0,
  month_issue_quantity: 0,
  month_issue_count: 0,
};

const initialItemFilters = { search: '' };
const initialIssueFilters = {
  search: '',
  date_from: '',
  date_to: '',
};

function initialList(filters, limit = 20) {
  return {
    items: [],
    total: 0,
    limit,
    offset: 0,
    filters: { ...filters },
    loading: false,
    error: null,
  };
}

const initialState = {
  activeTab: ITEMS_TAB,
  items: initialList(initialItemFilters),
  issues: initialList(initialIssueFilters),
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

function applyItem(state, item) {
  const index = state.items.items.findIndex((row) => row.id === item.id);
  if (index !== -1) state.items.items[index] = item;
}

function removeItemFromList(state, scope, id) {
  const list = state[scope];
  const index = list.items.findIndex((row) => row.id === id);
  if (index === -1) return;
  list.items.splice(index, 1);
  list.total = Math.max(0, list.total - 1);
}

// =========================================================
// READ THUNKS
// =========================================================

export const fetchStockSummary = createAsyncThunk(
  'stock/fetchSummary',
  async (_, { rejectWithValue }) => {
    try {
      return await StockService.fetchSummary();
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Stok özeti yüklenemedi'));
    }
  }
);

export const fetchStockItems = createAsyncThunk(
  'stock/fetchItems',
  async (_, { getState, rejectWithValue }) => {
    const { limit, offset, filters } = getState().stock.items;
    try {
      return await StockService.fetchItems({ limit, offset, ...filters });
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Stok listesi yüklenemedi'));
    }
  }
);

export const fetchStockIssues = createAsyncThunk(
  'stock/fetchIssues',
  async (_, { getState, rejectWithValue }) => {
    const { limit, offset, filters } = getState().stock.issues;
    try {
      return await StockService.fetchIssues({ limit, offset, ...filters });
    } catch (err) {
      return rejectWithValue(
        errorMessage(err, 'Sahaya çıkanlar listesi yüklenemedi')
      );
    }
  }
);

// =========================================================
// WRITE THUNKS
// =========================================================

export const createStockItem = createAsyncThunk(
  'stock/createItem',
  async (payload, { rejectWithValue }) => {
    try {
      return await StockService.createItem(payload);
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Malzeme kaydedilemedi'));
    }
  }
);

export const updateStockItem = createAsyncThunk(
  'stock/updateItem',
  async ({ itemId, payload }, { rejectWithValue }) => {
    try {
      return await StockService.updateItem(itemId, payload);
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Malzeme güncellenemedi'));
    }
  }
);

export const deleteStockItem = createAsyncThunk(
  'stock/deleteItem',
  async (itemId, { rejectWithValue }) => {
    try {
      await StockService.deleteItem(itemId);
      return itemId;
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Malzeme silinemedi'));
    }
  }
);

export const createStockIssue = createAsyncThunk(
  'stock/createIssue',
  async (payload, { rejectWithValue }) => {
    try {
      return await StockService.createIssue(payload);
    } catch (err) {
      return rejectWithValue(
        errorMessage(err, 'Sahaya çıkış kaydedilemedi')
      );
    }
  }
);

export const deleteStockIssue = createAsyncThunk(
  'stock/deleteIssue',
  async (issueId, { rejectWithValue }) => {
    try {
      return await StockService.deleteIssue(issueId);
    } catch (err) {
      return rejectWithValue(
        errorMessage(err, 'Sahaya çıkış kaydı silinemedi')
      );
    }
  }
);

// =========================================================
// SLICE
// =========================================================

const stockSlice = createSlice({
  name: 'stock',
  initialState,
  reducers: {
    setActiveTab(state, action) {
      state.activeTab = action.payload;
      state.mutationError = null;
    },
    setItemSearch(state, action) {
      state.items.filters.search = action.payload;
      state.items.offset = 0;
    },
    resetItemFilters(state) {
      state.items.filters = { ...initialItemFilters };
      state.items.offset = 0;
    },
    setItemLimit(state, action) {
      state.items.limit = action.payload;
      state.items.offset = 0;
    },
    setItemOffset(state, action) {
      state.items.offset = action.payload;
    },
    setIssueFilter(state, action) {
      const { key, value } = action.payload;
      state.issues.filters[key] = value;
      state.issues.offset = 0;
    },
    resetIssueFilters(state) {
      state.issues.filters = { ...initialIssueFilters };
      state.issues.offset = 0;
    },
    setIssueLimit(state, action) {
      state.issues.limit = action.payload;
      state.issues.offset = 0;
    },
    setIssueOffset(state, action) {
      state.issues.offset = action.payload;
    },
    clearMutationError(state) {
      state.mutationError = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchStockSummary.pending, (state) => {
        state.summary.loading = true;
        state.summary.error = null;
      })
      .addCase(fetchStockSummary.fulfilled, (state, action) => {
        state.summary.loading = false;
        state.summary.data = action.payload;
      })
      .addCase(fetchStockSummary.rejected, (state, action) => {
        state.summary.loading = false;
        state.summary.error = action.payload;
      });

    builder
      .addCase(fetchStockItems.pending, (state) => {
        state.items.loading = true;
        state.items.error = null;
      })
      .addCase(fetchStockItems.fulfilled, (state, action) => {
        state.items.loading = false;
        state.items.items = action.payload.items || [];
        state.items.total = action.payload.total || 0;
        state.items.limit = action.payload.limit || state.items.limit;
        state.items.offset = action.payload.offset || 0;
      })
      .addCase(fetchStockItems.rejected, (state, action) => {
        state.items.loading = false;
        state.items.error = action.payload;
      });

    builder
      .addCase(fetchStockIssues.pending, (state) => {
        state.issues.loading = true;
        state.issues.error = null;
      })
      .addCase(fetchStockIssues.fulfilled, (state, action) => {
        state.issues.loading = false;
        state.issues.items = action.payload.items || [];
        state.issues.total = action.payload.total || 0;
        state.issues.limit = action.payload.limit || state.issues.limit;
        state.issues.offset = action.payload.offset || 0;
      })
      .addCase(fetchStockIssues.rejected, (state, action) => {
        state.issues.loading = false;
        state.issues.error = action.payload;
      });

    builder
      .addCase(createStockItem.pending, (state) => {
        state.mutating = true;
        state.mutationError = null;
      })
      .addCase(createStockItem.fulfilled, (state) => {
        state.mutating = false;
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
          scope: ITEMS_TAB,
          id: action.meta.arg.itemId,
          action: 'update',
        };
      })
      .addCase(updateStockItem.fulfilled, (state, action) => {
        state.mutating = false;
        state.rowBusy = null;
        applyItem(state, action.payload);
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
          scope: ITEMS_TAB,
          id: action.meta.arg,
          action: 'delete',
        };
      })
      .addCase(deleteStockItem.fulfilled, (state, action) => {
        state.rowBusy = null;
        removeItemFromList(state, 'items', action.payload);
      })
      .addCase(deleteStockItem.rejected, (state, action) => {
        state.rowBusy = null;
        state.mutationError = action.payload;
      });

    builder
      .addCase(createStockIssue.pending, (state) => {
        state.mutating = true;
        state.mutationError = null;
      })
      .addCase(createStockIssue.fulfilled, (state, action) => {
        const issue = action.payload;
        state.mutating = false;

        // Kart bakiyesini hemen yansıt; sayfa ayrıca tüm listeleri tazeler.
        const row = state.items.items.find(
          (item) => item.id === issue.stock_item_id
        );
        if (row) {
          row.quantity = Number(
            (Number(row.quantity || 0) - Number(issue.quantity || 0)).toFixed(3)
          );
          row.issue_count = (row.issue_count || 0) + 1;
        }
      })
      .addCase(createStockIssue.rejected, (state, action) => {
        state.mutating = false;
        state.mutationError = action.payload;
      });

    builder
      .addCase(deleteStockIssue.pending, (state, action) => {
        state.mutationError = null;
        state.rowBusy = {
          scope: ISSUES_TAB,
          id: action.meta.arg,
          action: 'delete',
        };
      })
      .addCase(deleteStockIssue.fulfilled, (state, action) => {
        const result = action.payload;
        state.rowBusy = null;
        removeItemFromList(state, 'issues', action.meta.arg);

        const row = state.items.items.find(
          (item) => item.id === result.stock_item_id
        );
        if (row) {
          row.quantity = Number(result.new_quantity || 0);
          row.issue_count = Math.max(0, (row.issue_count || 0) - 1);
        }
      })
      .addCase(deleteStockIssue.rejected, (state, action) => {
        state.rowBusy = null;
        state.mutationError = action.payload;
      });
  },
});

export const {
  setActiveTab,
  setItemSearch,
  resetItemFilters,
  setItemLimit,
  setItemOffset,
  setIssueFilter,
  resetIssueFilters,
  setIssueLimit,
  setIssueOffset,
  clearMutationError,
} = stockSlice.actions;

export default stockSlice.reducer;


