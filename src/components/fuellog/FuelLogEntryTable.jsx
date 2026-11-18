// src/components/fuellog/FuelLogEntryTable.jsx
import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline';

import ResizableTable, { ResizableTh } from '../ui/ResizableTable';
import useColumnResize from '../ui/useColumnResize';
import StatusBadge from '../machines/StatusBadge';
import { formatDate, formatNumber } from '../../utils/maintenance';
import { parseDecimalInput } from '../../utils/numberInput';

// Excel tarzı sütun genişlikleri. Kullanıcı başlıktaki tutamaçtan değiştirir;
// tercih localStorage'da saklanır.
const FUEL_LOG_COLUMN_WIDTHS = {
  machine: 230,
  type: 150,
  brand_model: 180,
  territory: 130,
  status: 110,
  day_total: 150,
  liters: 110,
  given_by: 170,
  note: 220,
  action: 120,
};

const COLUMN_IDS = Object.keys(FUEL_LOG_COLUMN_WIDTHS);

const INPUT_CLASS =
  'w-full rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50';

function machineLabel(machine) {
  return machine.identification_no || machine.plate_no || `#${machine.machine_id}`;
}

function Skeleton() {
  return (
    <div className="divide-y divide-gray-100">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="flex gap-4 px-4 py-3">
          <div className="h-5 w-36 animate-pulse rounded bg-gray-100" />
          <div className="h-5 w-24 animate-pulse rounded bg-gray-100" />
          <div className="h-5 w-28 animate-pulse rounded bg-gray-100" />
          <div className="h-5 flex-1 animate-pulse rounded bg-gray-100" />
          <div className="h-5 w-20 animate-pulse rounded bg-gray-100" />
        </div>
      ))}
    </div>
  );
}

