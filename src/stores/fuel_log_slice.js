// src/stores/fuel_log_slice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import FuelLogService from '../services/FuelLogService';

const initialState = {
  overview: {
    fuel_date: null,
    week_start: null,
    month_start: null,
    previous_month_start: null,
    previous_month_end: null,
    daily_total: 0,
    weekly_total: 0,
    monthly_total: 0,
    previous_month_total: 0,
    sru_monthly_total: 0,
    dcu_monthly_total: 0,
    rental_total: 0,
    rental_daily_total: 0,
    rental_monthly_total: 0,
    machines: [],
    rental_machines: [],
  },
  loading: false,
  error: null,
  listRequestId: null,
  savingMachineId: null,
  savingRentalId: null,
  mutationError: null,
};

function errorMessage(err, fallback) {
  const detail = err.response?.data?.detail;
  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg).filter(Boolean).join(', ') || fallback;
  }
  return detail || err.message || fallback;
}

function applySavedEntry(state, entry) {
  const { overview } = state;

  // Kullanici kayit sirasinda baska bir gune gectiyse eski cevabi yansitma.
  if (overview.fuel_date !== entry.fuel_date) return;

  const machine = overview.machines.find(
    (item) => item.machine_id === entry.machine_id
  );
  if (!machine) return;

  const liters = Number(entry.liters) || 0;

  machine.day_liters = (Number(machine.day_liters) || 0) + liters;
  machine.day_entry_count = (Number(machine.day_entry_count) || 0) + 1;
  // Sunucu, "Yakıtı veren" alanını oturumdaki kullanıcı adıyla doldurur.
  machine.last_given_by = entry.given_by;
  machine.last_note = entry.note;
  machine.last_created_at = entry.created_at;

  overview.daily_total = (Number(overview.daily_total) || 0) + liters;
  overview.weekly_total = (Number(overview.weekly_total) || 0) + liters;
  overview.monthly_total = (Number(overview.monthly_total) || 0) + liters;

  // SRU / DCU kartları da anında güncellensin; kesin değerler sayfa yeniden
  // yüklendiğinde sunucudan gelir.
  const territory = (machine.territory_name || '').trim().toLocaleUpperCase('tr-TR');
  if (territory === 'SRU') {
    overview.sru_monthly_total = (Number(overview.sru_monthly_total) || 0) + liters;
  } else if (territory === 'DCU') {
    overview.dcu_monthly_total = (Number(overview.dcu_monthly_total) || 0) + liters;
  }
}

/**
 * Kiralik tabda kaydedilen litreleri aninda yansitir. Ayni makine tablosunda
 * oldugu gibi kesin degerler sayfa yenilendiginde sunucudan gelir.
 */
function applySavedRentalEntry(state, entry) {
  const { overview } = state;

  // Kullanici kayit sirasinda baska bir gune gectiyse eski cevabi yansitma.
  if (overview.fuel_date !== entry.fuel_date) return;

  const rental = (overview.rental_machines || []).find(
    (item) => item.rental_id === entry.rental_id
  );
  if (!rental) return;

  const liters = Number(entry.liters) || 0;

  rental.day_liters = (Number(rental.day_liters) || 0) + liters;
  rental.day_entry_count = (Number(rental.day_entry_count) || 0) + 1;
  rental.monthly_liters = (Number(rental.monthly_liters) || 0) + liters;
  rental.total_liters = (Number(rental.total_liters) || 0) + liters;
  rental.total_entry_count = (Number(rental.total_entry_count) || 0) + 1;
  rental.last_given_by = entry.given_by;
  rental.last_note = entry.note;
  rental.last_created_at = entry.created_at;

  overview.rental_daily_total = (Number(overview.rental_daily_total) || 0) + liters;
  overview.rental_monthly_total =
    (Number(overview.rental_monthly_total) || 0) + liters;
  overview.rental_total = (Number(overview.rental_total) || 0) + liters;
}

export const fetchFuelLogOverview = createAsyncThunk(
  'fuelLog/fetchOverview',
  async (params = {}, { rejectWithValue }) => {
    try {
      return await FuelLogService.fetchOverview(params);
    } catch (err) {
      return rejectWithValue(
        errorMessage(err, 'Mazot dağılımı kayıtları yüklenemedi')
      );
    }
  }
);

export const createFuelLog = createAsyncThunk(
  'fuelLog/createLog',
  async (payload, { rejectWithValue }) => {
    try {
      return await FuelLogService.createLog(payload);
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Mazot kaydı kaydedilemedi'));
    }
  }
);

export const createRentalFuelLog = createAsyncThunk(
  'fuelLog/createRentalLog',
  async (payload, { rejectWithValue }) => {
    try {
      return await FuelLogService.createRentalLog(payload);
    } catch (err) {
      return rejectWithValue(
        errorMessage(err, 'Kiralık makine mazot kaydı kaydedilemedi')
      );
    }
  }
);

const fuelLogSlice = createSlice({
  name: 'fuelLog',
  initialState,
  reducers: {
    clearMutationError(state) {
      state.mutationError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFuelLogOverview.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.listRequestId = action.meta.requestId;
      })
      .addCase(fetchFuelLogOverview.fulfilled, (state, action) => {
        if (action.meta.requestId !== state.listRequestId) return;
        state.loading = false;
        state.overview = action.payload;
      })
      .addCase(fetchFuelLogOverview.rejected, (state, action) => {
        if (action.meta.requestId !== state.listRequestId) return;
        state.loading = false;
        state.error = action.payload;
      });

    builder
      .addCase(createFuelLog.pending, (state, action) => {
        state.savingMachineId = action.meta.arg.machine_id;
        state.mutationError = null;
      })
      .addCase(createFuelLog.fulfilled, (state, action) => {
        state.savingMachineId = null;
        applySavedEntry(state, action.payload);
      })
      .addCase(createFuelLog.rejected, (state, action) => {
        state.savingMachineId = null;
        state.mutationError = action.payload;
      });

    builder
      .addCase(createRentalFuelLog.pending, (state, action) => {
        state.savingRentalId = action.meta.arg.rental_id;
        state.mutationError = null;
      })
      .addCase(createRentalFuelLog.fulfilled, (state, action) => {
        state.savingRentalId = null;
        applySavedRentalEntry(state, action.payload);
      })
      .addCase(createRentalFuelLog.rejected, (state, action) => {
        state.savingRentalId = null;
        state.mutationError = action.payload;
      });
  },
});

export const { clearMutationError } = fuelLogSlice.actions;

export default fuelLogSlice.reducer;
