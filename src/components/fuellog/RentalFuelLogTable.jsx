// src/components/fuellog/RentalFuelLogTable.jsx
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline';

import ResizableTable, { ResizableTh } from '../ui/ResizableTable';
import useColumnResize from '../ui/useColumnResize';
import { formatDate, formatNumber } from '../../utils/maintenance';
import { parseDecimalInput } from '../../utils/numberInput';

// Excel tarzı sütun genişlikleri; tercih `fuellog:rental` anahtarıyla
// localStorage'da saklanır (makine tablosundan bağımsız).
const RENTAL_FUEL_COLUMN_WIDTHS = {
  equipment: 240,
  site: 160,
  period: 150,
  status: 140,
  day_total: 160,
  liters: 110,
  total: 150,
  action: 120,
};

const COLUMN_IDS = Object.keys(RENTAL_FUEL_COLUMN_WIDTHS);

const INPUT_CLASS =
  'w-full rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50';

//: Kiralama durumu rozeti; kod sunucudan seçilen güne göre gelir.
const STATUS_BADGE = {
  aktif: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  planlandi: 'bg-blue-50 text-blue-700 ring-blue-200',
  suresi_doldu: 'bg-red-50 text-red-700 ring-red-200',
};

function rentalLabel(rental) {
  return rental.equipment_name || `#${rental.rental_id}`;
}

function StatusBadge({ rental }) {
  const className =
    STATUS_BADGE[rental.status] || 'bg-gray-50 text-gray-600 ring-gray-200';

  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${className}`}
    >
      {rental.status_label || rental.status || '—'}
    </span>
  );
}

function Skeleton() {
  return (
    <div className="divide-y divide-gray-100">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="flex gap-4 px-4 py-3">
          <div className="h-5 w-40 animate-pulse rounded bg-gray-100" />
          <div className="h-5 w-28 animate-pulse rounded bg-gray-100" />
          <div className="h-5 w-24 animate-pulse rounded bg-gray-100" />
          <div className="h-5 flex-1 animate-pulse rounded bg-gray-100" />
          <div className="h-5 w-20 animate-pulse rounded bg-gray-100" />
        </div>
      ))}
    </div>
  );
}


function EntryRow({ rental, selectedDate, onSave }) {
  const [liters, setLiters] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const litersRef = useRef(null);

  const label = rentalLabel(rental);
  const litersValue = parseDecimalInput(liters);
  const canSubmit = litersValue !== null && litersValue > 0;

  const handleSubmit = async () => {
    if (saving) return;

    if (litersValue === null || litersValue <= 0) {
      toast.error(`${label}: 0'dan büyük bir litre değeri girin`);
      litersRef.current?.focus();
      return;
    }

    setSaving(true);
    setSaved(false);

    try {
      await onSave(rental, litersValue);
      setLiters('');
      setSaved(true);
    } catch {
      // Hata sayfadaki toast ile gösterilir; girilen değer korunur.
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    handleSubmit();
  };

  const handleChange = (event) => {
    setLiters(event.target.value);
    setSaved(false);
  };

  return (
    <tr className="group hover:bg-gray-50/70">
      <td className="px-3 py-2.5 align-top">
        <p className="truncate text-sm font-semibold text-gray-900" title={label}>
          {label}
        </p>
        <p className="truncate text-[11px] text-gray-500">
          {rental.company_name || '—'}
        </p>
        {rental.day_entry_count > 0 ? (
          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
            <CheckCircleIcon className="h-3 w-3" />
            {formatDate(selectedDate)} kaydı var
          </span>
        ) : (
          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 ring-1 ring-inset ring-amber-200">
            <PencilSquareIcon className="h-3 w-3" />
            Kayıt bekliyor
          </span>
        )}
      </td>

      <td className="px-3 py-2.5 align-top">
        <p
          className="truncate text-[12px] text-gray-700"
          title={rental.site_name || ''}
        >
          {rental.site_name || '—'}
        </p>
      </td>

      <td className="px-3 py-2.5 align-top text-[12px] text-gray-700">
        <p className="whitespace-nowrap">
          {formatDate(rental.start_date)} – {formatDate(rental.end_date)}
        </p>
      </td>

      <td className="px-3 py-2.5 align-top">
        <StatusBadge rental={rental} />
      </td>

      <td className="px-3 py-2.5 align-top text-right">
        {rental.day_entry_count > 0 ? (
          <>
            <p className="text-sm font-semibold text-gray-900">
              {formatNumber(rental.day_liters)} L
            </p>
            <p className="text-[11px] text-gray-400">
              {rental.day_entry_count} kayıt
            </p>
            {rental.last_given_by && (
              <p
                className="truncate text-[10px] text-gray-400"
                title={[rental.last_given_by, rental.last_note]
                  .filter(Boolean)
                  .join(' · ')}
              >
                Son: {rental.last_given_by}
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-gray-300">—</p>
        )}
      </td>

      <td className="px-2 py-2.5 align-top">
        <input
          ref={litersRef}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          aria-label={`${label} litre`}
          placeholder="Litre"
          value={liters}
          disabled={saving}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={(event) => event.target.select()}
          className={`${INPUT_CLASS} text-right`}
        />
      </td>

      <td className="px-3 py-2.5 align-top text-right">
        <p className="text-sm font-semibold text-gray-900">
          {formatNumber(rental.total_liters)} L
        </p>
        <p className="text-[10px] text-gray-400">
          Bu ay: {formatNumber(rental.monthly_liters)} L
        </p>
        <p className="text-[10px] text-gray-400">
          {rental.total_entry_count} kayıt
        </p>
      </td>

      <td className="px-2 py-2.5 align-top">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving || !canSubmit}
          className={`flex w-full items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${
            saved
              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          } disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500`}
          title="Litre değerini girip kaydedin (Enter)"
        >
          {saving ? (
            <>
              <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
              Kaydediliyor
            </>
          ) : saved ? (
            <>
              <CheckCircleIcon className="h-3.5 w-3.5" />
              Eklendi
            </>
          ) : (
            'Kaydet'
          )}
        </button>
      </td>
    </tr>
  );
}

