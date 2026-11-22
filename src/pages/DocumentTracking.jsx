// src/pages/DocumentTracking.jsx
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast, { Toaster } from 'react-hot-toast';
import { HiOutlineClipboardDocumentList } from 'react-icons/hi2';
import {
  ArrowPathIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

import { fetchLookupIfNeeded } from '../stores/lookup_slice';
import {
  fetchDocumentTracking,
  resetFilters,
  setFilter,
  updateDocumentTracking,
} from '../stores/document_tracking_slice';
import {
  draftFromItem,
  payloadFromDraft,
} from '../utils/documentTracking';
import DocumentTrackingTable from '../components/documenttracking/DocumentTrackingTable';
import DocumentTrackingPagination from '../components/documenttracking/DocumentTrackingPagination';

const LOOKUPS_NEEDED = [
  'territory',
  'type_transport',
  'car_mark',
  'car_model',
];

export default function DocumentTracking() {
  const dispatch = useDispatch();
  const {
    items,
    total,
    limit,
    offset,
    filters,
    loading,
    error,
    updating,
    updatingId,
  } = useSelector((s) => s.documentTracking);

  // One row at a time. `context` ties the draft to the page/filter state, so a
  // filter or page change hides a stale draft instead of saving it elsewhere.
  const [editingState, setEditingState] = useState(null);
  const editContext = `${offset}|${limit}|${JSON.stringify(filters)}`;
  const editing =
    editingState?.context === editContext ? editingState : null;
  const editingId = editing?.machineId ?? null;
  const draft = editing?.draft ?? {};

  const activeFilterCount = Object.values(filters).filter(
    (value) => value !== '' && value !== null && value !== undefined
  ).length;
  const hasActiveFilters = activeFilterCount > 0;

  const isFirstRender = useRef(true);

  useEffect(() => {
    LOOKUPS_NEEDED.forEach((key) => dispatch(fetchLookupIfNeeded(key)));
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchDocumentTracking());
  }, [dispatch]);

  // Filter change (debounced).
  useEffect(() => {
    if (isFirstRender.current) return undefined;
    const timeout = setTimeout(() => {
      dispatch(fetchDocumentTracking());
    }, 400);
    return () => clearTimeout(timeout);
  }, [dispatch, filters]);

  // Page / page-size change (immediate).
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    dispatch(fetchDocumentTracking());
  }, [dispatch, offset, limit]);

  const refreshAll = () => {
    setEditingState(null);
    dispatch(fetchDocumentTracking());
  };

  const handleResetFilters = () => {
    setEditingState(null);
    dispatch(resetFilters());
  };

  const handleSearchChange = (value) => {
    setEditingState(null);
    dispatch(setFilter({ key: 'search', value }));
  };

  const handleStartEdit = (item) => {
    setEditingState({
      machineId: item.machine_id,
      context: editContext,
      draft: draftFromItem(item),
    });
  };

  const handleDraftChange = (field, value) => {
    setEditingState((prev) =>
      prev
        ? { ...prev, draft: { ...prev.draft, [field]: value } }
        : prev
    );
  };

  const handleCancelEdit = () => setEditingState(null);

  const handleSave = async (item) => {
    if (!editing) return;
    try {
      await dispatch(
        updateDocumentTracking({
          machineId: item.machine_id,
          payload: payloadFromDraft(editing.draft),
        })
      ).unwrap();
      toast.success('Evrak bilgileri güncellendi');
      setEditingState(null);
    } catch (err) {
      toast.error(String(err || 'Evrak bilgileri güncellenemedi'));
    }
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
              <HiOutlineClipboardDocumentList className="h-4 w-4" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
              Evrak Takip Tablosu
            </h1>
          </div>
          <p className="mt-1.5 text-sm text-gray-500">
            Toplam {total} makine · Tarihleri satırdaki{' '}
            <span className="font-medium text-gray-700">Güncelle</span>{' '}
            düğmesiyle girin
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

      <div className="flex flex-wrap items-center justify-between gap-3 px-2">
        <div className="relative w-full max-w-sm">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={filters.search}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Makine ID, plaka, VIN, şantiye veya marka ara..."
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 text-[11px] text-gray-500">
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              Süresi geçmiş
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              30 gün içinde
            </span>
          </div>

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
      </div>

      {error && (
        <div className="mx-1 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {String(error)}
        </div>
      )}

      <div className="px-1">
        <DocumentTrackingTable
          items={items}
          loading={loading}
          hasActiveFilters={hasActiveFilters}
          onResetFilters={handleResetFilters}
          onBeforeFilterChange={() => setEditingState(null)}
          editingId={editingId}
          draft={draft}
          updating={updating}
          updatingId={updatingId}
          onStartEdit={handleStartEdit}
          onChangeDraft={handleDraftChange}
          onCancelEdit={handleCancelEdit}
          onSave={handleSave}
        />

        <DocumentTrackingPagination
          onNavigate={() => setEditingState(null)}
        />
      </div>
    </div>
  );
}
