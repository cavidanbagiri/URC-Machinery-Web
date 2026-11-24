// src/components/maintenance/MaintenanceArchiveFilters.jsx
// "Arşiv" sekmesinin filtre çubuğu. Makine listesinin sütun filtrelerinden
// bağımsızdır: kayıtları tarih aralığı, birim ve serbest metinle süzer.
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useDispatch, useSelector } from 'react-redux';

import {
  resetRecordFilters,
  setRecordFilter,
} from '../../stores/maintenance_slice';

const USAGE_UNIT_OPTIONS = [
  { value: '', label: 'Tüm birimler' },
  { value: 'km', label: 'km' },
  { value: 'hour', label: 'saat' },
];

const INPUT_CLASS =
  'rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100';

export default function MaintenanceArchiveFilters() {
  const dispatch = useDispatch();
  const { records } = useSelector((s) => s.maintenance);
  const { filters, total, loading } = records;

  const activeCount = Object.values(filters).filter(
    (value) => value !== '' && value !== null && value !== undefined
  ).length;

  const handleChange = (key, value) => {
    dispatch(setRecordFilter({ key, value }));
  };

  const handleReset = () => {
    dispatch(resetRecordFilters());
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={filters.search}
            onChange={(event) => handleChange('search', event.target.value)}
            placeholder="Makine, plaka, VIN veya not ara..."
            aria-label="Bakım arşivinde ara"
            className="w-72 rounded-lg border border-gray-200 bg-white py-2 pl-8 pr-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <label className="flex items-center gap-1.5 text-xs text-gray-500">
          Başlangıç
          <input
            type="date"
            value={filters.date_from}
            max={filters.date_to || undefined}
            onChange={(event) => handleChange('date_from', event.target.value)}
            className={INPUT_CLASS}
          />
        </label>

        <label className="flex items-center gap-1.5 text-xs text-gray-500">
          Bitiş
          <input
            type="date"
            value={filters.date_to}
            min={filters.date_from || undefined}
            onChange={(event) => handleChange('date_to', event.target.value)}
            className={INPUT_CLASS}
          />
        </label>

        <select
          value={filters.usage_unit}
          onChange={(event) => handleChange('usage_unit', event.target.value)}
          aria-label="Kullanım birimi"
          className={INPUT_CLASS}
        >
          {USAGE_UNIT_OPTIONS.map((option) => (
            <option key={option.value || 'all'} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {activeCount > 0 && (
          <button
            type="button"
            onClick={handleReset}
            className="text-xs font-medium text-red-600 hover:underline"
          >
            Arşiv filtrelerini temizle ({activeCount})
          </button>
        )}
      </div>

      <p className="text-[11px] text-gray-400">
        {loading ? 'Yükleniyor...' : `${total} bakım kaydı`}
      </p>
    </div>
  );
}
