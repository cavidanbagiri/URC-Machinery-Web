// src/components/stock/StockItemSearchSelect.jsx
import { useEffect, useRef, useState } from 'react';
import {
  ArrowPathIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

import StockService from '../../services/StockService';
import { formatQuantity } from '../../utils/stock';
import { errorInputClass, inputClass } from '../repair/RepairModal';

/**
 * Uzak aramayla stok kartı seçici. Sahaya çıkış modalında kullanılır;
 * kart listesi sayfalanmış olsa bile aranan malzeme bulunabilir.
 */
export default function StockItemSearchSelect({
  value,
  onChange,
  hasError = false,
  placeholder = 'Malzeme ara...',
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

    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await StockService.fetchItems({
          search,
          limit: 20,
          offset: 0,
        });
        if (requestCounter.current !== current) return;
        setOptions(data.items || []);
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
        <span className="truncate text-gray-900">
          {value.name}
          <span className="ml-2 text-xs text-gray-500">
            {formatQuantity(value.quantity)} {value.unit}
          </span>
        </span>
        <button
          type="button"
          onClick={() => {
            onChange(null);
            setSearch('');
            setOptions([]);
          }}
          className="shrink-0 rounded p-0.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          title="Malzeme seçimini kaldır"
          aria-label="Malzeme seçimini kaldır"
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
          {options.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                // mousedown keeps the input from blurring before the click lands
                onMouseDown={(event) => {
                  event.preventDefault();
                  onChange(item);
                  setOpen(false);
                  setSearch('');
                }}
                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition hover:bg-blue-50"
              >
                <span className="truncate font-medium text-gray-900">
                  {item.name}
                </span>
                <span className="shrink-0 text-[11px] text-gray-500">
                  {formatQuantity(item.quantity)} {item.unit}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && !loading && options.length === 0 && search.trim() !== '' && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-500 shadow-lg">
          Malzeme bulunamadı
        </div>
      )}
    </div>
  );
}
