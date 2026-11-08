// src/pages/DailyFaults.jsx
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast, { Toaster } from 'react-hot-toast';
import { HiOutlineClipboardDocumentList } from 'react-icons/hi2';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowPathIcon,
  MagnifyingGlassIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

import DailyFaultService from '../services/DailyFaultService';
import { fetchLookupIfNeeded } from '../stores/lookup_slice';
import {
  deleteDailyFaultDocument,
  fetchDailyFaults,
  resetFilters,
  setFilter,
  uploadDailyFaultDocument,
} from '../stores/daily_fault_slice';
import { validatePdfFile } from '../utils/dailyFault';
import DailyFaultTable from '../components/dailyfault/DailyFaultTable';
import DailyFaultPagination from '../components/dailyfault/DailyFaultPagination';
import DailyFaultFormModal from '../components/dailyfault/DailyFaultFormModal';

const LOOKUPS_NEEDED = ['territory', 'repair_type'];

export default function DailyFaults() {
  const dispatch = useDispatch();
  const { items, total, limit, offset, filters, loading, error, documentBusy } =
    useSelector((s) => s.dailyFault);

  const [formOpen, setFormOpen] = useState(false);
  const [formNonce, setFormNonce] = useState(0);

  const isFirstRender = useRef(true);

  const activeFilterCount = Object.values(filters).filter(
    (value) => value !== '' && value !== null && value !== undefined
  ).length;
  const hasActiveFilters = activeFilterCount > 0;

  useEffect(() => {
    LOOKUPS_NEEDED.forEach((key) => dispatch(fetchLookupIfNeeded(key)));
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchDailyFaults());
  }, [dispatch]);

  // Dashboard kartından gelen derin bağlantı: /daily_faults?date_from=YYYY-MM-01
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const dateFrom = searchParams.get('date_from');
    if (!dateFrom) return;

    dispatch(resetFilters());
    dispatch(setFilter({ key: 'date_from', value: dateFrom }));
  }, [dispatch, searchParams]);

  useEffect(() => {
    if (isFirstRender.current) return undefined;
    const timeout = setTimeout(() => {
      dispatch(fetchDailyFaults());
    }, 400);
    return () => clearTimeout(timeout);
  }, [dispatch, filters]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    dispatch(fetchDailyFaults());
  }, [dispatch, offset, limit]);

  const refreshAll = () => dispatch(fetchDailyFaults());
  const handleResetFilters = () => dispatch(resetFilters());

  const openCreate = () => {
    setFormNonce((value) => value + 1);
    setFormOpen(true);
  };

  const fetchDocumentUrl = async (item, document) => {
    const blob = await DailyFaultService.fetchDocument(item.id, document.id);
    return URL.createObjectURL(
      new Blob([blob], { type: document.content_type || 'application/pdf' })
    );
  };

  const handleUploadDocument = async (item, file) => {
    const validationError = validatePdfFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      await dispatch(
        uploadDailyFaultDocument({ faultId: item.id, file })
      ).unwrap();
      toast.success('Evrak eklendi');
    } catch (err) {
      toast.error(String(err || 'Evrak yüklenemedi'));
    }
  };

  const handleViewDocument = async (item, document) => {
    // Open the tab before awaiting so the browser keeps the user gesture.
    const tab = window.open('', '_blank');
    if (!tab) {
      toast.error('Tarayıcı yeni sekmeyi engelledi');
      return;
    }

    try {
      const url = await fetchDocumentUrl(item, document);
      tab.location.href = url;
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      tab.close();
      toast.error('Evrak açılamadı');
    }
  };

  const handleDownloadDocument = async (item, document) => {
    try {
      const url = await fetchDocumentUrl(item, document);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.file_name || 'evrak.pdf';
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      toast.error('Evrak indirilemedi');
    }
  };

  const handleDeleteDocument = async (item, document) => {
    const confirmed = window.confirm(
      `"${document.file_name}" evrakını silmek istiyor musunuz?`
    );
    if (!confirmed) return;

    try {
      await dispatch(
        deleteDailyFaultDocument({
          faultId: item.id,
          documentId: document.id,
        })
      ).unwrap();
      toast.success('Evrak silindi');
    } catch (err) {
      toast.error(String(err || 'Evrak silinemedi'));
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
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <HiOutlineClipboardDocumentList className="h-4 w-4" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
              Günlük Arıza - Tamir
            </h1>
          </div>
          <p className="mt-1.5 text-sm text-gray-500">
            {total} kayıt · Hızlı müdahaleler; makine durumu değişmez
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

      <div className="flex flex-wrap items-center justify-between gap-3 px-2">
        <div className="relative w-full max-w-sm">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) =>
              dispatch(setFilter({ key: 'search', value: e.target.value }))
            }
            placeholder="Makine kimlik no, şantiye veya not ara..."
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="flex items-center gap-3">
          <p className="text-[11px] text-gray-400">
            Filtrelemek için sütun başlığına tıklayın
          </p>

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
        <DailyFaultTable
          items={items}
          loading={loading}
          hasActiveFilters={hasActiveFilters}
          onResetFilters={handleResetFilters}
          onUploadDocument={handleUploadDocument}
          onViewDocument={handleViewDocument}
          onDownloadDocument={handleDownloadDocument}
          onDeleteDocument={handleDeleteDocument}
          documentBusy={documentBusy}
        />

        <DailyFaultPagination />
      </div>

      <DailyFaultFormModal
        key={`daily-fault-form-${formNonce}`}
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={refreshAll}
      />
    </div>
  );
}

