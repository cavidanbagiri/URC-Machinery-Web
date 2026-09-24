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
// import MachineStatusModal from '../components/machines/MachineStatusModal';
import MachineStatusModal, { MOCK_STATUSES } from '../components/machines/MachineStatusModal';



const LOOKUPS_NEEDED = [
  'territory',
  'type_transport',
  'sub_type_transport',
  'car_mark',
  'car_model',
  'company',
];

export default function CommonCarsPage() {
  const dispatch = useDispatch();
  const { filters, total, offset, limit } = useSelector((s) => s.machine);

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

  const handleDelete = (machine) => {
    toast.success(`Delete: ${machine.identification_no}`);
  };

  const handleDetail = (machine) => {
    setDetailMachine(machine);
    setDetailOpen(true);
  };

  const handleChangeStatus = (machine) => {
    setStatusMachine(machine);
    setStatusOpen(true);
  };

  const handleStatusSubmit = (statusId) => {
    // Mock — yalnız toast, backend hazır olanda API çağırışı əlavə olunacaq
    const status = MOCK_STATUSES.find((s) => s.id === statusId);
    toast.success(`Status "${status.name}" olaraq dəyişdirildi (mock)`);
    setStatusOpen(false);
    setStatusMachine(null);

    // Gələcəkdə:
    // await dispatch(updateMachineStatus({ id: statusMachine.id, status_id: statusId })).unwrap();
  };

  return (
    <div className="space-y-6 p-6">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bütün Maşınlar</h1>
          <p className="mt-1 text-sm text-gray-500">Cəmi: {total} maşın</p>
        </div>

        <button
          onClick={handleCreate}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Yeni maşın
        </button>
      </div>

      {/* Filterlər */}
      <MachineFilters />

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
        currentStatusId={1}   // mock default (backend hazır olanda statusMachine.status_id)
        onSubmit={handleStatusSubmit}
      />
    </div>
  );
}