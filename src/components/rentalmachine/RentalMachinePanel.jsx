// src/components/rentalmachine/RentalMachinePanel.jsx
//
// **Tüm Makineler → Kiralık Makineler** sekmesinin gövdesi. Kiralık ekipman
// listesi eskiden ayrı bir menü girişiydi (`/rental_machines`); navbar
// sadeleştiği için liste filo tablosuyla aynı sayfada, sekme altında yaşar.
//
// Bileşen kendi Redux dilimini (`rentalMachine`) yönetir: ilk yükleme,
// arama/filtre (debounce), sayfalama, satır düzenleme/silme ve yeni kayıt
// penceresi burada. Sayfa yalnızca sekme seçildiğinde mount ettiği için
// kiralık istekleri filo sekmesinde hiç atılmaz.
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';

import { fetchLookupIfNeeded } from '../../stores/lookup_slice';
import {
  deleteRentalMachine,
  fetchRentalMachines,
  resetFilters,
  setFilter,
} from '../../stores/rental_machine_slice';

import RentalMachineTable from './RentalMachineTable';
import RentalMachineTypeChips from './RentalMachineTypeChips';
import RentalMachinePagination from './RentalMachinePagination';
import RentalMachineFormModal from './RentalMachineFormModal';

export default function RentalMachinePanel() {
  const dispatch = useDispatch();
  const {
    items,
    filters,
    typeStats,
    offset,
    limit,
    loading,
    error,
    deletingId,
  } = useSelector((s) => s.rentalMachine);

  // `seq` penceresi her açılışta yeniden kurulur, böylece form tıklanan
  // satırdan (veya boş olarak) başlar; state eşitleyen effect gerekmez.
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

  // İlk yükleme.
  useEffect(() => {
    dispatch(fetchRentalMachines());
  }, [dispatch]);

  // Başlık filtreleri ve form, filo sözlüklerine ihtiyaç duyar (tip, marka).
  // `fetchLookupIfNeeded` anahtar başına önbelleklediği için sonraki çağrılar
  // boşa gitmez.
  useEffect(() => {
    ['type_transport', 'car_mark'].forEach((key) => {
      dispatch(fetchLookupIfNeeded(key));
    });
  }, [dispatch]);

  // Filtre değişimi (debounce).
  useEffect(() => {
    if (isFirstRender.current) return undefined;
    const timeout = setTimeout(() => {
      dispatch(fetchRentalMachines());
    }, 400);
    return () => clearTimeout(timeout);
  }, [dispatch, filters]);

  // Sayfa / sayfa boyutu değişimi (hemen).
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    dispatch(fetchRentalMachines());
  }, [dispatch, offset, limit]);

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
      dispatch(fetchRentalMachines());
    } catch (err) {
      toast.error(String(err || 'Kiralama kaydı silinemedi'));
    }
  };

  return (
    <div className="space-y-3 px-1">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="relative w-full max-w-sm">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={filters.search}
            onChange={(event) =>
              dispatch(setFilter({ key: 'search', value: event.target.value }))
            }
            placeholder="Tip, marka, plaka, firma veya şantiye ara..."
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => dispatch(resetFilters())}
              className="text-xs font-medium text-red-600 hover:underline"
            >
              Filtreleri temizle ({activeFilterCount})
            </button>
          )}

          {/* Yalnızca kiralık sekmesinde görünür: panel o sekmede mount edilir. */}
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            <PlusIcon className="h-4 w-4" />
            Yeni Kiralık Makine
          </button>
        </div>
      </div>

      <RentalMachineTypeChips
        stats={typeStats}
        activeTypeId={filters.machine_type_id}
        onSelectType={(typeId) =>
          dispatch(setFilter({ key: 'machine_type_id', value: typeId ?? '' }))
        }
      />

      {error && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {String(error)}
        </div>
      )}

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

      <RentalMachineFormModal
        key={modalState.seq}
        open={modalState.open}
        item={modalState.item}
        onClose={closeModal}
        onSaved={() => dispatch(fetchRentalMachines())}
      />
    </div>
  );
}
