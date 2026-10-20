// src/components/repair/RepairFilters.jsx
import { useDispatch, useSelector } from 'react-redux';
import { Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

import {
  REPAIR_STATUS_OPTIONS,
  resetFilters,
  setFilter,
  setFilters,
} from '../../stores/repair_slice';

export default function RepairFilters({ open, onClose, onFilterChange }) {
  const dispatch = useDispatch();
  const filters = useSelector((s) => s.repair.filters);
  const lookups = useSelector((s) => s.lookup.data);

  const activeCount = Object.values(filters).filter((value) => {
    if (typeof value === 'boolean') return value;
    return value !== '' && value !== null && value !== undefined;
  }).length;

  const handleChange = (key, value) => {
    onFilterChange?.();
    if (key === 'status' && value !== 'tamirde') {
      dispatch(setFilters({ status: value, overdue: false, due_soon: false }));
      return;
    }
    if ((key === 'overdue' || key === 'due_soon') && value === true) {
      dispatch(setFilters({ [key]: true, status: 'tamirde' }));
      return;
    }
    dispatch(setFilter({ key, value }));
  };

  const handleReset = () => {
    onFilterChange?.();
    dispatch(resetFilters());
  };

  return (
    <Transition
      show={open}
      enter="transition ease-out duration-200"
      enterFrom="opacity-0 -translate-y-2"
      enterTo="opacity-100 translate-y-0"
      leave="transition ease-in duration-150"
      leaveFrom="opacity-100 translate-y-0"
      leaveTo="opacity-0 -translate-y-2"
    >
      <div className="mt-1 rounded-xl border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Filtreler</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Filtreleri kapat"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <FilterInput
            label="Ara"
            value={filters.search}
            onChange={(value) => handleChange('search', value)}
            placeholder="Makine, arıza yeri veya not"
          />

          <FilterSelect
            label="Tamir Durumu"
            value={filters.status}
            onChange={(value) => handleChange('status', value)}
          >
            <option value="">Tümü</option>
            {REPAIR_STATUS_OPTIONS.map((option) => (
              <option key={option.code} value={option.code}>
                {option.name}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect
            label="Tamir Tipi"
            value={filters.repair_type_id}
            onChange={(value) => handleChange('repair_type_id', value)}
            options={lookups.repair_type || []}
          />

          <FilterSelect
            label="Bölge"
            value={filters.territory_id}
            onChange={(value) => handleChange('territory_id', value)}
            options={lookups.territory || []}
          />

          <FilterSelect
            label="Taşıma Tipi"
            value={filters.type_id}
            onChange={(value) => handleChange('type_id', value)}
            options={lookups.type_transport || []}
          />

          <FilterSelect
            label="Şirket"
            value={filters.company_id}
            onChange={(value) => handleChange('company_id', value)}
            options={lookups.company || []}
          />

          <FilterInput
            label="Giriş Tarihi (Başlangıç)"
            type="date"
            value={filters.date_from}
            onChange={(value) => handleChange('date_from', value)}
          />

          <FilterInput
            label="Giriş Tarihi (Bitiş)"
            type="date"
            value={filters.date_to}
            onChange={(value) => handleChange('date_to', value)}
          />

          <div className="flex flex-col justify-end gap-2 pb-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={filters.overdue === true}
                onChange={(e) => handleChange('overdue', e.target.checked)}
                className="h-4 w-4 rounded accent-blue-600"
              />
              Sadece gecikmiş
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={filters.due_soon === true}
                onChange={(e) => handleChange('due_soon', e.target.checked)}
                className="h-4 w-4 rounded accent-blue-600"
              />
              Sadece yaklaşan (3 gün)
            </label>
          </div>
        </div>

        {activeCount > 0 && (
          <div className="mt-4 flex justify-end border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
            >
              <XMarkIcon className="h-3 w-3" />
              Filtreleri temizle ({activeCount})
            </button>
          </div>
        )}
      </div>
    </Transition>
  );
}

function FilterInput({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-600">
        {label}
      </label>
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </div>
  );
}

function FilterSelect({ label, value, onChange, options, children }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-600">
        {label}
      </label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      >
        {children || (
          <>
            <option value="">Tümü</option>
            {(options || []).map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.name}
              </option>
            ))}
          </>
        )}
      </select>
    </div>
  );
}
