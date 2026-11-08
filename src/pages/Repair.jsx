// src/pages/Repair.jsx
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { BsWrench } from 'react-icons/bs';
import { ArrowPathIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useSearchParams } from 'react-router-dom';

import { fetchLookupIfNeeded } from '../stores/lookup_slice';
import {
  fetchRepairSummary,
  fetchRepairs,
  resetFilters,
  setFilters,
} from '../stores/repair_slice';

import RepairSummaryCards from '../components/repair/RepairSummaryCards';
import RepairAdvancedFilters from '../components/repair/RepairAdvancedFilters';
import RepairTable from '../components/repair/RepairTable';
import RepairPagination from '../components/repair/RepairPagination';
import RepairFormModal from '../components/repair/RepairFormModal';
import RepairCloseModal from '../components/repair/RepairCloseModal';
import RepairCancelModal from '../components/repair/RepairCancelModal';
import RepairReopenModal from '../components/repair/RepairReopenModal';
import RepairNoteModal from '../components/repair/RepairNoteModal';
import RepairHistoryDrawer from '../components/repair/RepairHistoryDrawer';

const LOOKUPS_NEEDED = [
  'repair_type',
  'garage_service',
  'territory',
  'type_transport',
  'company',
];


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

  // Dashboard kartlarından gelen derin bağlantı:
  // /repair?status=tamirde veya /repair?repair_type_id=3
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const status = searchParams.get('status');
    const repairTypeId = searchParams.get('repair_type_id');

    if (!status && !repairTypeId) return;

    dispatch(resetFilters());
    dispatch(
      setFilters({
        ...(status ? { status } : {}),
        ...(repairTypeId ? { repair_type_id: repairTypeId } : {}),
      })
    );
  }, [dispatch, searchParams]);

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
  };

  const handleResetFilters = () => {
    dispatch(resetFilters());
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
              Arızalı Ekipman
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
            Yeni Arıza
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
        <div className="flex items-center gap-2">
          <RepairAdvancedFilters />

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
        <RepairTable
          items={items}
          loading={loading}
          hasActiveFilters={hasActiveFilters}
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

