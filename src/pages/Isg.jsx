// src/pages/Isg.jsx
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast, { Toaster } from 'react-hot-toast';
import { HiOutlineShieldExclamation } from 'react-icons/hi2';
import {
  ArrowPathIcon,
  MagnifyingGlassIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

import IsgService from '../services/IsgService';
import { fetchLookupIfNeeded } from '../stores/lookup_slice';
import {
  changeIsgStatus,
  deleteIsgAttachment,
  deleteIsgItem,
  fetchIsgItems,
  fetchIsgOverview,
  fetchIsgResponsibles,
  resetFilters,
  setFilter,
  uploadIsgAttachment,
} from '../stores/isg_slice';
import { validateEvidenceFile } from '../utils/isg';
import IsgSummaryCards from '../components/isg/IsgSummaryCards';
import IsgTable from '../components/isg/IsgTable';
import IsgPagination from '../components/isg/IsgPagination';
import IsgFormModal from '../components/isg/IsgFormModal';
import IsgCloseModal from '../components/isg/IsgCloseModal';

export default function Isg() {
  const dispatch = useDispatch();
  const {
    items,
    total,
    filters,
    offset,
    limit,
    loading,
    error,
    overview,
    overviewLoading,
    deletingId,
    statusBusyId,
    attachmentBusy,
    responsibles,
  } = useSelector((s) => s.isg);
  const territories = useSelector((s) => s.lookup.data.territory || []);

  // `seq` remounts a dialog on every open, so its form always starts from the
  // row that was clicked (or blank) without a state-syncing effect.
  const [formState, setFormState] = useState({ open: false, item: null, seq: 0 });
  const [closeState, setCloseState] = useState({ open: false, item: null, seq: 0 });

  const isFirstRender = useRef(true);

  const activeFilterCount = Object.values(filters).filter(
    (value) => value !== '' && value !== null && value !== undefined
  ).length;
  const hasActiveFilters = activeFilterCount > 0;

  useEffect(() => {
    dispatch(fetchLookupIfNeeded('territory'));
    dispatch(fetchIsgResponsibles());
    dispatch(fetchIsgItems());
    dispatch(fetchIsgOverview());
  }, [dispatch]);

  // Filter change (debounced) — the search box types on every key.
  useEffect(() => {
    if (isFirstRender.current) return undefined;
    const timeout = setTimeout(() => {
      dispatch(fetchIsgItems());
    }, 400);
    return () => clearTimeout(timeout);
  }, [dispatch, filters]);

  // Page / page-size change (immediate).
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    dispatch(fetchIsgItems());
  }, [dispatch, offset, limit]);

  const refreshAll = () => {
    dispatch(fetchIsgItems());
    dispatch(fetchIsgOverview());
  };

  const openCreate = () => {
    setFormState((prev) => ({ open: true, item: null, seq: prev.seq + 1 }));
  };

  const openEdit = (item) => {
    setFormState((prev) => ({ open: true, item, seq: prev.seq + 1 }));
  };

  const closeForm = () => {
    setFormState((prev) => ({ ...prev, open: false }));
  };

  const closeCloseModal = () => {
    setCloseState((prev) => ({ ...prev, open: false }));
  };

  const handleDelete = async (item) => {
    const confirmed = window.confirm(
      `"${item.description.slice(0, 60)}${
        item.description.length > 60 ? '…' : ''
      }" kaydını silmek istiyor musunuz?`
    );
    if (!confirmed) return;

    try {
      await dispatch(deleteIsgItem(item.id)).unwrap();
      toast.success('ISG kaydı silindi');
      dispatch(fetchIsgOverview());
    } catch (err) {
      toast.error(String(err || 'ISG kaydı silinemedi'));
    }
  };

  /**
   * Durum değişimi (11.3): "Kapalı" seçilince kapanış penceresi açılır ve
   * PDF/fotoğraf alanı otomatik görünür. Dönüş değeri, tablodaki `select`in
   * kaydın gerçek durumuna geri dönmesi için kullanılır.
   */
  const handleStatusChange = async (item, nextStatus) => {
    if (nextStatus === item.status) return true;

    if (nextStatus === 'kapali') {
      setCloseState((prev) => ({ open: true, item, seq: prev.seq + 1 }));
      return false;
    }

    const confirmed = window.confirm(
      'Bu uygunsuzluk yeniden açılsın mı? Kapanış kanıtları silinmez.'
    );
    if (!confirmed) return false;

    try {
      await dispatch(
        changeIsgStatus({ itemId: item.id, status: nextStatus })
      ).unwrap();
      toast.success('Uygunsuzluk yeniden açıldı');
      dispatch(fetchIsgOverview());
      return true;
    } catch (err) {
      toast.error(String(err || 'Durum güncellenemedi'));
      return false;
    }
  };

  const fetchEvidenceUrl = async (item, attachment) => {
    const blob = await IsgService.fetchAttachment(item.id, attachment.id);
    return URL.createObjectURL(
      new Blob([blob], {
        type: attachment.content_type || 'application/pdf',
      })
    );
  };

  const handleUploadEvidence = async (item, file) => {
    const validationError = validateEvidenceFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      await dispatch(uploadIsgAttachment({ itemId: item.id, file })).unwrap();
      toast.success(
        item.status === 'kapali' ? 'Kapanış kanıtı eklendi' : 'Kanıt eklendi'
      );
    } catch (err) {
      toast.error(String(err || 'Kanıt yüklenemedi'));
    }
  };

  const handleViewEvidence = async (item, attachment) => {
    // Open the tab before awaiting so the browser keeps the user gesture.
    const tab = window.open('', '_blank');
    if (!tab) {
      toast.error('Tarayıcı yeni sekmeyi engelledi');
      return;
    }

    try {
      const url = await fetchEvidenceUrl(item, attachment);
      tab.location.href = url;
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      tab.close();
      toast.error('Kanıt açılamadı');
    }
  };

  const handleDownloadEvidence = async (item, attachment) => {
    try {
      const url = await fetchEvidenceUrl(item, attachment);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = attachment.file_name || 'kanit';
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      toast.error('Kanıt indirilemedi');
    }
  };

  const handleDeleteEvidence = async (item, attachment) => {
    const confirmed = window.confirm(
      `"${attachment.file_name}" kanıtını silmek istiyor musunuz?`
    );
    if (!confirmed) return;

    try {
      await dispatch(
        deleteIsgAttachment({
          itemId: item.id,
          attachmentId: attachment.id,
        })
      ).unwrap();
      toast.success('Kanıt silindi');
    } catch (err) {
      toast.error(String(err || 'Kanıt silinemedi'));
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
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600">
              <HiOutlineShieldExclamation className="h-4 w-4" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
              ISG
            </h1>
          </div>
          <p className="mt-1.5 text-sm text-gray-500">
            Toplam {total} uygunsuzluk · SRU / DCU açılan ve kapatılan takibi
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
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4" />
            Yeni Uygunsuzluk
          </button>
        </div>
      </div>

      <div className="px-1">
        <IsgSummaryCards overview={overview} loading={overviewLoading} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-2">
        <div className="relative w-full max-w-sm">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={filters.search}
            onChange={(event) =>
              dispatch(setFilter({ key: 'search', value: event.target.value }))
            }
            placeholder="Açıklama, şantiye veya sorumlu ara..."
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
              onClick={() => dispatch(resetFilters())}
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
        <IsgTable
          items={items}
          loading={loading}
          hasActiveFilters={hasActiveFilters}
          onResetFilters={() => dispatch(resetFilters())}
          filters={filters}
          onFilterChange={(key, value) =>
            dispatch(setFilter({ key, value }))
          }
          territories={territories}
          responsibles={responsibles}
          onEdit={openEdit}
          onDelete={handleDelete}
          deletingId={deletingId}
          onStatusChange={handleStatusChange}
          statusBusyId={statusBusyId}
          onUploadEvidence={handleUploadEvidence}
          onViewEvidence={handleViewEvidence}
          onDownloadEvidence={handleDownloadEvidence}
          onDeleteEvidence={handleDeleteEvidence}
          evidenceBusy={attachmentBusy}
        />

        <IsgPagination />
      </div>

      <IsgFormModal
        key={`isg-form-${formState.seq}`}
        open={formState.open}
        item={formState.item}
        onClose={closeForm}
        onSaved={refreshAll}
      />

      <IsgCloseModal
        key={`isg-close-${closeState.seq}`}
        open={closeState.open}
        item={closeState.item}
        onClose={closeCloseModal}
        onSaved={refreshAll}
      />
    </div>
  );
}
