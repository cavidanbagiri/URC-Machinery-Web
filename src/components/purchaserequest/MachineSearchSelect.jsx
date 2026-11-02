// src/components/purchaserequest/MachineSearchSelect.jsx
import { useEffect, useRef, useState } from 'react';
import {
  ArrowPathIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

import PurchaseRequestService from '../../services/PurchaseRequestService';
import { machineLabel } from '../../utils/repair';
import { errorInputClass, inputClass } from '../repair/RepairModal';

/**
 * Debounced machine picker used by the spare-part rows and the service form.
 * It keeps its own option list so several pickers can live on one page.
 */
export default function MachineSearchSelect({
  value,
  onChange,
  hasError = false,
  placeholder = 'Makine kimlik no / plaka / şasi ara...',
  id,
}) {
  const [search, setSearch] = useState('');
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const requestCounter = useRef(0);

  useEffect(() => {
    if (!open || value) return undefined;

    const current = requestCounter.current + 1;
    requestCounter.current = current;
    setLoading(true);

    const timeout = setTimeout(async () => {
      try {
        const items = await PurchaseRequestService.fetchMachines({
          search,
          limit: 20,
        });
        if (requestCounter.current !== current) return;
        setOptions(items);
      } catch {
        if (requestCounter.current === current) setOptions([]);
      } finally {
        if (requestCounter.current === current) setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [search, open, value]);

  if (value) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">
        <span className="truncate text-gray-900">{machineLabel(value)}</span>
        <button
          type="button"
          onClick={() => {
            onChange(null);
            setSearch('');
            setOptions([]);
          }}
          className="shrink-0 rounded p-0.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          title="Makine seçimini kaldır"
          aria-label="Makine seçimini kaldır"
        >
          <XMarkIcon className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input
        id={id}
        type="text"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        placeholder={placeholder}
        autoComplete="off"
        className={`${hasError ? errorInputClass : inputClass} pl-9 pr-8`}
      />
      {loading && (
        <ArrowPathIcon className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-blue-500" />
      )}

      {open && !loading && options.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          {options.map((machine) => (
            <li key={machine.id}>
              <button
                type="button"
                // mousedown keeps the input from blurring before the click lands
                onMouseDown={(event) => {
                  event.preventDefault();
                  onChange(machine);
                  setOpen(false);
                  setSearch('');
                }}
                className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm transition hover:bg-blue-50"
              >
                <span className="font-medium text-gray-900">
                  {machineLabel(machine)}
                </span>
                <span className="text-[11px] text-gray-500">
                  {[machine.plate_no, machine.vin_no].filter(Boolean).join(' · ') ||
                    '—'}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && !loading && options.length === 0 && search.trim() !== '' && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-500 shadow-lg">
          Makine bulunamadı
        </div>
      )}
    </div>
  );
}
