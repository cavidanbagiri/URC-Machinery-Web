// src/store/slices/machine_slice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import MachineService from '../services/MachineService';

// =========================================================
// INITIAL FILTERS
// =========================================================

const initialFilters = {
  identification_no: '',
  vin_no: '',
  territory_id: '',
  type_id: '',
  subtype_id: '',
  car_mark_id: '',
  car_model_id: '',
  company_id: '',
  created_by_id: '',
  production_year: '',
  status_id: '',

};

const initialState = {
  items: [],
  total: 0,
  limit: 10,
  offset: 0,
  filters: { ...initialFilters },
  loading: false,
  error: null,
  // Modallar üçün
  selectedMachine: null,      // Detail / Update üçün
  formSubmitting: false,
};

// =========================================================
// ASYNC THUNKS
// =========================================================

export const fetchMachines = createAsyncThunk(
  'machine/fetchMachines',
  async (_, { getState, rejectWithValue }) => {
    const { limit, offset, filters } = getState().machine;
    try {
      const data = await MachineService.fetchMachines({
        limit,
        offset,
        ...filters,
      });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Fetch xətası');
    }
  }
);

export const createMachine = createAsyncThunk(
  'machine/createMachine',
  async (payload, { rejectWithValue }) => {
    try {
      return await MachineService.createMachine(payload);
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Create xətası');
    }
  }
);

export const updateMachine = createAsyncThunk(
  'machine/updateMachine',
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      return await MachineService.updateMachine(id, payload);
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Update xətası');
    }
  }
);


export const deleteMachine = createAsyncThunk(
  'machine/deleteMachine',
  async (id, { rejectWithValue }) => {
    try {
      await MachineService.deleteMachine(id);
      return id;
    } catch (err) {
      return rejectWithValue(
        String(err.response?.data?.detail || err.message || 'Delete xətası')
      );
    }
  }
);

// export const deleteMachine = createAsyncThunk(
//   'machine/deleteMachine',
//   async (id, { rejectWithValue }) => {
//     try {
//       await MachineService.deleteMachine(id);
//       return id;
//     } catch (err) {
//       return rejectWithValue(err.response?.data?.detail || 'Delete xətası');
//     }
//   }
// );

// src/store/slices/machine_slice.js

export const updateMachineStatus = createAsyncThunk(
  'machine/updateMachineStatus',
  async ({ id, status_id }, { rejectWithValue }) => {
    try {
      const current = await MachineService.fetchMachineById(id);
      // console.log('DEBUG — current machine:', current);

      const payload = {
        identification_no: current.identification_no,
        vin_no: current.vin_no,
        technical_character: current.technical_character,
        production_year: current.production_year,
        weight: current.weight,
        dimension: current.dimension,
        engine_power: current.engine_power,
        engine_mark_model: current.engine_mark_model,
        engine_identity: current.engine_identity,
        territory_id: current.territory_id,
        type_id: current.type_id,
        subtype_id: current.subtype_id,
        car_mark_id: current.car_mark_id,
        car_model_id: current.car_model_id,
        company_id: current.company_id,
        status_id: status_id,
      };
      // console.log('DEBUG — payload:', payload);

      const data = await MachineService.updateMachine(id, payload);
      // console.log('DEBUG — response:', data);
      return data;
    } catch (err) {
      // console.error('DEBUG — error:', err);
      // console.error('DEBUG — err.response:', err.response);
      return rejectWithValue(err.response?.data?.detail || 'Xəta');
    }
  }
);


// =========================================================
// SLICE
// =========================================================

const machineSlice = createSlice({
  name: 'machine',
  initialState,
  reducers: {
    setFilter(state, action) {
      const { key, value } = action.payload;
      state.filters[key] = value;
      state.offset = 0;   // filter dəyişdikdə 1-ci səhifəyə qaytar
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
    nextPage(state) {
      state.offset = state.offset + state.limit;
    },
    prevPage(state) {
      state.offset = Math.max(0, state.offset - state.limit);
    },
    setSelectedMachine(state, action) {
      state.selectedMachine = action.payload;
    },
    clearSelectedMachine(state) {
      state.selectedMachine = null;
    },
  },
  extraReducers: (builder) => {
    // ---------- FETCH ----------
    builder
      .addCase(fetchMachines.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMachines.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.total = action.payload.total;
        state.limit = action.payload.limit;
        state.offset = action.payload.offset;
      })
      .addCase(fetchMachines.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // ---------- CREATE ----------
    builder
      .addCase(createMachine.pending, (state) => {
        state.formSubmitting = true;
      })
      .addCase(createMachine.fulfilled, (state, action) => {
        state.formSubmitting = false;
        // Yeni elementi əvvələ əlavə et
        state.items.unshift(action.payload);
        state.total += 1;
      })
      .addCase(createMachine.rejected, (state, action) => {
        state.formSubmitting = false;
        state.error = action.payload;
      });

    // ---------- UPDATE ----------
    builder
      .addCase(updateMachine.pending, (state) => {
        state.formSubmitting = true;
      })
      .addCase(updateMachine.fulfilled, (state, action) => {
        state.formSubmitting = false;
        const idx = state.items.findIndex((m) => m.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(updateMachine.rejected, (state, action) => {
        state.formSubmitting = false;
        state.error = action.payload;
      });

    // ---------- DELETE ----------
    builder
      .addCase(deleteMachine.fulfilled, (state, action) => {
        state.items = state.items.filter((m) => m.id !== action.payload);
        state.total = Math.max(0, state.total - 1);
      })
      .addCase(deleteMachine.rejected, (state, action) => {
        state.error = action.payload;
      });
      // ---------- UPDATE STATUS ----------
    builder
      .addCase(updateMachineStatus.fulfilled, (state, action) => {
        const idx = state.items.findIndex((m) => m.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(updateMachineStatus.rejected, (state, action) => {
        state.error = action.payload;
      });
      
  },
});

export const {
  setFilter,
  resetFilters,
  setLimit,
  setOffset,
  nextPage,
  prevPage,
  setSelectedMachine,
  clearSelectedMachine,
} = machineSlice.actions;

export default machineSlice.reducer;