function EntryRow({ machine, selectedDate, onSave }) {
  const [liters, setLiters] = useState('');
  const [givenBy, setGivenBy] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const litersRef = useRef(null);
  const givenByRef = useRef(null);
  const noteRef = useRef(null);

  const label = machineLabel(machine);
  const litersValue = parseDecimalInput(liters);
  const canSubmit =
    litersValue !== null && litersValue > 0 && Boolean(givenBy.trim());
  const lastInfo = [machine.last_given_by, machine.last_note]
    .filter(Boolean)
    .join(' · ');

  const handleSubmit = async () => {
    if (saving) return;

    if (litersValue === null || litersValue <= 0) {
      toast.error(`${label}: 0'dan büyük bir litre değeri girin`);
      litersRef.current?.focus();
      return;
    }

    const provider = givenBy.trim();
    if (!provider) {
      toast.error(`${label}: yakıtı veren bilgisini girin`);
      givenByRef.current?.focus();
      return;
    }

    setSaving(true);
    setSaved(false);

    try {
      await onSave(machine, litersValue, provider, note.trim());
      setLiters('');
      setGivenBy('');
      setNote('');
      setSaved(true);
    } catch {
      // Hata mesajı sayfadaki toast ile gösterilir; girilen değerler korunur.
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();

    if (event.currentTarget === litersRef.current) {
      givenByRef.current?.focus();
      return;
    }

    if (event.currentTarget === givenByRef.current) {
      noteRef.current?.focus();
      return;
    }

    handleSubmit();
  };

  const handleChange = (setter) => (event) => {
    setter(event.target.value);
    setSaved(false);
  };

  return (
    <tr className="group hover:bg-gray-50/70">
      <td className="px-3 py-2.5 align-top">
        <p className="truncate text-sm font-semibold text-gray-900" title={label}>
          {label}
        </p>
        <p className="truncate text-[11px] text-gray-500">
          {machine.plate_no || machine.vin_no || '—'}
        </p>
        {machine.day_entry_count > 0 ? (
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
          title={machine.type_name || ''}
        >
          {machine.type_name || '—'}
        </p>
        {machine.subtype_name && (
          <p className="truncate text-[11px] text-gray-400">
            {machine.subtype_name}
          </p>
        )}
      </td>

      <td className="px-3 py-2.5 align-top">
        <p className="truncate text-[12px] text-gray-700">
          {machine.car_mark_name || '—'}
        </p>
        {machine.car_model_name && (
          <p className="truncate text-[11px] text-gray-400">
            {machine.car_model_name}
          </p>
        )}
      </td>

      <td className="px-3 py-2.5 align-top text-[12px] text-gray-700">
        <p className="truncate" title={machine.territory_name || ''}>
          {machine.territory_name || '—'}
        </p>
      </td>

      <td className="px-3 py-2.5 align-top">
        <StatusBadge
          status={
            machine.status_name
              ? { name: machine.status_name, color: machine.status_color }
              : null
          }
        />
      </td>

      <td className="px-3 py-2.5 align-top text-right">
        {machine.day_entry_count > 0 ? (
          <>
            <p className="text-sm font-semibold text-gray-900">
              {formatNumber(machine.day_liters)} L
            </p>
            <p className="text-[11px] text-gray-400">
              {machine.day_entry_count} kayıt
            </p>
            {machine.last_given_by && (
              <p
                className="truncate text-[10px] text-gray-400"
                title={lastInfo || machine.last_given_by}
              >
                Son: {machine.last_given_by}
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
          onChange={handleChange(setLiters)}
          onKeyDown={handleKeyDown}
          onFocus={(event) => event.target.select()}
          className={`${INPUT_CLASS} text-right`}
        />
      </td>

      <td className="px-2 py-2.5 align-top">
        <input
          ref={givenByRef}
          type="text"
          autoComplete="off"
          aria-label={`${label} yakıtı veren`}
          placeholder="Ad / firma"
          maxLength={150}
          value={givenBy}
          disabled={saving}
          onChange={handleChange(setGivenBy)}
          onKeyDown={handleKeyDown}
          className={INPUT_CLASS}
        />
      </td>

      <td className="px-2 py-2.5 align-top">
        <input
          ref={noteRef}
          type="text"
          autoComplete="off"
          aria-label={`${label} not`}
          placeholder="Not (opsiyonel)"
          maxLength={1000}
          value={note}
          disabled={saving}
          onChange={handleChange(setNote)}
          onKeyDown={handleKeyDown}
          className={INPUT_CLASS}
        />
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
          title="Litre ve yakıtı veren bilgisini girip kaydedin (Enter)"
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

export default function FuelLogEntryTable({
  machines,
  loading,
  selectedDate,
  onSave,
}) {
  const resize = useColumnResize('fuellog:list', FUEL_LOG_COLUMN_WIDTHS);

  if (loading && machines.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <Skeleton />
      </div>
    );
  }

  if (!loading && machines.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white px-6 py-14 text-center shadow-sm">
        <p className="text-sm font-medium text-gray-700">Gösterilecek makine yok</p>
        <p className="mt-1 text-xs text-gray-500">
          Arama veya tarih seçimini değiştirmeyi deneyin.
        </p>
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
                columnId="machine"
                label="Makine"
                className="px-3 py-2.5 text-left font-semibold"
              >
                Makine
              </ResizableTh>
              <ResizableTh
                resize={resize}
                columnId="type"
                label="Tip"
                className="px-3 py-2.5 text-left font-semibold"
              >
                Tip
              </ResizableTh>
              <ResizableTh
                resize={resize}
                columnId="brand_model"
                label="Marka / Model"
                className="px-3 py-2.5 text-left font-semibold"
              >
                Marka / Model
              </ResizableTh>
              <ResizableTh
                resize={resize}
                columnId="territory"
                label="Bölge"
                className="px-3 py-2.5 text-left font-semibold"
              >
                Bölge
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
                columnId="given_by"
                label="Yakıtı Veren"
                className="px-2 py-2.5 text-left font-semibold text-blue-700"
              >
                Yakıtı Veren
              </ResizableTh>
              <ResizableTh
                resize={resize}
                columnId="note"
                label="Not"
                className="px-2 py-2.5 text-left font-semibold text-blue-700"
              >
                Not
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
            {machines.map((machine) => (
              <EntryRow
                // Tarih değişince satır yeniden kurulur; yarım kalan girişler
                // başka güne yazılmaz.
                key={`${machine.machine_id}:${selectedDate}`}
                machine={machine}
                selectedDate={selectedDate}
                onSave={onSave}
              />
            ))}
          </tbody>
        </ResizableTable>
      </div>
    </div>
  );
}
