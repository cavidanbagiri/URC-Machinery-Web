// src/components/ui/ColumnVisibilityMenu.jsx
// Tablo üstündeki sütun görünürlüğü kontrolü: "Sütunlar" açılır menüsü
// (her sütun için checkbox) + tek tıkla "Tümünü aç / Tümünü kapat" düğmesi.
// Görünürlük state'i `useColumnVisibility` hook'unda tutulur; bu bileşen
// yalnızca görünüm ve olay yönlendirmesi yapar.
import { useEffect, useRef, useState } from 'react';
import {
  CheckIcon,
  ChevronDownIcon,
  EyeIcon,
  EyeSlashIcon,
  ViewColumnsIcon,
} from '@heroicons/react/24/outline';

export default function ColumnVisibilityMenu({
  columns = [],
  isVisible,
  toggle,
  showAll,
  hideAll,
  visibleCount,
  totalCount,
  allVisible,
  allHidden,
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (menuRef.current?.contains(event.target)) return;
      if (triggerRef.current?.contains(event.target)) return;
      setOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      triggerRef.current?.focus();
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-haspopup="dialog"
          title="Görünür sütunları seç"
          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
            open
              ? 'border-blue-300 bg-blue-50 text-blue-700'
              : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          <ViewColumnsIcon
            className={`h-4 w-4 ${open ? 'text-blue-600' : 'text-gray-400'}`}
          />
          Sütunlar
          <span
            className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
              allVisible ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-700'
            }`}
          >
            {visibleCount}/{totalCount}
          </span>
          <ChevronDownIcon
            className={`h-3.5 w-3.5 text-gray-400 transition ${
              open ? 'rotate-180' : ''
            }`}
          />
        </button>

        {open && (
          <div
            ref={menuRef}
            role="dialog"
            aria-label="Sütun görünürlüğü"
            className="absolute right-0 z-30 mt-1 w-56 rounded-xl border border-gray-200 bg-white p-2 shadow-xl"
          >
            <p className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
              Görünür sütunlar
            </p>

            <div className="max-h-64 space-y-0.5 overflow-y-auto">
              {columns.map((column) => {
                const visible = isVisible(column.id);

                return (
                  <button
                    key={column.id}
                    type="button"
                    role="checkbox"
                    aria-checked={visible}
                    onClick={() => toggle(column.id)}
                    className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition ${
                      visible
                        ? 'font-medium text-gray-800'
                        : 'text-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
                        visible
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-gray-300 bg-white text-transparent'
                      }`}
                    >
                      <CheckIcon className="h-3 w-3" />
                    </span>
                    <span className="truncate" title={column.label}>
                      {column.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-1 flex items-center justify-between gap-2 border-t border-gray-100 px-1 pt-1.5">
              <button
                type="button"
                onClick={showAll}
                disabled={allVisible}
                className="text-[11px] font-medium text-blue-600 transition hover:underline disabled:cursor-not-allowed disabled:text-gray-300 disabled:no-underline"
              >
                Tümünü aç
              </button>
              <button
                type="button"
                onClick={hideAll}
                disabled={allHidden}
                className="text-[11px] font-medium text-red-600 transition hover:underline disabled:cursor-not-allowed disabled:text-gray-300 disabled:no-underline"
              >
                Tümünü kapat
              </button>
            </div>

            <p className="mt-1 border-t border-gray-100 px-1 pt-1.5 text-[10px] text-gray-400">
              Gizlenen sütunlar sadece bu görünümü etkiler.
            </p>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={allHidden ? showAll : hideAll}
        title={allHidden ? 'Tüm sütunları aç' : 'Tüm sütunları kapat'}
        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
      >
        {allHidden ? (
          <EyeIcon className="h-4 w-4 text-gray-400" />
        ) : (
          <EyeSlashIcon className="h-4 w-4 text-gray-400" />
        )}
        {allHidden ? 'Tümünü aç' : 'Tümünü kapat'}
      </button>
    </div>
  );
}
