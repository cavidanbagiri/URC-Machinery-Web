// src/pages/CommonCarsPage.jsx
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast, { Toaster } from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';

import { fetchMachines } from '../stores/machine_slice';
import { fetchLookupIfNeeded } from '../stores/lookup_slice';
import { fetchPivotStatistics } from '../stores/dashboard_slice';

import { BsTruck } from "react-icons/bs";

import {
  FunnelIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PencilSquareIcon,
  ArrowPathIcon,
  EyeIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

import MachineFilters from '../components/machines/MachineFilters';
import MachineTable from '../components/machines/MachineTable';
import MachinePagination from '../components/machines/MachinePagination';
import MachineFormModal from '../components/machines/MachineFormModal';
import MachineCategoryCards from '../components/machines/MachineCategoryCards';
import MachineDetailModal from '../components/machines/MachineDetailModal';
import MachineStatusModal from '../components/machines/MachineStatusModal';
import ExportButton from '../components/machines/ExportButton';
import ConfirmDialog from '../components/settings/ConfirmDialog'
import { updateMachineStatus, setFilter } from '../stores/machine_slice';
import { deleteMachine } from '../stores/machine_slice';
import { quickOpenRepair } from '../stores/repair_slice';





const LOOKUPS_NEEDED = [
  'territory',
  'type_transport',
  'sub_type_transport',
  'car_mark',
  'car_model',
  'company',
  'car_status'
];

const ACTION_BUTTON_CLASS =
  'flex items-center gap-1.5 rounded-xs border-b border-b-gray-200 px-3 py-1 text-sm font-thin text-gray-700 transition cursor-pointer hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40';

export default function CommonCarsPage() {
  const dispatch = useDispatch();
  const { filters, total, offset, limit, items, loading } = useSelector((s) => s.machine);
  const {
    pivot,
    pivotLoading,
    error: dashboardError,
  } = useSelector((s) => s.dashboard);
  const lookups = useSelector((s) => s.lookup.data);

  // Tekli seçim — seçim, sayfa/filtre bağlamına bağlıdır
  const [selection, setSelection] = useState(null);
  const selectionContext = `${offset}|${limit}|${JSON.stringify(filters)}`;
  const selectedId =
    selection?.context === selectionContext ? selection.id : null;
  const selectedMachine = selectedId
    ? items.find((m) => m.id === selectedId) || null
    : null;

  // const [filtersOpen, setFiltersOpen] = useState(false);

  // Filter panel state
  const [filtersOpen, setFiltersOpen] = useState(false);
  // Kategori paneli (Gizle/Göster)
  const [categoriesOpen, setCategoriesOpen] = useState(true);

  // Makine listesi ve kategori istatistikleri aynı anda yenilenir
  const isRefreshing = loading || pivotLoading;

  // Aktiv filter sayı
  const activeFilterCount = Object.values(filters).filter(
    (v) => v !== '' && v !== null && v !== undefined
  ).length;

  // Detail modal
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailMachine, setDetailMachine] = useState(null);


  // Form modal
  const [formOpen, setFormOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState(null);

  // Status modal
  const [statusOpen, setStatusOpen] = useState(false);
  const [statusMachine, setStatusMachine] = useState(null);

  // YENİ — Delete state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingMachine, setDeletingMachine] = useState(null);
  const [deleting, setDeleting] = useState(false);




  const hasActiveFilters = Object.values(filters).some(
    (v) => v !== '' && v !== null && v !== undefined
  );

  const isFirstRender = useRef(true);
  const isPivotFirstLoad = useRef(true);

  // Lookup-ları bir dəfə yüklə
  useEffect(() => {
    LOOKUPS_NEEDED.forEach((key) => dispatch(fetchLookupIfNeeded(key)));
  }, [dispatch]);

  // İlk fetch
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      dispatch(fetchMachines());
    }
  }, [dispatch]);

  // Kategori kartları için pivot istatistiklerini yükle
  useEffect(() => {
    if (!isPivotFirstLoad.current) return;
    isPivotFirstLoad.current = false;
    dispatch(fetchPivotStatistics());
  }, [dispatch]);

  // Filter dəyişdikdə (debounce)
  useEffect(() => {
    if (isFirstRender.current) return;
    const timeout = setTimeout(() => {
      dispatch(fetchMachines());
    }, 400);
    return () => clearTimeout(timeout);
  }, [dispatch, filters]);

  // Offset / limit dəyişdikdə (dərhal)
  useEffect(() => {
    if (isFirstRender.current) return;
    dispatch(fetchMachines());
  }, [dispatch, offset, limit]);

  // ---------- HANDLERS ----------
  const clearSelection = () => setSelection(null);

  const refreshPivot = () => {
    dispatch(fetchPivotStatistics());
  };

  const handleRefresh = () => {
    dispatch(fetchMachines());
    refreshPivot();
  };

  const handleCategorySelect = (typeId) => {
    const current = String(filters.type_id ?? '');
    const next = current === String(typeId) ? '' : String(typeId);
    clearSelection();
    dispatch(setFilter({ key: 'type_id', value: next }));
  };

  const handleSelect = (machineId) => {
    setSelection((prev) =>
      prev?.context === selectionContext && prev.id === machineId
        ? null
        : { id: machineId, context: selectionContext }
    );
  };
  const handleCreate = () => {
    setEditingMachine(null);
    setFormOpen(true);
  };

  const handleUpdate = (machine) => {
    setEditingMachine(machine);
    setFormOpen(true);
  };

  // Delete düyməsinə bas
  const handleDelete = (machine) => {
    setDeletingMachine(machine);
    setDeleteOpen(true);
  };

  // Təsdiq et
  const handleDeleteConfirm = async () => {
    if (!deletingMachine) return;

    setDeleting(true);
    try {
      await dispatch(deleteMachine(deletingMachine.id)).unwrap();
      toast.success(`"${deletingMachine.identification_no}" silindi`);
      setDeleteOpen(false);
      setDeletingMachine(null);
      setSelection(null);
      refreshPivot();
    } catch (err) {
      const message =
        typeof err === 'string'
          ? err
          : err?.message || err?.detail || 'Silme hatası';
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  const handleDetail = (machine) => {
    setDetailMachine(machine);
    setDetailOpen(true);
  };

  const handleChangeStatus = (machine) => {
    setStatusMachine(machine);
    setStatusOpen(true);
  };



  // src/pages/CommonCarsPage.jsx

  const handleStatusSubmit = async (statusId) => {
    const machineId = statusMachine?.id;
    if (!machineId) return;

    const status = lookups.car_status?.find((s) => s.id === statusId);
    const isRepairStatus =
      status?.name?.trim().toLocaleLowerCase('tr-TR') === 'tamirde';

    try {
      if (isRepairStatus) {
        // Open the repair record immediately, but leave every detail (type,
        // entry/exit dates, notes) to the Repair page.
        await dispatch(quickOpenRepair(machineId)).unwrap();
        dispatch(fetchMachines());
        refreshPivot();
        toast.success(
          'Makine tamire alındı. Tarihleri ve detayları Tamir sayfasından girebilirsiniz.'
        );
      } else {
        await dispatch(
          updateMachineStatus({ id: machineId, status_id: statusId })
        ).unwrap();
        toast.success(
          `Durum "${status?.name || statusId}" olarak değiştirildi`
        );
      }
    } catch (err) {
      const message =
        typeof err === 'string'
          ? err
          : err?.message || err?.detail || 'Durum değiştirilemedi';
      toast.error(message);
    } finally {
      // HƏMİŞƏ bağla
      setStatusOpen(false);
      setStatusMachine(null);
    }
  };


  const [searchParams] = useSearchParams();
  const statusIdFromUrl = searchParams.get('status_id');

  // URL-dən status_id gəlibsə → filter tətbiq et
  useEffect(() => {
    if (statusIdFromUrl) {
      dispatch(setFilter({ key: 'status_id', value: statusIdFromUrl }));
    }
  }, [statusIdFromUrl, dispatch]);




  return (
    <div className="space-y-0 p-3">
      <Toaster position="top-right" />

      <div className='px-3 py-3 flex flex-row justify-between'>

        <div>
          <div style={{ 'fontFamily': 'Inter' }}
          className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <BsTruck className="h-4 w-4" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
            Tüm Makineler
          </h1>
        </div>
        <p className="mt-1.5 text-sm text-gray-500">
          Toplam: {total} makine
        </p>
        </div>

         <div className='mr-4 flex items-center'>
          <button
            type="button"
            onClick={() => setCategoriesOpen((value) => !value)}
            aria-expanded={categoriesOpen}
            aria-controls={
              categoriesOpen ? 'machine-category-panel' : undefined
            }
            aria-label={
              categoriesOpen
                ? 'Makine kategorilerini gizle'
                : 'Makine kategorilerini göster'
            }
            className={ACTION_BUTTON_CLASS}
          >
            {categoriesOpen ? (
              <ChevronUpIcon className="h-4 w-4" />
            ) : (
              <ChevronDownIcon className="h-4 w-4" />
            )}
            {categoriesOpen ? 'Gizle' : 'Göster'}
          </button>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            aria-busy={isRefreshing}
            aria-label="Makine listesini ve kategorileri yenile"
            title="Yenile"
            className={ACTION_BUTTON_CLASS}
          >
            <ArrowPathIcon
              className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
            />
            Yenile
          </button>

          <ExportButton />

          <button
            type="button"
            onClick={handleCreate}
            className={ACTION_BUTTON_CLASS}
          >
            <span className="text-base leading-none">+</span>
            Yeni Makine
          </button>

         </div>
      </div>

      {categoriesOpen && (
        <div className="px-3 pb-3">
          <MachineCategoryCards
            pivot={pivot}
            loading={pivotLoading}
            error={dashboardError}
            activeTypeId={filters.type_id}
            onSelectType={handleCategorySelect}
            onRefresh={refreshPivot}
          />
        </div>
      )}

      <div className="flex flex-row justify-between items-center  p-2 ">

        <div className=''>
          {selectedMachine && (
          <span
            aria-live="polite"
            className=" mr-2 text-sm font-medium text-blue-700"
          >
            1 makine seçildi
          </span>
        )}
        </div>


        <div className="flex flex-wrap items-center justify-end gap-1 rounded-t-lg   px-3 py-1">
        

          <button
            type="button"
            onClick={() => handleUpdate(selectedMachine)}
            disabled={!selectedMachine || loading}
            className={ACTION_BUTTON_CLASS}
          >
            <PencilSquareIcon className="h-4 w-4" />
            Güncelle
          </button>
          <button
            type="button"
            onClick={() => handleChangeStatus(selectedMachine)}
            disabled={!selectedMachine || loading}
            className={ACTION_BUTTON_CLASS}
          >
            <ArrowPathIcon className="h-4 w-4" />
            Durum Değiştir
          </button>
          <button
            type="button"
            onClick={() => handleDetail(selectedMachine)}
            disabled={!selectedMachine || loading}
            className={ACTION_BUTTON_CLASS}
          >
            <EyeIcon className="h-4 w-4" />
            Detaylar
          </button>
          <button
            type="button"
            onClick={() => handleDelete(selectedMachine)}
            disabled={!selectedMachine || loading}
            className={ACTION_BUTTON_CLASS}
          >
            <TrashIcon className="h-4 w-4" />
            Sil
          </button>

          <span className="mx-2 h-5 w-px bg-gray-300" aria-hidden="true" />

          

          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            className={`${ACTION_BUTTON_CLASS} ${filtersOpen || activeFilterCount > 0 ? 'bg-blue-50' : ''
              }`}
          >
            <FunnelIcon className="h-4 w-4" />
            Filtreler
            {activeFilterCount > 0 && (
              <span className="rounded-xs bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
                {activeFilterCount}
              </span>
            )}
            <ChevronDownIcon
              className={`h-4 w-4 transition-transform ${filtersOpen ? 'rotate-180' : ''
                }`}
            />
          </button>

          <span className="mx-2 h-5 w-px bg-gray-300" aria-hidden="true" />

      
        </div>

      </div>


      {/* Filter panel */}
      <MachineFilters
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        onFilterChange={clearSelection}
      />

      {/* Delete Confirm — YENİ */}
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setDeletingMachine(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Makineyi silmek istiyor musunuz?"
        message={
          deletingMachine
            ? `"${deletingMachine.identification_no || `#${deletingMachine.id}`}" silinecek. Bu işlem geri alınamaz.`
            : ''
        }
        loading={deleting}
      />

      {/* Cədvəl */}
      <MachineTable
        selectedId={selectedId}
        onSelect={handleSelect}
        onOpenFilters={() => setFiltersOpen(true)}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Pagination — tablonun altında */}
      <div className="border-t border-gray-200">
        <MachinePagination onNavigate={clearSelection} />
      </div>

      {/* Form Modal */}
      <MachineFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingMachine(null);
        }}
        editingMachine={editingMachine}
        onSaved={refreshPivot}
      />
      {/* Detail Modal — YENİ */}
      <MachineDetailModal
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setDetailMachine(null);
        }}
        machine={detailMachine}
      />
      {/* Status Modal — YENİ */}
      <MachineStatusModal
        key={`${statusMachine?.id ?? 'none'}-${statusMachine?.status_id ?? 'none'}`}
        open={statusOpen}
        onClose={() => {
          setStatusOpen(false);
          setStatusMachine(null);
        }}
        machine={statusMachine}
        statuses={lookups.car_status || []}
        onSubmit={handleStatusSubmit}
      />
    </div>
  );
}