// src/components/ui/ColumnFilter.jsx
// Excel-style column filter: the column *header* is the trigger. Clicking a
// header opens a small panel that lists the values of that column; choosing a
// value dispatches the same redux `setFilter` the old filter row used, so the
// page keeps its debounced fetch.
//
// The panel is rendered in a portal with fixed coordinates: the tables live
// inside an `overflow-x-auto` container, which would otherwise clip a normal
// absolutely positioned dropdown.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  CheckIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

//: Panel width in px — also used to keep the panel inside the viewport.
const MENU_WIDTH = 248;

/** True when the filter holds a real value (empty strings mean "no filter"). */
function isFilterFilled(value) {
  return value !== '' && value !== null && value !== undefined;
}

/** Accepts `[{id,name}]`, `[{value,label}]` or plain scalars. */
function normalizeOptions(options) {
  return (options || [])
    .map((option) => {
      if (option === null || option === undefined) return null;
      if (typeof option === 'object') {
        const value = option.id ?? option.value;
        const label = option.name ?? option.label;
        if (value === undefined || label === undefined) return null;
        return { value: String(value), label: String(label) };
      }
      return { value: String(option), label: String(option) };
    })
    .filter(Boolean);
}

function OptionRow({ label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left text-xs normal-case tracking-normal transition ${
        selected
          ? 'bg-blue-50 font-medium text-blue-700'
          : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      <CheckIcon
        className={`h-3.5 w-3.5 shrink-0 ${
          selected ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <span className="truncate" title={label}>
        {label}
      </span>
    </button>
  );
}

/** Value list of a column: "Tümü" + one row per option, with a search box. */
export function ColumnFilterOptions({
  options = [],
  value,
  onChange,
  allLabel = 'Tümü',
  searchPlaceholder = 'Değer ara...',
}) {
  const [query, setQuery] = useState('');
  const normalized = useMemo(() => normalizeOptions(options), [options]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('tr');
    if (!needle) return normalized;
    return normalized.filter((option) =>
      option.label.toLocaleLowerCase('tr').includes(needle)
    );
  }, [normalized, query]);

  return (
    <div className="flex flex-col gap-1.5">
      {normalized.length > 7 && (
        <div className="relative">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="w-full rounded-md border border-gray-300 bg-white py-1 pl-7 pr-2 text-xs outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
          />
        </div>
      )}

      <div className="max-h-60 overflow-y-auto">
        <OptionRow
          label={allLabel}
          selected={!isFilterFilled(value)}
          onClick={() => onChange('')}
        />

        {filtered.map((option) => (
          <OptionRow
            key={option.value}
            label={option.label}
            selected={String(value) === option.value}
            onClick={() => onChange(option.value)}
          />
        ))}

        {filtered.length === 0 && (
          <p className="px-2 py-3 text-center text-[11px] text-gray-400">
            Eşleşen değer yok
          </p>
        )}
      </div>
    </div>
  );
}

/** Free text column filter ("contains") with a clear action. */
export function ColumnFilterText({
  value,
  placeholder = 'İçerir...',
  hint,
  onChange,
}) {
  return (
    <div className="flex flex-col gap-1.5 px-1 pb-1">
      <input
        type="text"
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-xs outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
      />

      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] leading-tight text-gray-400">
          {hint || 'İçeren kayıtlar'}
        </span>
        <button
          type="button"
          onClick={() => onChange('')}
          disabled={!isFilterFilled(value)}
          className="text-[11px] font-medium text-red-600 transition hover:underline disabled:cursor-not-allowed disabled:text-gray-300 disabled:no-underline"
        >
          Temizle
        </button>
      </div>
    </div>
  );
}

export default function ColumnFilter({
  label,
  active = false,
  align = 'left',
  children,
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const placeMenu = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const maxLeft = Math.max(8, window.innerWidth - MENU_WIDTH - 12);
    const preferred = align === 'right' ? rect.right - MENU_WIDTH : rect.left;
    setPosition({
      top: rect.bottom + 4,
      left: Math.min(Math.max(8, preferred), maxLeft),
    });
  }, [align]);

  useEffect(() => {
    if (!open) return undefined;
    placeMenu();

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
    // The table scrolls horizontally, so keep the panel glued to its header.
    window.addEventListener('scroll', placeMenu, true);
    window.addEventListener('resize', placeMenu);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', placeMenu, true);
      window.removeEventListener('resize', placeMenu);
    };
  }, [open, placeMenu]);

  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="dialog"
        title={`${label} — filtrele`}
        className={`inline-flex max-w-full items-center gap-1 rounded-md px-1 py-0.5 text-left font-medium transition ${
          open || active
            ? 'bg-blue-50 text-blue-700'
            : 'text-gray-700 hover:bg-white hover:text-blue-700'
        }`}
      >
        <span className="truncate">{label}</span>
        <FunnelIcon
          className={`h-3.5 w-3.5 shrink-0 ${
            active ? 'text-blue-600' : 'text-gray-400'
          }`}
        />
      </button>

      {open &&
        position &&
        createPortal(
          <div
            ref={menuRef}
            role="dialog"
            aria-label={`${label} filtresi`}
            style={{
              top: position.top,
              left: position.left,
              width: MENU_WIDTH,
            }}
            className="fixed z-50 rounded-xl border border-gray-200 bg-white p-2 normal-case tracking-normal shadow-xl"
          >
            <div className="mb-1.5 flex items-center justify-between gap-2 px-1">
              <span className="truncate text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                {label}
              </span>
              <button
                type="button"
                onClick={close}
                aria-label="Kapat"
                className="rounded p-0.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              >
                <XMarkIcon className="h-3.5 w-3.5" />
              </button>
            </div>

            {typeof children === 'function' ? children({ close }) : children}
          </div>,
          document.body
        )}
    </>
  );
}
