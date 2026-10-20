// src/pages/Repair.jsx
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { BsWrench } from 'react-icons/bs';
import {
  ArrowPathIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

import { fetchLookupIfNeeded } from '../stores/lookup_slice';
import {
  fetchRepairSummary,
  fetchRepairs,
  resetFilters,
  setFilter,
  setFilters,
} from '../stores/repair_slice';

import RepairSummaryCards from '../components/repair/RepairSummaryCards';
import RepairFilters from '../components/repair/RepairFilters';
import RepairTable from '../components/repair/RepairTable';
import RepairPagination from '../components/repair/RepairPagination';
import RepairFormModal from '../components/repair/RepairFormModal';
import RepairCloseModal from '../components/repair/RepairCloseModal';
import RepairCancelModal from '../components/repair/RepairCancelModal';
import RepairReopenModal from '../components/repair/RepairReopenModal';
import RepairNoteModal from '../components/repair/RepairNoteModal';
import RepairHistoryDrawer from '../components/repair/RepairHistoryDrawer';

const LOOKUPS_NEEDED = ['repair_type', 'territory', 'type_transport', 'company'];

export default function Repair() {
  const dispatch = useDispatch();
  const {
    items,
    total,
    limit,
    offset,
    filters,
    loading,
    error,
    summary,
    summaryLoading,
  } = useSelector((s) => s.repair);

  const [filtersOpen, setFiltersOpen] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [formRecord, setFormRecord] = useState(null);

  const [closeOpen, setCloseOpen] = useState(false);
  const [closeRecord, setCloseRecord] = useState(null);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelRecord, setCancelRecord] = useState(null);

  const [reopenOpen, setReopenOpen] = useState(false);
  const [reopenRecord, setReopenRecord] = useState(null);

  const [noteOpen, setNoteOpen] = useState(false);
  const [noteRecord, setNoteRecord] = useState(null);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyRecord, setHistoryRecord] = useState(null);

  const activeFilterCount = Object.values(filters).filter((value) => {
    if (typeof value === 'boolean') return value;
    return value !== '' && value !== null && value !== undefined;
  }).length;
  const hasActiveFilters = activeFilterCount > 0;

  const isFirstRender = useRef(true);
  const [modalNonce, setModalNonce] = useState(0);

  const nextModalKey = () => {
    setModalNonce((value) => value + 1);
  };

  useEffect(() => {
    LOOKUPS_NEEDED.forEach((key) => dispatch(fetchLookupIfNeeded(key)));
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchRepairs());
    dispatch(fetchRepairSummary());
  }, [dispatch]);

  useEffect(() => {
    if (isFirstRender.current) return undefined;
    const timeout = setTimeout(() => {
      dispatch(fetchRepairs());
    }, 400);
    return () => clearTimeout(timeout);
  }, [dispatch, filters]);

  useEffect(() => {
    if (isFirstRender.current) return;
    dispatch(fetchRepairs());
  }, [dispatch, offset, limit]);

  useEffect(() => {
    isFirstRender.current = false;
  }, []);

  const refreshAll = () => {
    dispatch(fetchRepairs());
    dispatch(fetchRepairSummary());
  };

  const handleSaved = () => {
    refreshAll();
  };

  const handleSelectSummaryFilters = (nextFilters) => {
    dispatch(resetFilters());
    dispatch(setFilters(nextFilters));
    setFiltersOpen(false);
  };

  const handleResetFilters = () => {
    dispatch(resetFilters());
    setFiltersOpen(false);
  };

  const openCreate = () => {
    nextModalKey();
    setFormRecord(null);
    setFormOpen(true);
  };

  const openEdit = (record) => {
    nextModalKey();
    setFormRecord(record);
    setFormOpen(true);
  };

  const openClose = (record) => {
    nextModalKey();
    setCloseRecord(record);
    setCloseOpen(true);
  };

  const openCancel = (record) => {
    nextModalKey();
    setCancelRecord(record);
    setCancelOpen(true);
  };

  const openReopen = (record) => {
    nextModalKey();
    setReopenRecord(record);
    setReopenOpen(true);
  };

  const openNote = (record) => {
    nextModalKey();
    setNoteRecord(record);
    setNoteOpen(true);
  };

  const openHistory = (record) => {
    nextModalKey();
    setHistoryRecord(record);
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
              <BsWrench className="h-4 w-4" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
              Tamir
            </h1>
          </div>
          <p className="mt-1.5 text-sm text-gray-500">
            {summary?.total ?? total} kayıt · {summary?.active ?? 0} tamirde ·{' '}
            {summary?.overdue ?? 0} gecikmiş
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

          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4" />
            Yeni Tamir
          </button>
        </div>
      </div>

      <div className="px-1">
        <RepairSummaryCards
          summary={summary}
          loading={summaryLoading}
          onSelectFilters={handleSelectSummaryFilters}
          onResetFilters={handleResetFilters}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-2">
        <div className="relative w-full max-w-sm">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) =>
              dispatch(setFilter({ key: 'search', value: e.target.value }))
            }
            placeholder="Makine, arıza yeri veya not ara..."
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs font-medium text-red-600 hover:underline"
            >
              Filtreleri temizle
            </button>
          )}

          <button
            type="button"
            onClick={() => setFiltersOpen((prev) => !prev)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition ${
              filtersOpen || activeFilterCount > 0
                ? 'border-blue-200 bg-blue-50 text-blue-700'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FunnelIcon className="h-4 w-4" />
            Filtreler
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="px-1">
        <RepairFilters
          open={filtersOpen}
          onClose={() => setFiltersOpen(false)}
        />
      </div>

      {error && (
        <div className="mx-1 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {String(error)}
        </div>
      )}

      <div className="px-1">
        <RepairTable
          items={items}
          loading={loading}
          hasActiveFilters={hasActiveFilters}
          onOpenFilters={() => setFiltersOpen(true)}
          onResetFilters={handleResetFilters}
          onEdit={openEdit}
          onCloseRepair={openClose}
          onCancel={openCancel}
          onReopen={openReopen}
          onNote={openNote}
          onHistory={openHistory}
        />

        <RepairPagination />
      </div>

      <RepairFormModal
        key={`repair-form-${modalNonce}`}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        record={formRecord}
        onSaved={handleSaved}
      />

      <RepairCloseModal
        key={`repair-close-${modalNonce}`}
        open={closeOpen}
        onClose={() => setCloseOpen(false)}
        record={closeRecord}
        onSaved={handleSaved}
      />

      <RepairCancelModal
        key={`repair-cancel-${modalNonce}`}
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        record={cancelRecord}
        onSaved={handleSaved}
      />

      <RepairReopenModal
        key={`repair-reopen-${modalNonce}`}
        open={reopenOpen}
        onClose={() => setReopenOpen(false)}
        record={reopenRecord}
        onSaved={handleSaved}
      />

      <RepairNoteModal
        key={`repair-note-${modalNonce}`}
        open={noteOpen}
        onClose={() => setNoteOpen(false)}
        record={noteRecord}
        onSaved={handleSaved}
      />

      <RepairHistoryDrawer
        key={`repair-history-${modalNonce}`}
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        machine={historyRecord}
      />
    </div>
  );
}

