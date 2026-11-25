// src/pages/Maintenance.jsx
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast, { Toaster } from 'react-hot-toast';
import { BsTools } from 'react-icons/bs';
import {
  ArchiveBoxIcon,
  ArrowPathIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';
import { useSearchParams } from 'react-router-dom';

import { fetchLookupIfNeeded } from '../stores/lookup_slice';
import MaintenanceService from '../services/MaintenanceService';
import {
  fetchMaintenance,
  fetchMaintenanceRecords,
  fetchMaintenanceSummary,
  resetFilters,
  resetRecordFilters,
  resetSort,
  setFilters,
  setSort,
  setTab,
} from '../stores/maintenance_slice';
import { formatDate } from '../utils/maintenance';

import SegmentedTabs from '../components/ui/SegmentedTabs';
import MaintenanceSummaryCards from '../components/maintenance/MaintenanceSummaryCards';
import MaintenanceAdvancedFilters from '../components/maintenance/MaintenanceAdvancedFilters';
import MaintenanceDateFilter from '../components/maintenance/MaintenanceDateFilter';
import MaintenanceTable from '../components/maintenance/MaintenanceTable';
import MaintenancePagination from '../components/maintenance/MaintenancePagination';
import MaintenanceArchiveFilters from '../components/maintenance/MaintenanceArchiveFilters';
import MaintenanceArchiveTable from '../components/maintenance/MaintenanceArchiveTable';
import MaintenanceArchivePagination from '../components/maintenance/MaintenanceArchivePagination';
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
    tab,
    records,
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

  // "Mevcut": makine listesi (plan + durum) · "Arşiv": yapılan bakımlar.
  const isArchive = tab === 'archive';

  const recordFilterCount = Object.values(records.filters).filter(
    (value) => value !== '' && value !== null && value !== undefined
  ).length;

  const hasActiveRecordFilters = recordFilterCount > 0;

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

  // Dashboard kartlarından gelen derin bağlantı: /maintenance?status=gecikmis
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const status = searchParams.get('status');
    if (!status) return;

    // Derin bağlantı makine listesine aittir: arşiv sekmesinden gelinmişse
    // "Mevcut" sekmesine dönülür.
    dispatch(setTab('current'));
    dispatch(resetFilters());
    dispatch(setFilters({ status }));
  }, [dispatch, searchParams]);

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
    if (isArchive) {
      dispatch(fetchMaintenanceRecords());
      return;
    }
    dispatch(fetchMaintenance());
    dispatch(fetchMaintenanceSummary());
  };

  const handleSaved = () => {
    refreshAll();
  };

  // Arşiv sekmesi: kayıtlar sekme ilk açıldığında, filtre / sayfa / boyut
  // değiştiğinde yüklenir. Tek effect + kısa debounce sayesinde yazarken istek
  // fırtınası oluşmaz ve sayfa değişiminde tek istek gider.
  useEffect(() => {
    if (tab !== 'archive') return undefined;
    const timeout = setTimeout(() => {
      dispatch(fetchMaintenanceRecords());
    }, 300);
    return () => clearTimeout(timeout);
  }, [dispatch, tab, records.filters, records.offset, records.limit]);

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

  const fetchDocumentUrl = async (document) => {
    const blob = await MaintenanceService.fetchDocument(document.id);
    return URL.createObjectURL(
      new Blob([blob], { type: document.content_type || 'application/pdf' })
    );
  };

  const handleViewDocument = async (document) => {
    // Open the tab before awaiting so the browser keeps the user gesture.
    const tab = window.open('', '_blank');
    if (!tab) {
      toast.error('Tarayıcı yeni sekmeyi engelledi');
      return;
    }

    try {
      const url = await fetchDocumentUrl(document);
      tab.location.href = url;
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      tab.close();
      toast.error('Evrak açılamadı');
    }
  };

  const handleDownloadDocument = async (document) => {
    try {
      const url = await fetchDocumentUrl(document);
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

  return (
    <div className="space-y-4 p-3">
      <Toaster position="top-right" />

      <div className="flex flex-wrap items-start justify-between gap-3 px-3 py-2">
        <div>
          <div
            style={{ fontFamily: 'Inter' }}
            className="flex items-center gap-2"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 ring-1 ring-slate-200/70">
              <BsTools className="h-4 w-4" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              Periyodik Bakım
            </h1>
          </div>
          <p className="mt-1.5 text-sm text-slate-500">
            {isArchive ? (
              `${records.total} tamamlanmış bakım kaydı · en yeni önce`
            ) : (
              <>
                Toplam {summary?.total ?? total} makine ·{' '}
                {summary?.planned ?? 0} planlı · {summary?.unplanned ?? 0}{' '}
                plansız
                {filters.updated_on && (
                  <>
                    {' '}
                    · {formatDate(filters.updated_on)} tarihinde güncellenen{' '}
                    <b className="font-semibold text-slate-700">{total}</b>{' '}
                    makine
                  </>
                )}
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tarih filtresi makine listesine aittir (güncelleme tarihi). */}
          {!isArchive && <MaintenanceDateFilter />}

          <button
            type="button"
            onClick={refreshAll}
            disabled={isArchive ? records.loading : loading}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ArrowPathIcon
              className={`h-4 w-4 ${
                (isArchive ? records.loading : loading) ? 'animate-spin' : ''
              }`}
            />
            Yenile
          </button>
        </div>
      </div>

      {!isArchive && (
        <div className="px-1">
          <MaintenanceSummaryCards
            summary={summary}
            loading={summaryLoading}
            onSelectFilters={handleSelectSummaryFilters}
          />
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 px-2">
        <div className="flex flex-wrap items-center gap-2">
          <SegmentedTabs
            ariaLabel="Bakım kayıtları"
            value={isArchive ? 'archive' : 'current'}
            onChange={(value) => dispatch(setTab(value))}
            tabs={[
              {
                id: 'current',
                label: 'Mevcut',
                count: summary?.total ?? total,
                icon: WrenchScrewdriverIcon,
              },
              {
                id: 'archive',
                label: 'Arşiv',
                count: summary?.completed ?? records.total,
                icon: ArchiveBoxIcon,
              },
            ]}
          />

          {isArchive ? (
            hasActiveRecordFilters && (
              <button
                type="button"
                onClick={() => dispatch(resetRecordFilters())}
                className="text-xs font-medium text-red-600 hover:underline"
              >
                Filtreleri temizle ({recordFilterCount})
              </button>
            )
          ) : (
            <>
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
            </>
          )}
        </div>

        <p className="text-[11px] text-slate-400">
          {isArchive
            ? 'Tamamlanan bakımlar (sayaç kayıtları hariç)'
            : 'Filtrelemek için sütun başlığına tıklayın'}
        </p>
      </div>

      {isArchive && <MaintenanceArchiveFilters />}

      {!isArchive && error && (
        <div className="mx-1 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {String(error)}
        </div>
      )}

      {isArchive && records.error && (
        <div className="mx-1 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {String(records.error)}
        </div>
      )}

      {isArchive ? (
        <div className="px-1">
          <MaintenanceArchiveTable
            items={records.items}
            loading={records.loading}
            hasActiveFilters={hasActiveRecordFilters}
            onResetFilters={() => dispatch(resetRecordFilters())}
            onViewDocument={handleViewDocument}
            onDownloadDocument={handleDownloadDocument}
          />

          <MaintenanceArchivePagination />
        </div>
      ) : (
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
      )}

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
        onViewDocument={handleViewDocument}
        onDownloadDocument={handleDownloadDocument}
      />
    </div>
  );
}

