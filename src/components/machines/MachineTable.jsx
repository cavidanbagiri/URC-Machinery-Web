// src/components/machines/MachineTable.jsx
import { useSelector } from 'react-redux';
import MachineSkeleton from './MachineSkeleton';
import MachineRowMenu from './MachineRowMenu';
import StatusBadge from './StatusBadge';




export default function MachineTable({
  onUpdate,
  onDelete,
  onDetail,
  onChangeStatus,
  onOpenFilters,
  hasActiveFilters,
}) {
  const { items, loading, total } = useSelector((s) => s.machine);
  const lookups = useSelector((s) => s.lookup.data);

  // Lookup ID → ad
  const lookupName = (key, id) => {
    if (!id) return '—';
    const found = lookups[key]?.find((x) => x.id === id);
    return found?.name || `#${id}`;
  };

  // İl çıxar (DateTime → year)
  const extractYear = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).getFullYear();
    } catch {
      return '—';
    }
  };

  // Skeleton göstər
  if (loading && items.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <MachineSkeleton rows={5} />
      </div>
    );
  }

  // Status tap
  const getStatus = (statusId) => {
    return lookups.car_status?.find((s) => s.id === statusId);
  };

  // Boş nəticə
  if (!loading && items.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
        <p className="text-sm font-medium text-gray-900">
          Heç bir nəticə tapılmadı
        </p>
        <p className="mt-1 text-sm text-gray-500">
          {hasActiveFilters
            ? 'Filterləri dəyişdirin və ya təmizləyin'
            : 'Hələ heç bir maşın əlavə olunmayıb'}
        </p>
        {hasActiveFilters && (
          <button
            onClick={onOpenFilters}
            className="mt-3 text-sm font-medium text-blue-600 hover:underline"
          >
            Filterləri aç
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Siyahı</h2>
          <p className="text-xs text-gray-500">Cəmi: {total} maşın</p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-6 py-2 text-right font-medium">Extra</th>
              <th className="px-6 py-2 text-left font-medium">Status</th>
              <th className="px-6 py-2 text-left font-medium">Id No</th>
              <th className="px-6 py-2 text-left font-medium">Plate No</th>       {/* ← YENİ */}
              <th className="px-6 py-2 text-left font-medium">Company</th>
              <th className="px-6 py-2 text-left font-medium">Territory</th>
              <th className="px-6 py-2 text-left font-medium">Mark</th>
              <th className="px-6 py-2 text-left font-medium">Model</th>
              <th className="px-6 py-2 text-left font-medium">VIN No</th>
              <th className="px-6 py-2 text-left font-medium">Year</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((machine) => (
              <tr key={machine.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-6 py-2 text-right">
                  <MachineRowMenu
                    machine={machine}
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                    onDetail={onDetail}
                    onChangeStatus={onChangeStatus}
                  />
                </td>
                {/* YENİ — Status */}
                <td className="whitespace-nowrap px-6 py-2">
                  <StatusBadge status={getStatus(machine.status_id)} />
                </td>
                <td className="whitespace-nowrap px-6 py-2 text-sm font-medium text-gray-900">
                  {machine.identification_no || '—'}
                </td>
                <td className="whitespace-nowrap px-6 py-2 text-sm font-mono text-gray-700">
                  {machine.plate_no || '—'}                                       {/* ← YENİ */}
                </td>
                <td className="whitespace-nowrap px-6 py-2 text-sm text-gray-700">
                  {lookupName('company', machine.company_id)}
                </td>
                <td className="whitespace-nowrap px-6 py-2 text-sm text-gray-700">
                  {lookupName('territory', machine.territory_id)}
                </td>
                <td className="whitespace-nowrap px-6 py-2 text-sm text-gray-700">
                  {lookupName('car_mark', machine.car_mark_id)}
                </td>
                <td className="whitespace-nowrap px-6 py-2 text-sm text-gray-700">
                  {lookupName('car_model', machine.car_model_id)}
                </td>
                <td className="whitespace-nowrap px-6 py-2 text-sm text-gray-700">
                  {machine.vin_no || '—'}
                </td>
                <td className="whitespace-nowrap px-6 py-2 text-sm text-gray-700">
                  {extractYear(machine.production_year)}
                </td>
                
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}