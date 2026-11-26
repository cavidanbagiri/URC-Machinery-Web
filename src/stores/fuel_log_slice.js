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
  // "İşlemler → Düzenle" penceresi: bir makinenin / kiralamanın son satırları.
  // Satır listesi sayfadan bağımsız tutulur çünkü pencere kapanınca temizlenir.
  editing: {
    kind: null,
    ownerId: null,
    entries: [],
    loading: false,
    error: null,
    savingEntryId: null,
  },
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

  // Sayaç okumaları isteğe bağlıdır; sadece doldurulan kolon güncellenir,
  // böylece yalnızca litre girilen kayıt eski KM / saat değerini silmez.
  const km = entry.km === null || entry.km === undefined ? null : Number(entry.km);
  const engineHours =
    entry.engine_hours === null || entry.engine_hours === undefined
      ? null
      : Number(entry.engine_hours);

  if (km !== null || engineHours !== null) {
    if (km !== null) rental.last_km = km;
    if (engineHours !== null) rental.last_engine_hours = engineHours;
    // Secili gune ait yeni bir okuma yazildi; en guncel sayac tarihi budur.
    rental.last_meter_date = entry.fuel_date;
  }

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

/**
 * Düzenleme penceresinin satır listesi. İki defter (makine / kiralık) aynı
 * thunk'ı kullanır; `kind` hangi defterin okunduğunu belirler.
 */
export const fetchFuelLogEntries = createAsyncThunk(
  'fuelLog/fetchEntries',
  async ({ kind, ownerId, end_date, days }, { rejectWithValue }) => {
    try {
      const entries =
        kind === 'rental'
          ? await FuelLogService.fetchRentalEntries({
              rental_id: ownerId,
              end_date,
              days,
            })
          : await FuelLogService.fetchEntries({
              machine_id: ownerId,
              end_date,
              days,
            });

      return { kind, ownerId, entries };
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Mazot kayıtları getirilemedi'));
    }
  }
);

/**
 * Kaydedilmiş bir satırı düzeltir. Tarih değişebildiği için günlük / haftalık /
 * aylık toplamlar yerinde güncellenmez: sayfa, başarılı kayıttan sonra özeti ve
 * satır listesini sunucudan yeniden ister.
 */
export const updateFuelLogEntry = createAsyncThunk(
  'fuelLog/updateEntry',
  async ({ kind, entryId, changes }, { rejectWithValue }) => {
    try {
      const entry =
        kind === 'rental'
          ? await FuelLogService.updateRentalLog(entryId, changes)
          : await FuelLogService.updateLog(entryId, changes);

      return { kind, entry };
    } catch (err) {
      return rejectWithValue(errorMessage(err, 'Mazot kaydı güncellenemedi'));
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
    /** Pencere kapanınca satır listesini ve hatasını temizler. */
    resetFuelLogEntries(state) {
      state.editing = {
        kind: null,
        ownerId: null,
        entries: [],
        loading: false,
        error: null,
        savingEntryId: null,
      };
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

    builder
      .addCase(fetchFuelLogEntries.pending, (state, action) => {
        state.editing.kind = action.meta.arg.kind;
        state.editing.ownerId = action.meta.arg.ownerId;
        state.editing.entries = [];
        state.editing.loading = true;
        state.editing.error = null;
      })
      .addCase(fetchFuelLogEntries.fulfilled, (state, action) => {
        const { kind, ownerId, entries } = action.payload;

        // Kullanıcı bu sırada başka bir satırı açtıysa eski cevabı yansıtma.
        if (state.editing.kind !== kind || state.editing.ownerId !== ownerId) {
          return;
        }

        state.editing.loading = false;
        state.editing.entries = entries;
      })
      .addCase(fetchFuelLogEntries.rejected, (state, action) => {
        state.editing.loading = false;
        state.editing.error = action.payload;
      });

    builder
      .addCase(updateFuelLogEntry.pending, (state, action) => {
        state.editing.savingEntryId = action.meta.arg.entryId;
        state.editing.error = null;
        state.mutationError = null;
      })
      .addCase(updateFuelLogEntry.fulfilled, (state) => {
        state.editing.savingEntryId = null;
        // Tarih değişmiş olabilir; liste ve özet sayfa tarafından yeniden
        // istenir, burada yalnızca kaydetme göstergesi kapatılır.
      })
      .addCase(updateFuelLogEntry.rejected, (state, action) => {
        state.editing.savingEntryId = null;
        state.editing.error = action.payload;
        state.mutationError = action.payload;
      });
  },
});

export const { clearMutationError, resetFuelLogEntries } = fuelLogSlice.actions;

export default fuelLogSlice.reducer;
