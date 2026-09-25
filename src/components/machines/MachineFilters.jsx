// src/components/machines/MachineFilters.jsx
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Disclosure } from '@headlessui/react';
import {
  FunnelIcon,
  ChevronDownIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

import { setFilter, resetFilters } from '../../stores/machine_slice';

export default function MachineFilters() {
  const dispatch = useDispatch();
  const filters = useSelector((s) => s.machine.filters);
  const lookups = useSelector((s) => s.lookup.data);

  // Aktiv filterlərin sayı (badge üçün)
  const activeCount = Object.values(filters).filter(
    (v) => v !== '' && v !== null && v !== undefined
  ).length;

  const handleChange = (key, value) => {
    dispatch(setFilter({ key, value }));
  };

  const handleReset = () => {
    dispatch(resetFilters());
  };

  return (
    <Disclosure>
      {({ open }) => (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          {/* Header */}
          <Disclosure.Button className="flex w-full items-center justify-between px-6 py-4 text-left">
            <div className="flex items-center gap-2">
              <FunnelIcon className="h-5 w-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-900">
                Filterlər
              </span>
              {activeCount > 0 && (
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                  {activeCount}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {activeCount > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReset();
                  }}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                >
                  <XMarkIcon className="h-3 w-3" />
                  Təmizlə
                </button>
              )}
              <ChevronDownIcon
                className={`h-5 w-5 text-gray-500 transition-transform ${
                  open ? 'rotate-180' : ''
                }`}
              />
            </div>
          </Disclosure.Button>

          {/* Body */}
          <Disclosure.Panel className="border-t border-gray-200 px-6 py-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">


              <FilterSelect
                label="Status"
                value={filters.status_id}
                onChange={(v) => handleChange('status_id', v)}
                options={lookups.car_status || []}
              />


              {/* Identification No */}
              <FilterInput
                label="Identification No"
                value={filters.identification_no}
                onChange={(v) => handleChange('identification_no', v)}
                placeholder="TRK-001..."
              />

              {/* VIN No */}
              <FilterInput
                label="VIN No"
                value={filters.vin_no}
                onChange={(v) => handleChange('vin_no', v)}
                placeholder="WDB963..."
              />

              
              {/* Territory */}
              <FilterSelect
                label="Territory"
                value={filters.territory_id}
                onChange={(v) => handleChange('territory_id', v)}
                options={lookups.territory || []}
              />

              {/* Type Transport */}
              <FilterSelect
                label="Type Transport"
                value={filters.type_id}
                onChange={(v) => handleChange('type_id', v)}
                options={lookups.type_transport || []}
              />

              {/* SubType Transport */}
              <FilterSelect
                label="SubType Transport"
                value={filters.subtype_id}
                onChange={(v) => handleChange('subtype_id', v)}
                options={lookups.sub_type_transport || []}
              />

              {/* Car Mark */}
              <FilterSelect
                label="Mark"
                value={filters.car_mark_id}
                onChange={(v) => handleChange('car_mark_id', v)}
                options={lookups.car_mark || []}
              />

              {/* Car Model */}
              <FilterSelect
                label="Model"
                value={filters.car_model_id}
                onChange={(v) => handleChange('car_model_id', v)}
                options={lookups.car_model || []}
              />

              {/* Company */}
              <FilterSelect
                label="Company"
                value={filters.company_id}
                onChange={(v) => handleChange('company_id', v)}
                options={lookups.company || []}
              />

              {/* Production Year */}
              <FilterInput
                label="Production Year"
                type="number"
                value={filters.production_year}
                onChange={(v) => handleChange('production_year', v)}
                placeholder="2020"
              />
            </div>
          </Disclosure.Panel>
        </div>
      )}
    </Disclosure>
  );
}

// =========================================================
// KÖMƏKÇI KOMPONENTLƏR
// =========================================================

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

function FilterSelect({ label, value, onChange, options }) {
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
        <option value="">Hamısı</option>
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.name}
          </option>
        ))}
      </select>
    </div>
  );
}