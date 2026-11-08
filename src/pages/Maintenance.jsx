// src/pages/Maintenance.jsx
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { BsTools } from 'react-icons/bs';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

import { fetchLookupIfNeeded } from '../stores/lookup_slice';
import {
  fetchMaintenance,
  fetchMaintenanceSummary,
  resetFilters,
  resetSort,
  setFilters,
  setSort,
} from '../stores/maintenance_slice';

import MaintenanceSummaryCards from '../components/maintenance/MaintenanceSummaryCards';
import MaintenanceAdvancedFilters from '../components/maintenance/MaintenanceAdvancedFilters';
import MaintenanceTable from '../components/maintenance/MaintenanceTable';
import MaintenancePagination from '../components/maintenance/MaintenancePagination';
import MaintenancePlanModal from '../components/maintenance/MaintenancePlanModal';
import MaintenanceReadingModal from '../components/maintenance/MaintenanceReadingModal';
import MaintenanceCompleteModal from '../components/maintenance/MaintenanceCompleteModal';
import MaintenanceHistoryDrawer from '../components/maintenance/MaintenanceHistoryDrawer';

const LOOKUPS_NEEDED = ['territory', 'type_transport', 'company'];

export default function Maintenance() {
  const dispatch = useDispatch();
  const {
    items,
    total,
    limit,
    offset,
    filters,
    sort_by,
    sort_order,
    loading,
    error,
    summary,
    summaryLoading,
  } = useSelector((s) => s.maintenance);

  const [planOpen, setPlanOpen] = useState(false);
  const [planMachine, setPlanMachine] = useState(null);

  const [readingOpen, setReadingOpen] = useState(false);
  const [readingMachine, setReadingMachine] = useState(null);

  const [completeOpen, setCompleteOpen] = useState(false);
  const [completeMachine, setCompleteMachine] = useState(null);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyMachine, setHistoryMachine] = useState(null);

  const activeFilterCount = Object.entries(filters).filter(([key, value]) =>
    key === 'include_inactive'
      ? value === true
      : value !== '' && value !== null && value !== undefined
  ).length;

  const hasActiveFilters = activeFilterCount > 0;

  const isFirstRender = useRef(true);

  // Lookup'ları bir kez yükle
  useEffect(() => {
    LOOKUPS_NEEDED.forEach((key) => dispatch(fetchLookupIfNeeded(key)));
  }, [dispatch]);

  // İlk yükleme
  useEffect(() => {
    dispatch(fetchMaintenance());
    dispatch(fetchMaintenanceSummary());
  }, [dispatch]);

  // Filtre değişince (debounce)
  useEffect(() => {
    if (isFirstRender.current) return undefined;
    const timeout = setTimeout(() => {
      dispatch(fetchMaintenance());
    }, 400);
    return () => clearTimeout(timeout);
  }, [dispatch, filters]);

  // Sayfalama / sıralama değişince (hemen)
  useEffect(() => {
    if (isFirstRender.current) return;
    dispatch(fetchMaintenance());
  }, [dispatch, offset, limit, sort_by, sort_order]);

  // İlk render tamamlandı
  useEffect(() => {
    isFirstRender.current = false;
  }, []);

  const refreshAll = () => {
    dispatch(fetchMaintenance());
    dispatch(fetchMaintenanceSummary());
  };

  const handleSaved = () => {
    refreshAll();
  };

  const handleSelectSummaryFilters = (nextFilters) => {
    // Summary counts are calculated over the whole dataset, so a card must
    // replace the current filters instead of merging into them. Otherwise an
    // unrelated active filter (unit, plan state, search...) can hide rows that
    // the selected card is counting.
    dispatch(resetFilters());
    dispatch(
      setFilters({
        ...nextFilters,
        ...(nextFilters.has_plan === 'true' ? { include_inactive: false } : {}),
      })
    );
  };

  const handleResetFilters = () => {
    dispatch(resetFilters());
    dispatch(resetSort());
  };

  // "Kalan" kolonuna tıklayınca artan/azalan sıralama arasında geçiş yap.
  const toggleRemainingSort = () => {
    if (sort_by !== 'remaining') {
      dispatch(setSort({ field: 'remaining', order: 'asc' }));
      return;
    }
    dispatch(
      setSort({
        field: 'remaining',
        order: sort_order === 'desc' ? 'asc' : 'desc',
      })
    );
  };

  const openPlan = (item) => {
    setPlanMachine(item);
    setPlanOpen(true);
  };

  const openReading = (item) => {
    setReadingMachine(item);
    setReadingOpen(true);
  };

  const openComplete = (item) => {
    setCompleteMachine(item);
    setCompleteOpen(true);
  };

  const openHistory = (item) => {
    setHistoryMachine(item);
    setHistoryOpen(true);
  };

  return (
    <div className="space-y-4 p-3">
      <Toaster position="top-right" />

      <div className="flex flex-wrap items-start justify-between gap-3 px-3 py-2">
        <div>
          <div
            style={{ fontFamily: 'Inter' }}
            className="flex items-center gap-2"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <BsTools className="h-4 w-4" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
              Periyodik Bakım
            </h1>
          </div>
          <p className="mt-1.5 text-sm text-gray-500">
            Toplam {summary?.total ?? total} makine ·{' '}
            {summary?.planned ?? 0} planlı · {summary?.unplanned ?? 0} plansız
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={refreshAll}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ArrowPathIcon
              className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
            />
            Yenile
          </button>
        </div>
      </div>

      <div className="px-1">
        <MaintenanceSummaryCards
          summary={summary}
          loading={summaryLoading}
          onSelectFilters={handleSelectSummaryFilters}
          onResetFilters={handleResetFilters}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-2">
        <div className="flex items-center gap-2">
          <MaintenanceAdvancedFilters />

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs font-medium text-red-600 hover:underline"
            >
              Filtreleri temizle ({activeFilterCount})
            </button>
          )}
        </div>

        <p className="text-[11px] text-gray-400">
          Filtrelemek için sütun başlığına tıklayın
        </p>
      </div>

      {error && (
        <div className="mx-1 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {String(error)}
        </div>
      )}

      <div className="px-1">
        <MaintenanceTable
          items={items}
          loading={loading}
          hasActiveFilters={hasActiveFilters}
          onOpenFilters={handleResetFilters}
          onResetFilters={handleResetFilters}
          onEditPlan={openPlan}
          onReading={openReading}
          onComplete={openComplete}
          onHistory={openHistory}
          sortBy={sort_by}
          sortOrder={sort_order}
          onSortChange={toggleRemainingSort}
        />

        <MaintenancePagination />
      </div>

      <MaintenancePlanModal
        open={planOpen}
        onClose={() => setPlanOpen(false)}
        machine={planMachine}
        onSaved={handleSaved}
      />

      <MaintenanceReadingModal
        open={readingOpen}
        onClose={() => setReadingOpen(false)}
        machine={readingMachine}
        onSaved={handleSaved}
      />

      <MaintenanceCompleteModal
        open={completeOpen}
        onClose={() => setCompleteOpen(false)}
        machine={completeMachine}
        onSaved={handleSaved}
      />

      <MaintenanceHistoryDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        machine={historyMachine}
      />
    </div>
  );
}

