// src/components/meterlog/MeterLogEntryTable.jsx
import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline';

import ResizableTable, {
  ResizableTh,
  TableFillerTd,
  TableFillerTh,
} from '../ui/ResizableTable';
import useColumnResize from '../ui/useColumnResize';
import {
  TABLE_BODY,
  TABLE_CARD,
  TABLE_CELL,
  TABLE_HEAD,
  TABLE_HEAD_CELL,
  TABLE_MUTED,
  TABLE_PRIMARY,
  TABLE_ROW,
  TABLE_TOOLBAR,
} from '../ui/tableStyles';
import { formatDate, formatNumber } from '../../utils/maintenance';
import { latestEntryForDate, parseDecimalInput } from '../../utils/meterLog';

// Excel tarzı sütun genişlikleri. Kullanıcı başlıktaki tutamaçtan değiştirir;
// tercih localStorage'da saklanır.
const METER_LOG_COLUMN_WIDTHS = {
  machine: 230,
  type: 150,
  brand_model: 180,
  month_change: 160,
  last_change: 150,
  last_km: 120,
  last_engine_hours: 130,
  new_km: 140,
  new_engine_hours: 150,
  action: 120,
};

const COLUMN_IDS = Object.keys(METER_LOG_COLUMN_WIDTHS);

//: Başlık hücreleri; hizalama varyantları bu sabitten türetilir.
const HEAD_CLASS = `text-left ${TABLE_HEAD_CELL}`;
const HEAD_RIGHT = `text-right ${TABLE_HEAD_CELL}`;
const HEAD_CENTER = `text-center ${TABLE_HEAD_CELL}`;

const INPUT_CLASS =
  'w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-right text-sm text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50';

function machineLabel(machine) {
  return machine.identification_no || machine.plate_no || `#${machine.machine_id}`;
}

// "Son Gün/KM" ve "1 Aylık Toplam" hücreleri: KM ve motor saati farkı alt alta.
// Pozitif fark "+" ile gösterilir; hesaplanamayan fark "—" olur.
function formatChange(value) {
  if (value === null || value === undefined) return null;

  const text = formatNumber(value);
  return value > 0 ? `+${text}` : text;
}

function daySpan(fromDate, toDate) {
  if (!fromDate || !toDate) return null;

  const start = Date.parse(`${fromDate}T00:00:00Z`);
  const end = Date.parse(`${toDate}T00:00:00Z`);
  if (Number.isNaN(start) || Number.isNaN(end)) return null;

  return Math.round((end - start) / 86400000);
}

// Tooltip: hangi iki tarih arasındaki fark ve kaç günlük dönem.
function changeTitle(fromDate, toDate) {
  if (!fromDate || !toDate) return '';

  const range = `${formatDate(fromDate)} → ${formatDate(toDate)}`;
  const span = daySpan(fromDate, toDate);

  return span > 0 ? `${range} (${span} gün)` : range;
}

function ChangeCell({ km, engineHours, emphasis = false }) {
  const kmText = formatChange(km);
  const hourText = formatChange(engineHours);

  if (kmText === null && hourText === null) {
    return <p className="pt-0.5 text-[12px] text-slate-300">—</p>;
  }

  const valueClass = emphasis
    ? 'font-semibold text-slate-900 tabular-nums'
    : 'font-semibold text-slate-700 tabular-nums';

  return (
    <div className="space-y-0.5">
      <p className="flex items-center justify-between gap-1 text-[11px]">
        <span className="text-[9px] font-semibold uppercase text-slate-400">
          KM
        </span>
        <span className={valueClass}>{kmText ?? '—'}</span>
      </p>
      <p className="flex items-center justify-between gap-1 text-[11px]">
        <span className="text-[9px] font-semibold uppercase text-slate-400">
          Saat
        </span>
        <span className={valueClass}>{hourText ?? '—'}</span>
      </p>
    </div>
  );
}

