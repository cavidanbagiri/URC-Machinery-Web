// src/pages/RentalMachines.jsx
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast, { Toaster } from 'react-hot-toast';
import { HiOutlineKey } from 'react-icons/hi2';
import {
  ArrowPathIcon,
  MagnifyingGlassIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

import {
  deleteRentalMachine,
  fetchRentalMachines,
  resetFilters,
  setFilter,
} from '../stores/rental_machine_slice';
import { fetchLookupIfNeeded } from '../stores/lookup_slice';
import RentalMachineTable from '../components/rentalmachine/RentalMachineTable';
import RentalMachineTypeStats from '../components/rentalmachine/RentalMachineTypeStats';
import RentalMachinePagination from '../components/rentalmachine/RentalMachinePagination';
import RentalMachineFormModal from '../components/rentalmachine/RentalMachineFormModal';

export default function RentalMachines() {
  const dispatch = useDispatch();
  const {
    items,
    total,
    filters,
    typeStats,
    offset,
    limit,
    loading,
    error,
    deletingId,
  } = useSelector((s) => s.rentalMachine);

  // `seq` remounts the dialog on every open, so its form always starts from the
  // row that was clicked (or blank) without a state-syncing effect.
  const [modalState, setModalState] = useState({
    open: false,
    item: null,
    seq: 0,
  });

  const activeFilterCount = Object.values(filters).filter(
    (value) => value !== '' && value !== null && value !== undefined
  ).length;
  const hasActiveFilters = activeFilterCount > 0;

  const isFirstRender = useRef(true);

  // First load.
  useEffect(() => {
    dispatch(fetchRentalMachines());
  }, [dispatch]);

  // Header filters / the form need the fleet lookups (tip, marka, model).
  // `fetchLookupIfNeeded` caches per key, so this is a no-op afterwards.
  useEffect(() => {
    ['type_transport', 'car_mark', 'car_model'].forEach((key) => {
      dispatch(fetchLookupIfNeeded(key));
    });
  }, [dispatch]);

  // Filter change (debounced).
  useEffect(() => {
    if (isFirstRender.current) return undefined;
    const timeout = setTimeout(() => {
      dispatch(fetchRentalMachines());
    }, 400);
    return () => clearTimeout(timeout);
  }, [dispatch, filters]);

  // Page / page-size change (immediate).
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    dispatch(fetchRentalMachines());
  }, [dispatch, offset, limit]);

  const refresh = () => dispatch(fetchRentalMachines());

  const openCreate = () => {
    setModalState((prev) => ({ open: true, item: null, seq: prev.seq + 1 }));
  };

  const openEdit = (item) => {
    setModalState((prev) => ({ open: true, item, seq: prev.seq + 1 }));
  };

  const closeModal = () => {
    setModalState((prev) => ({ ...prev, open: false }));
  };

  const handleDelete = async (item) => {
    const confirmed = window.confirm(
      `"${item.equipment_name}" kiralama kaydını silmek istiyor musunuz?`
    );
    if (!confirmed) return;

    try {
      await dispatch(deleteRentalMachine(item.id)).unwrap();
      toast.success('Kiralama kaydı silindi');
      refresh();
    } catch (err) {
      toast.error(String(err || 'Kiralama kaydı silinemedi'));
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
              <HiOutlineKey className="h-4 w-4" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
              Kiralık Makineler
            </h1>
          </div>
          <p className="mt-1.5 text-sm text-gray-500">
            Toplam {total} kiralama kaydı · Durum (Aktif / Planlandı / Süresi
            doldu) tarihlere göre otomatik hesaplanır
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={refresh}
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
            Kiralık Makine Ekle
          </button>
        </div>
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
            placeholder="Tip, marka, model, plaka, firma veya şantiye ara..."
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* <span className="text-[11px] text-gray-500">
            Sütun başlığındaki huniye tıklayarak filtreleyin
          </span> */}

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

      <div className="space-y-3 px-1">
        <RentalMachineTypeStats
          stats={typeStats}
          loading={loading}
          activeTypeId={filters.machine_type_id}
          onSelectType={(typeId) =>
            dispatch(
              setFilter({ key: 'machine_type_id', value: typeId ?? '' })
            )
          }
        />

        <RentalMachineTable
          items={items}
          loading={loading}
          hasActiveFilters={hasActiveFilters}
          onResetFilters={() => dispatch(resetFilters())}
          onEdit={openEdit}
          onDelete={handleDelete}
          deletingId={deletingId}
        />

        <RentalMachinePagination />
      </div>

      <RentalMachineFormModal
        key={modalState.seq}
        open={modalState.open}
        item={modalState.item}
        onClose={closeModal}
        onSaved={refresh}
      />
    </div>
  );
}
