// src/stores/rental_machine_slice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import RentalMachineService from '../services/RentalMachineService';

// =========================================================
// STATUS META — backend ile aynı kodlar
// =========================================================

export const RENTAL_STATUS_OPTIONS = [
  { code: 'aktif', label: 'Aktif', color: 'green' },
  { code: 'planlandi', label: 'Planlandı', color: 'blue' },
  { code: 'suresi_doldu', label: 'Süresi doldu', color: 'red' },
];

// =========================================================
// INITIAL STATE
// =========================================================

const initialFilters = {
  search: '',
  status: '',
  // Excel-style column filters of the table header (lookup ids or free text).
  // The merged Marka / Model column filters by the brand only.
  machine_type_id: '',
  car_mark_id: '',
  plate: '',
  company: '',
  site: '',
  start_from: '',
  start_to: '',
  end_from: '',
  end_to: '',
};

const initialState = {
  items: [],
  total: 0,
  limit: 50,
  offset: 0,
  filters: { ...initialFilters },
  //: Per-machine-type counters of the "Makine Tipine Göre İstatistik" panel.
  typeStats: [],
  loading: false,
  error: null,
  listRequestId: null,

  saving: false,
  deletingId: null,
  mutationError: null,
};

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

export const fetchRentalMachines = createAsyncThunk(
  'rentalMachine/fetchRentalMachines',
  async (_, { getState, rejectWithValue }) => {
    const { limit, offset, filters } = getState().rentalMachine;
    try {
      return await RentalMachineService.fetchRentalMachines({
        limit,
        offset,
        ...filters,
      });
    } catch (err) {
      return rejectWithValue(
        errorMessage(err, 'Kiralık makine listesi yüklenemedi')
      );
    }
  }
);

export const createRentalMachine = createAsyncThunk(
  'rentalMachine/createRentalMachine',
  async (payload, { rejectWithValue }) => {
    try {
      return await RentalMachineService.create(payload);
    } catch (err) {
      return rejectWithValue(
        errorMessage(err, 'Kiralık makine kaydı oluşturulamadı')
      );
    }
  }
);

export const updateRentalMachine = createAsyncThunk(
  'rentalMachine/updateRentalMachine',
  async ({ rentalId, payload }, { rejectWithValue }) => {
    try {
      return await RentalMachineService.update(rentalId, payload);
    } catch (err) {
      return rejectWithValue(
        errorMessage(err, 'Kiralık makine kaydı güncellenemedi')
      );
    }
  }
);

export const deleteRentalMachine = createAsyncThunk(
  'rentalMachine/deleteRentalMachine',
  async (rentalId, { rejectWithValue }) => {
    try {
      await RentalMachineService.remove(rentalId);
      return rentalId;
    } catch (err) {
      return rejectWithValue(
        errorMessage(err, 'Kiralık makine kaydı silinemedi')
      );
    }
  }
);

// =========================================================
// SLICE
// =========================================================

const rentalMachineSlice = createSlice({
  name: 'rentalMachine',
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
      .addCase(fetchRentalMachines.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.listRequestId = action.meta.requestId;
      })
      .addCase(fetchRentalMachines.fulfilled, (state, action) => {
        // Ignore a late response after a newer filter request was sent.
        if (action.meta.requestId !== state.listRequestId) return;
        state.loading = false;
        state.items = action.payload.items;
        state.total = action.payload.total;
        state.limit = action.payload.limit;
        state.offset = action.payload.offset;
        state.typeStats = action.payload.type_stats || [];
      })
      .addCase(fetchRentalMachines.rejected, (state, action) => {
        if (action.meta.requestId !== state.listRequestId) return;
        state.loading = false;
        state.error = action.payload;
      });

    // ---------- CREATE / UPDATE ----------
    builder
      .addCase(createRentalMachine.pending, (state) => {
        state.saving = true;
        state.mutationError = null;
      })
      .addCase(createRentalMachine.fulfilled, (state) => {
        state.saving = false;
        // The page reloads the list so the new row lands on the right page.
        state.offset = 0;
      })
      .addCase(createRentalMachine.rejected, (state, action) => {
        state.saving = false;
        state.mutationError = action.payload;
      })
      .addCase(updateRentalMachine.pending, (state) => {
        state.saving = true;
        state.mutationError = null;
      })
      .addCase(updateRentalMachine.fulfilled, (state, action) => {
        state.saving = false;
        const index = state.items.findIndex(
          (item) => item.id === action.payload.id
        );
        if (index !== -1) state.items[index] = action.payload;
      })
      .addCase(updateRentalMachine.rejected, (state, action) => {
        state.saving = false;
        state.mutationError = action.payload;
      });

    // ---------- DELETE ----------
    builder
      .addCase(deleteRentalMachine.pending, (state, action) => {
        state.deletingId = action.meta.arg;
        state.mutationError = null;
      })
      .addCase(deleteRentalMachine.fulfilled, (state, action) => {
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
      .addCase(deleteRentalMachine.rejected, (state, action) => {
        state.deletingId = null;
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
} = rentalMachineSlice.actions;

export default rentalMachineSlice.reducer;