function Skeleton() {
  return (
    <div>
      <div className="flex items-center gap-4 border-b border-slate-100 bg-slate-50/90 px-4 py-3">
        <div className="h-2.5 w-32 animate-pulse rounded bg-slate-200/80" />
        <div className="h-2.5 w-24 animate-pulse rounded bg-slate-200/80" />
        <div className="h-2.5 w-20 animate-pulse rounded bg-slate-200/80" />
        <div className="h-2.5 flex-1 animate-pulse rounded bg-slate-200/80" />
        <div className="h-2.5 w-16 animate-pulse rounded bg-slate-200/80" />
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="flex items-center gap-4 px-4 py-3">
            <div className="h-3 w-36 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-28 animate-pulse rounded bg-slate-100" />
            <div className="h-3 flex-1 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />
          </div>
        ))}
      </div>
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
    <tr className={`${TABLE_ROW} align-top`}>
      <td className={TABLE_CELL}>
        <p className={`truncate ${TABLE_PRIMARY}`} title={label}>
          {label}
        </p>
        <p className={`truncate ${TABLE_MUTED}`}>
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

      <td className={TABLE_CELL}>
        <p
          className="truncate text-[12px] text-slate-600"
          title={machine.type_name || ''}
        >
          {machine.type_name || '—'}
        </p>
        {machine.subtype_name && (
          <p className="truncate text-[11px] text-slate-400">
            {machine.subtype_name}
          </p>
        )}
      </td>

      <td className={TABLE_CELL}>
        <p className="truncate text-[12px] text-slate-600">
          {machine.car_mark_name || '—'}
        </p>
        {machine.car_model_name && (
          <p className="truncate text-[11px] text-slate-400">
            {machine.car_model_name}
          </p>
        )}
      </td>

      <td
        className={`${TABLE_CELL} text-right`}
        title={changeTitle(
          machine.month_change_from_date,
          machine.last_log_date
        )}
      >
        <ChangeCell
          km={machine.month_change_km}
          engineHours={machine.month_change_engine_hours}
          emphasis
        />
      </td>

      <td
        className={`${TABLE_CELL} text-right`}
        title={changeTitle(machine.last_change_from_date, machine.last_log_date)}
      >
        <ChangeCell
          km={machine.last_change_km}
          engineHours={machine.last_change_engine_hours}
        />
      </td>

      <td className={`${TABLE_CELL} text-right`}>
        <p className="text-[13px] font-semibold text-slate-900 tabular-nums">
          {formatNumber(machine.last_km)}
        </p>
        <p className={TABLE_MUTED}>
          {machine.last_log_date ? formatDate(machine.last_log_date) : 'Kayıt yok'}
        </p>
      </td>

      <td className={`${TABLE_CELL} text-right`}>
        <p className="text-[13px] font-semibold text-slate-900 tabular-nums">
          {formatNumber(machine.last_engine_hours)}
        </p>
        <p className={TABLE_MUTED}>
          {machine.last_log_date ? formatDate(machine.last_log_date) : 'Kayıt yok'}
        </p>
      </td>

      <td className="whitespace-nowrap px-2 py-3">
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

      <td className="whitespace-nowrap px-2 py-3">
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

      <td className="whitespace-nowrap px-2 py-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving || !canSubmit}
          className={`flex w-full items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${
            saved
              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          } disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500`}
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

      <TableFillerTd />
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
      <div className={TABLE_CARD}>
        <Skeleton />
      </div>
    );
  }

  return (
    <div className={TABLE_CARD}>
      {loading && (
        <div className="h-0.5 w-full overflow-hidden bg-blue-100">
          <div className="h-full w-1/3 animate-pulse bg-blue-500" />
        </div>
      )}

      <div className={TABLE_TOOLBAR}>
        <div className="flex items-center gap-2">
          <ClockIcon className="h-4 w-4 text-slate-400" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Sayaç Girişi
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 tabular-nums">
            {machines.length}
          </span>
        </div>
        <span className="text-[11px] text-slate-400">
          KM ve motor saati girip Enter ile kaydedin
        </span>
      </div>

      <div className="max-h-[60vh] overflow-auto">
        <ResizableTable
          resize={resize}
          columnIds={COLUMN_IDS}
          filler
          style={{ fontFamily: 'Inter' }}
        >
          <thead className={`sticky top-0 z-20 backdrop-blur ${TABLE_HEAD}`}>
            <tr>
              <ResizableTh
                resize={resize}
                columnId="machine"
                label="Makine"
                className={HEAD_CLASS}
              >
                Makine
              </ResizableTh>
              <ResizableTh
                resize={resize}
                columnId="type"
                label="Tip"
                className={HEAD_CLASS}
              >
                Tip
              </ResizableTh>
              <ResizableTh
                resize={resize}
                columnId="brand_model"
                label="Marka / Model"
                className={HEAD_CLASS}
              >
                Marka / Model
              </ResizableTh>
              <ResizableTh
                resize={resize}
                columnId="month_change"
                label="1 Aylık Toplam"
                title="Son 30 günün ilk okumasından bugüne fark — en fazla 1 aylık (KM / motor saati). Tek günlük veride — görünür."
                className={HEAD_RIGHT}
              >
                1 Aylık Toplam
              </ResizableTh>
              <ResizableTh
                resize={resize}
                columnId="last_change"
                label="Son Gün/KM"
                title="Güncel okuma ile bir önceki günün okuması arasındaki fark"
                className={HEAD_RIGHT}
              >
                Son Gün/KM
              </ResizableTh>
              <ResizableTh
                resize={resize}
                columnId="last_km"
                label="Son KM"
                className={HEAD_RIGHT}
              >
                Son KM
              </ResizableTh>
              <ResizableTh
                resize={resize}
                columnId="last_engine_hours"
                label="Son Motor Saati"
                className={HEAD_RIGHT}
              >
                Son Motor Saati
              </ResizableTh>
              <ResizableTh
                resize={resize}
                columnId="new_km"
                label="Yeni KM"
                className={HEAD_RIGHT}
              >
                Yeni KM
              </ResizableTh>
              <ResizableTh
                resize={resize}
                columnId="new_engine_hours"
                label="Yeni Motor Saati"
                className={HEAD_RIGHT}
              >
                Yeni Motor Saati
              </ResizableTh>
              <ResizableTh
                resize={resize}
                columnId="action"
                label="İşlem"
                className={HEAD_CENTER}
              >
                İşlem
              </ResizableTh>
              <TableFillerTh />
            </tr>
          </thead>

          <tbody className={`divide-y divide-slate-100 ${TABLE_BODY}`}>
            {machines.length === 0 && (
              <tr>
                <td
                  colSpan={COLUMN_IDS.length + 1}
                  className="px-6 py-16 text-center"
                >
                  <div className="flex flex-col items-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <ClockIcon className="h-5 w-5" />
                    </span>
                    <p className="mt-3 text-sm font-semibold text-slate-900">
                      Gösterilecek makine yok
                    </p>
                    <p className="mt-1 max-w-md text-[12px] text-slate-500">
                      Arama veya filtre seçimini değiştirmeyi deneyin.
                    </p>
                  </div>
                </td>
              </tr>
            )}

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
