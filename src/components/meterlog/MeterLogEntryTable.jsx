// src/components/meterlog/MeterLogEntryTable.jsx
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
import { latestEntryForDate, parseDecimalInput } from '../../utils/meterLog';

// Excel tarzı sütun genişlikleri. Kullanıcı başlıktaki tutamaçtan değiştirir;
// tercih localStorage'da saklanır.
const METER_LOG_COLUMN_WIDTHS = {
  machine: 230,
  type: 150,
  brand_model: 180,
  territory: 130,
  status: 120,
  last_km: 120,
  last_engine_hours: 130,
  new_km: 140,
  new_engine_hours: 150,
  action: 120,
};

const COLUMN_IDS = Object.keys(METER_LOG_COLUMN_WIDTHS);

const INPUT_CLASS =
  'w-full rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-right text-sm text-gray-900 outline-none transition placeholder:text-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50';

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
  const [km, setKm] = useState('');
  const [engineHours, setEngineHours] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const kmRef = useRef(null);
  const engineRef = useRef(null);

  const current = latestEntryForDate(machine, selectedDate);
  const label = machineLabel(machine);

  const canSubmit =
    parseDecimalInput(km) !== null && parseDecimalInput(engineHours) !== null;

  const handleSubmit = async () => {
    if (saving) return;

    const kmValue = parseDecimalInput(km);
    if (kmValue === null) {
      toast.error(`${label}: geçerli bir KM girin`);
      kmRef.current?.focus();
      return;
    }

    const engineValue = parseDecimalInput(engineHours);
    if (engineValue === null) {
      toast.error(`${label}: geçerli bir motor saati girin`);
      engineRef.current?.focus();
      return;
    }

    setSaving(true);
    setSaved(false);

    try {
      await onSave(machine, kmValue, engineValue);
      setKm('');
      setEngineHours('');
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

    if (event.currentTarget === kmRef.current) {
      engineRef.current?.focus();
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
        {current ? (
          <span
            className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200"
            title={`${formatDate(current.log_date)} · ${formatNumber(
              current.km
            )} km · ${formatNumber(current.engine_hours)} saat`}
          >
            <CheckCircleIcon className="h-3 w-3" />
            Bu güne kayıt var
          </span>
        ) : (
          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 ring-1 ring-inset ring-amber-200">
            <PencilSquareIcon className="h-3 w-3" />
            Bekliyor
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
        <p className="text-sm font-medium text-gray-800">
          {formatNumber(machine.last_km)}
        </p>
        <p className="text-[11px] text-gray-400">
          {machine.last_log_date ? formatDate(machine.last_log_date) : 'Kayıt yok'}
        </p>
      </td>

      <td className="px-3 py-2.5 align-top text-right">
        <p className="text-sm font-medium text-gray-800">
          {formatNumber(machine.last_engine_hours)}
        </p>
        <p className="text-[11px] text-gray-400">
          {machine.last_log_date ? formatDate(machine.last_log_date) : 'Kayıt yok'}
        </p>
      </td>

      <td className="px-2 py-2.5 align-top">
        <input
          ref={kmRef}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          aria-label={`${label} yeni KM`}
          placeholder={
            machine.last_km !== null && machine.last_km !== undefined
              ? formatNumber(machine.last_km)
              : ''
          }
          value={km}
          disabled={saving}
          onChange={handleChange(setKm)}
          onKeyDown={handleKeyDown}
          onFocus={(event) => event.target.select()}
          className={INPUT_CLASS}
        />
      </td>

      <td className="px-2 py-2.5 align-top">
        <input
          ref={engineRef}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          aria-label={`${label} yeni motor saati`}
          placeholder={
            machine.last_engine_hours !== null &&
            machine.last_engine_hours !== undefined
              ? formatNumber(machine.last_engine_hours)
              : ''
          }
          value={engineHours}
          disabled={saving}
          onChange={handleChange(setEngineHours)}
          onKeyDown={handleKeyDown}
          onFocus={(event) => event.target.select()}
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
          title="Her iki değeri girip kaydedin (Enter)"
        >
          {saving ? (
            <>
              <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
              Kaydediliyor
            </>
          ) : saved ? (
            <>
              <CheckCircleIcon className="h-3.5 w-3.5" />
              Kaydedildi
            </>
          ) : (
            'Kaydet'
          )}
        </button>
      </td>
    </tr>
  );
}

export default function MeterLogEntryTable({
  machines,
  loading,
  selectedDate,
  onSave,
}) {
  const resize = useColumnResize('meterlog:list', METER_LOG_COLUMN_WIDTHS);

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
          Arama veya filtre seçimini değiştirmeyi deneyin.
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
                columnId="last_km"
                label="Son KM"
                className="px-3 py-2.5 text-right font-semibold"
              >
                Son KM
              </ResizableTh>
              <ResizableTh
                resize={resize}
                columnId="last_engine_hours"
                label="Son Motor Saati"
                className="px-3 py-2.5 text-right font-semibold"
              >
                Son Motor Saati
              </ResizableTh>
              <ResizableTh
                resize={resize}
                columnId="new_km"
                label="Yeni KM"
                className="px-2 py-2.5 text-right font-semibold text-blue-700"
              >
                Yeni KM
              </ResizableTh>
              <ResizableTh
                resize={resize}
                columnId="new_engine_hours"
                label="Yeni Motor Saati"
                className="px-2 py-2.5 text-right font-semibold text-blue-700"
              >
                Yeni Motor Saati
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
