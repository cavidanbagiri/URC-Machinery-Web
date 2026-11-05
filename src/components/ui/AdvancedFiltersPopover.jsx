// src/components/ui/AdvancedFiltersPopover.jsx
// Small dropdown that keeps the filters which have no table column (Bölge,
// Taşıma Tipi, Şirket …) reachable now that the big filter panel is gone.
import { useEffect, useRef, useState } from 'react';
import { FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function AdvancedFiltersPopover({
  label = 'Gelişmiş',
  activeCount = 0,
  onReset,
  children,
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (!wrapperRef.current?.contains(event.target)) setOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition ${
          open || activeCount > 0
            ? 'border-blue-200 bg-blue-50 text-blue-700'
            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
        }`}
      >
        <FunnelIcon className="h-4 w-4" />
        {label}
        {activeCount > 0 && (
          <span className="rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={`${label} filtreler`}
          className="absolute left-0 top-full z-30 mt-1 w-72 rounded-xl border border-gray-200 bg-white p-4 shadow-lg"
        >
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              {label} filtreler
            </h3>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Kapat"
              className="rounded p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-col gap-3">{children}</div>

          {onReset && activeCount > 0 && (
            <div className="mt-3 border-t border-gray-100 pt-3">
              <button
                type="button"
                onClick={onReset}
                className="text-xs font-medium text-red-600 hover:underline"
              >
                Bu filtreleri temizle ({activeCount})
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function AdvancedFilterField({ label, value, onChange, options, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-600">
        {label}
      </span>
      <select
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      >
        {children || (
          <>
            <option value="">Tümü</option>
            {(options || []).map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </>
        )}
      </select>
    </label>
  );
}
