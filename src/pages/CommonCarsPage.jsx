// src/pages/CommonCarsPage.jsx
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast, { Toaster } from 'react-hot-toast';

import { fetchMachines } from '../stores/machine_slice';
import { fetchLookupIfNeeded } from '../stores/lookup_slice';

import MachineFilters from '../components/machines/MachineFilters';
import MachineTable from '../components/machines/MachineTable';
import MachinePagination from '../components/machines/MachinePagination';
import MachineFormModal from '../components/machines/MachineFormModal';
import MachineDetailModal from '../components/machines/MachineDetailModal';
import MachineStatusModal, { MOCK_STATUSES } from '../components/machines/MachineStatusModal';
import ExportButton from '../components/machines/ExportButton';
import ConfirmDialog from '../components/settings/ConfirmDialog'
import { updateMachineStatus } from '../stores/machine_slice';
import { deleteMachine } from '../stores/machine_slice';





const LOOKUPS_NEEDED = [
  'territory',
  'type_transport',
  'sub_type_transport',
  'car_mark',
  'car_model',
  'company',
  'car_status'
];

export default function CommonCarsPage() {
  const dispatch = useDispatch();
  const { filters, total, offset, limit } = useSelector((s) => s.machine);
  const lookups = useSelector((s) => s.lookup.data);

  const [filtersOpen, setFiltersOpen] = useState(false);

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
    } catch (err) {
      const message =
        typeof err === 'string'
          ? err
          : err?.message || err?.detail || 'Silinmə xətası';
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

  try {
    await dispatch(
      updateMachineStatus({ id: machineId, status_id: statusId })
    ).unwrap();

    const status = lookups.car_status?.find((s) => s.id === statusId);
    toast.success(`Status "${status?.name || statusId}" olaraq dəyişdirildi`);
  } catch (err) {
    const message =
      typeof err === 'string'
        ? err
        : err?.message || err?.detail || 'Status dəyişdirilə bilmədi';
    toast.error(message);
  } finally {
    // HƏMİŞƏ bağla
    setStatusOpen(false);
    setStatusMachine(null);
  }
};




  return (
    <div className="space-y-6 p-6">
      <Toaster position="top-right" />

      {/* Header */}
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bütün Maşınlar</h1>
        <p className="mt-1 text-sm text-gray-500">Cəmi: {total} maşın</p>
      </div>

      <div className="flex items-center gap-2">
        <ExportButton />
        <button
          onClick={handleCreate}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Yeni maşın
        </button>
      </div>
    </div>

      {/* Filterlər */}
      <MachineFilters />

      {/* Delete Confirm — YENİ */}
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setDeletingMachine(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Maşını silmək istəyirsiniz?"
        message={
          deletingMachine
            ? `"${deletingMachine.identification_no || `#${deletingMachine.id}`}" silinəcək. Bu əməliyyat geri qaytarıla bilməz.`
            : ''
        }
        loading={deleting}
      />

      {/* Cədvəl */}
      <MachineTable
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        onDetail={handleDetail}
        onChangeStatus={handleChangeStatus}
        onOpenFilters={() => setFiltersOpen(true)}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Pagination */}
      <MachinePagination />

      {/* Form Modal */}
      <MachineFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingMachine(null);
        }}
        editingMachine={editingMachine}
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
        open={statusOpen}
        onClose={() => {
          setStatusOpen(false);
          setStatusMachine(null);
        }}
        machine={statusMachine}
        onSubmit={handleStatusSubmit}
      />
    </div>
  );
}