export default function RentalFuelLogTable({
  rentals,
  loading,
  selectedDate,
  onSave,
  dailyTotal = 0,
}) {
  // Makine tablosundan ayrı bir anahtar: iki tablonun sütunları bağımsız.
  const resize = useColumnResize('fuellog:rental', RENTAL_FUEL_COLUMN_WIDTHS);

  if (loading && rentals.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <Skeleton />
      </div>
    );
  }

  if (!loading && rentals.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white px-6 py-14 text-center shadow-sm">
        <p className="text-sm font-medium text-gray-700">
          Gösterilecek kiralık makine yok
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Kiralık ekipman <strong>Kiralık Makineler</strong> sayfasından eklenir;
          arama veya tarih seçimini de değiştirebilirsiniz.
        </p>
        <Link
          to="/rental_machines"
          className="mt-3 inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
        >
          Kiralık Makineler
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {loading && (
        <div className="h-0.5 w-full overflow-hidden bg-blue-100">
          <div className="h-full w-1/3 animate-pulse bg-blue-500" />
        </div>
      )}

      <div className="max-h-[60vh] overflow-auto">
        <ResizableTable
          resize={resize}
          columnIds={COLUMN_IDS}
          style={{ fontFamily: 'Inter' }}
        >
          <thead className="sticky top-0 z-20 bg-gray-100 text-[11px] uppercase tracking-wide text-gray-600">
            <tr>
              <ResizableTh
                resize={resize}
                columnId="equipment"
                label="Ekipman / Firma"
                className="px-3 py-2.5 text-left font-semibold"
              >
                Ekipman / Firma
              </ResizableTh>
              <ResizableTh
                resize={resize}
                columnId="site"
                label="Şantiye"
                className="px-3 py-2.5 text-left font-semibold"
              >
                Şantiye
              </ResizableTh>
              <ResizableTh
                resize={resize}
                columnId="period"
                label="Tarih Aralığı"
                className="px-3 py-2.5 text-left font-semibold"
              >
                Tarih Aralığı
              </ResizableTh>
              <ResizableTh
                resize={resize}
                columnId="status"
                label="Durum"
                className="px-3 py-2.5 text-left font-semibold"
              >
                Durum
              </ResizableTh>
              <ResizableTh
                resize={resize}
                columnId="day_total"
                label="Günlük Verilen"
                className="px-3 py-2.5 text-right font-semibold"
              >
                Günlük Verilen
              </ResizableTh>
              <ResizableTh
                resize={resize}
                columnId="liters"
                label="Litre"
                className="px-2 py-2.5 text-right font-semibold text-blue-700"
              >
                Litre
              </ResizableTh>
              <ResizableTh
                resize={resize}
                columnId="total"
                label="Toplam Verilen"
                className="px-3 py-2.5 text-right font-semibold text-blue-700"
              >
                Toplam Verilen
              </ResizableTh>
              <ResizableTh
                resize={resize}
                columnId="action"
                label="İşlem"
                className="px-2 py-2.5 text-center font-semibold"
              >
                İşlem
              </ResizableTh>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {rentals.map((rental) => (
              <EntryRow
                // Tarih değişince satır yeniden kurulur; yarım kalan girişler
                // başka güne yazılmaz.
                key={`${rental.rental_id}:${selectedDate}`}
                rental={rental}
                selectedDate={selectedDate}
                onSave={onSave}
              />
            ))}
          </tbody>
        </ResizableTable>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 bg-gray-50 px-3 py-2 text-[11px] text-gray-600">
        <span>
          Kiralık ekipmanda sayaç olmadığı için ortalama yakıt hesaplanmaz;
          toplam litre tutulur.
        </span>
        <span className="font-semibold text-gray-800">
          {formatDate(selectedDate)} kiralık toplam: {formatNumber(dailyTotal)} L
        </span>
      </div>
    </div>
  );
}

