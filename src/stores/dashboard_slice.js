// src/store/slices/dashboard_slice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import DashboardService from '../services/DashboardService';
import RepairService from '../services/RepairService';
import MaintenanceService from '../services/MaintenanceService';
import WarehouseService from '../services/WarehouseService';
import PurchaseRequestService from '../services/PurchaseRequestService';
import DailyFaultService from '../services/DailyFaultService';
import ForumService from '../services/ForumService';

// Liste widget'larının satır sayıları — Dashboard'daki kart yükseklikleriyle eşleşir.
const LIST_LIMIT = 5; // alt sıradaki üç liste widget'ı
const COMPACT_LIMIT = 3; // sağ kolondaki kompakt liste widget'ları
const LOW_STOCK_LIMIT = 4; // depo kartının içindeki kritik stok listesi

// Operasyon widget'ları kendi hata durumlarını taşır; biri patlarsa diğerleri
// çalışmaya devam eder (Promise.allSettled).
const emptyOverview = {
  repair: { data: null, error: null },
  maintenance: { data: null, error: null },
  warehouse: { data: null, error: null },
  spareParts: { items: [], total: 0, error: null },
  dailyFaults: { recent: [], monthCount: 0, error: null },
  overdueMaintenance: { items: [], total: 0, error: null },
  overdueRepairs: { items: [], total: 0, error: null },
  forum: { items: [], total: 0, error: null },
  lowStock: { items: [], total: 0, error: null },
};

/** İçinde bulunulan ayın ilk günü (`YYYY-MM-01`) — "bu ay arıza" sayacı için. */
export function monthStartISO(date = new Date()) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${date.getFullYear()}-${month}-01`;
}

function failureMessage(result) {
  const reason = result?.reason;
  return String(
    reason?.response?.data?.detail || reason?.message || 'Veri yüklenemedi'
  );
}

/** Tek nesne döndüren çağrılar (`/repair/summary`, `/warehouse/summary`, ...). */
function settledData(result) {
  if (result.status !== 'fulfilled') {
    return { data: null, error: failureMessage(result) };
  }
  return { data: result.value, error: null };
}

/** Sayfalı liste döndüren çağrılar (`{ total, limit, offset, items }`). */
function settledList(result) {
  if (result.status !== 'fulfilled') {
    return { items: [], total: 0, error: failureMessage(result) };
  }
  return {
    items: result.value?.items || [],
    total: result.value?.total ?? 0,
    error: null,
  };
}

const initialState = {
  total: 0,
  byStatus: [],
  pivot: {
    territories: [],
    rows: [],
    grand_totals: {},
    grand_total: 0,
  },
  loading: false,
  pivotLoading: false,
  error: null,

  // --- Operasyon katmanı (tamir / bakım / depo / talep / arıza / forum) ---
  overview: emptyOverview,
  overviewLoading: false,
  overviewError: null,
  overviewUpdatedAt: null,
};

export const fetchStatusStatistics = createAsyncThunk(
  'dashboard/fetchStatusStatistics',
  async (_, { rejectWithValue }) => {
    try {
      return await DashboardService.fetchStatusStatistics();
    } catch (err) {
      const message =
        err?.response?.data?.detail ||
        err?.message ||
        'İstatistikler yüklenemedi';
      return rejectWithValue(String(message));
    }
  }
);

// YENİ
export const fetchPivotStatistics = createAsyncThunk(
  'dashboard/fetchPivotStatistics',
  async (_, { rejectWithValue }) => {
    try {
      return await DashboardService.fetchPivotStatistics();
    } catch (err) {
      return rejectWithValue(String(err?.message || 'Pivot verileri yüklenemedi'));
    }
  }
);

// Tüm operasyon widget'ları tek thunk içinde paralel çağrılır; böylece sayfa tek
// bir "Yenile" ile tazelenir ve her widget kendi hata durumunu gösterir.
export const fetchDashboardOverview = createAsyncThunk(
  'dashboard/fetchDashboardOverview',
  async (_, { rejectWithValue }) => {
    try {
      const monthStart = monthStartISO();

      const [
        repair,
        maintenance,
        warehouse,
        spareParts,
        recentFaults,
        monthFaults,
        overdueMaintenance,
        overdueRepairs,
        forum,
        lowStock,
      ] = await Promise.allSettled([
        RepairService.fetchSummary(),
        MaintenanceService.fetchSummary(),
        WarehouseService.fetchSummary(),
        PurchaseRequestService.fetchSpareParts({
          status: 'bekleniyor',
          limit: COMPACT_LIMIT,
          offset: 0,
        }),
        DailyFaultService.fetchFaults({ limit: LIST_LIMIT, offset: 0 }),
        DailyFaultService.fetchFaults({
          limit: 1,
          offset: 0,
          date_from: monthStart,
        }),
        MaintenanceService.fetchMaintenance({
          status: 'gecikmis',
          sort_by: 'remaining',
          sort_order: 'asc',
          limit: LIST_LIMIT,
          offset: 0,
        }),
        RepairService.fetchRepairs({
          overdue: true,
          limit: LIST_LIMIT,
          offset: 0,
        }),
        ForumService.fetchTopics({
          status: 'open',
          limit: COMPACT_LIMIT,
          offset: 0,
        }),
        WarehouseService.fetchStock({
          low_stock: true,
          limit: LOW_STOCK_LIMIT,
          offset: 0,
        }),
      ]);

      const recent = settledList(recentFaults);
      const monthly = settledList(monthFaults);

      return {
        overview: {
          repair: settledData(repair),
          maintenance: settledData(maintenance),
          warehouse: settledData(warehouse),
          spareParts: settledList(spareParts),
          dailyFaults: {
            recent: recent.items,
            monthCount: monthly.total,
            error: recent.error || monthly.error,
          },
          overdueMaintenance: settledList(overdueMaintenance),
          overdueRepairs: settledList(overdueRepairs),
          forum: settledList(forum),
          lowStock: settledList(lowStock),
        },
        updatedAt: new Date().toISOString(),
      };
    } catch (err) {
      return rejectWithValue(
        String(err?.message || 'Operasyon verileri yüklenemedi')
      );
    }
  }
);

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Status
    builder
      .addCase(fetchStatusStatistics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStatusStatistics.fulfilled, (state, action) => {
        state.loading = false;
        state.total = action.payload.total;
        state.byStatus = action.payload.by_status;
      })
      .addCase(fetchStatusStatistics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // PIVOT
      .addCase(fetchPivotStatistics.pending, (state) => {
        state.pivotLoading = true;
        state.error = null;
      })
      .addCase(fetchPivotStatistics.fulfilled, (state, action) => {
        state.pivotLoading = false;
        state.pivot = action.payload;
      })
      .addCase(fetchPivotStatistics.rejected, (state, action) => {
        state.pivotLoading = false;
        state.error = action.payload;
      })

      // OPERASYON KATMANI
      .addCase(fetchDashboardOverview.pending, (state) => {
        state.overviewLoading = true;
        state.overviewError = null;
      })
      .addCase(fetchDashboardOverview.fulfilled, (state, action) => {
        state.overviewLoading = false;
        state.overview = action.payload.overview;
        state.overviewUpdatedAt = action.payload.updatedAt;
      })
      .addCase(fetchDashboardOverview.rejected, (state, action) => {
        state.overviewLoading = false;
        state.overviewError = action.payload;
      });
  },
});

export default dashboardSlice.reducer;