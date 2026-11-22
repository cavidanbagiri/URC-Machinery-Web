// src/components/maintenance/MaintenanceDateFilter.jsx
// "Hangi gün hangi makineler güncellendi?" — takvimden seçilen günde KM / motor
// saati kaydı girilen veya bakım işlemi yapılan makineler tabloda kalır
// (backend: `GET /api/maintenance/fetch_maintenance?updated_on=YYYY-MM-DD`).
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { CalendarDaysIcon, XMarkIcon } from '@heroicons/react/24/outline';

import { setFilter } from '../../stores/maintenance_slice';
import { formatDate, todayISO } from '../../utils/maintenance';

export default function MaintenanceDateFilter() {
  const dispatch = useDispatch();
  const value = useSelector((s) => s.maintenance.filters.updated_on) || '';
  const loading = useSelector((s) => s.maintenance.loading);

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

  const apply = (next, close = true) => {
    dispatch(setFilter({ key: 'updated_on', value: next }));
    if (close) setOpen(false);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <div
        className={`flex items-center rounded-lg border text-sm font-medium transition ${
          value
            ? 'border-blue-200 bg-blue-50 text-blue-700'
            : 'border-gray-200 bg-white text-gray-700'
        }`}
      >
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          aria-haspopup="dialog"
          title="Seçilen günde güncellenen makineleri göster"
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 transition hover:bg-black/[0.03]"
        >
          <CalendarDaysIcon className="h-4 w-4" />
          {value ? formatDate(value) : 'Tarih'}
        </button>

        {value && (
          <button
            type="button"
            onClick={() => apply('')}
            disabled={loading}
            aria-label="Tarih filtresini temizle"
            title="Tarih filtresini temizle"
            className="mr-1 rounded p-1 text-blue-700 transition hover:bg-blue-100 disabled:opacity-50"
          >
            <XMarkIcon className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && (
        <div
          role="dialog"
          aria-label="Güncelleme tarihi"
          className="absolute right-0 top-full z-30 mt-1 w-72 rounded-xl border border-gray-200 bg-white p-4 shadow-lg"
        >
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Güncelleme tarihi
            </span>
            <input
              type="date"
              value={value || todayISO()}
              max={todayISO()}
              onChange={(event) => apply(event.target.value, false)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <p className="mt-2 text-[11px] leading-snug text-gray-500">
            Seçilen günde <b>Güncel KM ve Motor Saatleri</b> sayfasından kayıt
            girilen veya bu sayfada bakım / sayaç işlemi yapılan makineler
            listelenir.
          </p>

          <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
            <button
              type="button"
              onClick={() => apply(todayISO())}
              className="text-xs font-medium text-blue-600 hover:underline"
            >
              Bugün
            </button>

            {value && (
              <button
                type="button"
                onClick={() => apply('')}
                className="text-xs font-medium text-red-600 hover:underline"
              >
                Tarihi temizle
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
