// src/components/machines/MachineFilters.jsx
// import { useState } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { Disclosure } from '@headlessui/react';
// import {
//   FunnelIcon,
//   ChevronDownIcon,
//   XMarkIcon,
// } from '@heroicons/react/24/outline';
// import { setFilter, resetFilters } from '../../stores/machine_slice';

import { useDispatch, useSelector } from 'react-redux';
import { Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

import { setFilter, resetFilters } from '../../stores/machine_slice';


export default function MachineFilters({ open, onClose }) {
  // const dispatch = useDispatch();
  // const filters = useSelector((s) => s.machine.filters);
  // const lookups = useSelector((s) => s.lookup.data);

  // // Aktiv filterlərin sayı (badge üçün)
  // const activeCount = Object.values(filters).filter(
  //   (v) => v !== '' && v !== null && v !== undefined
  // ).length;

  // const handleChange = (key, value) => {
  //   dispatch(setFilter({ key, value }));
  // };

  // const handleReset = () => {
  //   dispatch(resetFilters());
  // };

  const dispatch = useDispatch();
  const filters = useSelector((s) => s.machine.filters);
  const lookups = useSelector((s) => s.lookup.data);

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
    <Transition
      show={open}
      enter="transition ease-out duration-200"
      enterFrom="opacity-0 -translate-y-2"
      enterTo="opacity-100 translate-y-0"
      leave="transition ease-in duration-150"
      leaveFrom="opacity-100 translate-y-0"
      leaveTo="opacity-0 -translate-y-2"
    >
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Filterlər</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Filters grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <FilterSelect
            label="Status"
            value={filters.status_id}
            onChange={(v) => handleChange('status_id', v)}
            options={lookups.car_status || []}
          />

          <FilterInput
            label="Identification No"
            value={filters.identification_no}
            onChange={(v) => handleChange('identification_no', v)}
            placeholder="TRK-001..."
          />

          <FilterInput
            label="Plate No"
            value={filters.plate_no}
            onChange={(v) => handleChange('plate_no', v)}
            placeholder="90 AB 123"
          />

          <FilterInput
            label="VIN No"
            value={filters.vin_no}
            onChange={(v) => handleChange('vin_no', v)}
            placeholder="WDB963..."
          />

          <FilterSelect
            label="Territory"
            value={filters.territory_id}
            onChange={(v) => handleChange('territory_id', v)}
            options={lookups.territory || []}
          />

          <FilterSelect
            label="Type Transport"
            value={filters.type_id}
            onChange={(v) => handleChange('type_id', v)}
            options={lookups.type_transport || []}
          />

          <FilterSelect
            label="SubType Transport"
            value={filters.subtype_id}
            onChange={(v) => handleChange('subtype_id', v)}
            options={lookups.sub_type_transport || []}
          />

          <FilterSelect
            label="Mark"
            value={filters.car_mark_id}
            onChange={(v) => handleChange('car_mark_id', v)}
            options={lookups.car_mark || []}
          />

          <FilterSelect
            label="Model"
            value={filters.car_model_id}
            onChange={(v) => handleChange('car_model_id', v)}
            options={lookups.car_model || []}
          />

          <FilterSelect
            label="Company"
            value={filters.company_id}
            onChange={(v) => handleChange('company_id', v)}
            options={lookups.company || []}
          />

          <FilterInput
            label="Production Year"
            type="number"
            value={filters.production_year}
            onChange={(v) => handleChange('production_year', v)}
            placeholder="2020"
          />
        </div>

        {/* Footer */}
        {activeCount > 0 && (
          <div className="mt-4 flex justify-end border-t border-gray-100 pt-4">
            <button
              onClick={handleReset}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
            >
              <XMarkIcon className="h-3 w-3" />
              Filterləri təmizlə ({activeCount})
            </button>
          </div>
        )}
      </div>
    </Transition>
  );
}

// =========================================================
// KÖMƏKÇI KOMPONENTLƏR
// =========================================================

// function FilterInput({ label, value, onChange, placeholder, type = 'text' }) {
//   return (
//     <div>
//       <label className="mb-1 block text-xs font-medium text-gray-600">
//         {label}
//       </label>
//       <input
//         type={type}
//         value={value || ''}
//         onChange={(e) => onChange(e.target.value)}
//         placeholder={placeholder}
//         className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
//       />
//     </div>
//   );
// }

// function FilterSelect({ label, value, onChange, options }) {
//   return (
//     <div>
//       <label className="mb-1 block text-xs font-medium text-gray-600">
//         {label}
//       </label>
//       <select
//         value={value || ''}
//         onChange={(e) => onChange(e.target.value)}
//         className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
//       >
//         <option value="">Hamısı</option>
//         {options.map((opt) => (
//           <option key={opt.id} value={opt.id}>
//             {opt.name}
//           </option>
//         ))}
//       </select>
//     </div>
//   );
// }

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