// src/components/fuellog/FuelLogEntryTable.jsx
import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  FireIcon,
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
  meter: 180,
  consumption: 200,
  action: 140,
};

const COLUMN_IDS = Object.keys(FUEL_LOG_COLUMN_WIDTHS);

//: Başlık hücreleri; hizalama varyantları bu sabitten türetilir.
const HEAD_CLASS = `text-left ${TABLE_HEAD_CELL}`;
const HEAD_RIGHT = `text-right ${TABLE_HEAD_CELL}`;
const HEAD_CENTER = `text-center ${TABLE_HEAD_CELL}`;

const INPUT_CLASS =
  'w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50';

function machineLabel(machine) {
  return machine.identification_no || machine.plate_no || `#${machine.machine_id}`;
}

// Litre sayaç farkına bölündüğü için km başına değerler 1'in altına iner;
// küçük değerlerde üç ondalık, büyük değerlerde iki ondalık gösterilir.
const smallNumberFormatter = new Intl.NumberFormat('tr-TR', {
  maximumFractionDigits: 3,
});
const largeNumberFormatter = new Intl.NumberFormat('tr-TR', {
  maximumFractionDigits: 2,
});

function formatConsumption(value) {
  if (value === null || value === undefined || value === '') return '—';
  const number = Number(value);
  if (Number.isNaN(number)) return '—';
  return Math.abs(number) < 1
    ? smallNumberFormatter.format(number)
    : largeNumberFormatter.format(number);
}

function consumptionUnitLabel(unit) {
  return unit === 'hour' ? 'saat' : 'km';
}

/**
 * "Güncel KM / Saat": the newest reading from **Güncel KM ve Motor Saatleri**.
 * Zero counters are hidden when the other one carries the machine's usage.
 */
function MeterCell({ machine }) {
  const km = Number(machine.last_km) || 0;
  const hours = Number(machine.last_engine_hours) || 0;
  const hasReading =
    machine.last_log_date !== null && machine.last_log_date !== undefined;

  if (!hasReading) {
    return <p className={TABLE_MUTED}>Sayaç kaydı yok</p>;
  }

  const showKm = km > 0 || hours === 0;
  const showHours = hours > 0 || km === 0;

  return (
    <>
      <div className="flex flex-col gap-0.5 text-[12px] text-slate-600">
        {showKm && (
          <span>
            KM:{' '}
            <strong className="font-semibold text-slate-900">
              {formatNumber(km)}
            </strong>
          </span>
        )}
        {showHours && (
          <span>
            Saat:{' '}
            <strong className="font-semibold text-slate-900">
              {formatNumber(hours)}
            </strong>
          </span>
        )}
      </div>
      <p className="mt-0.5 text-[10px] text-slate-400">
        {formatDate(machine.last_log_date)}
      </p>
    </>
  );
}

/**
 * "Ortalama Yakıt": liters per 1 km / 1 engine hour, calculated by the backend
 * from the fuel ledger and the counter movement since the first fuel row.
 */
function ConsumptionCell({ machine }) {
  const hasConsumption =
    machine.avg_consumption !== null && machine.avg_consumption !== undefined;

  if (!hasConsumption) {
    return (
      <>
        <p className="text-sm text-slate-300">—</p>
        <p className="text-[10px] text-slate-400">Sayaç hareketi yetersiz</p>
      </>
    );
  }

  const unit = consumptionUnitLabel(machine.consumption_unit);
  const title = [
    `${formatNumber(machine.consumption_liters)} L`,
    `${formatNumber(machine.consumption_distance)} ${unit}`,
    machine.consumption_start_date && machine.consumption_end_date
      ? `${formatDate(machine.consumption_start_date)} – ${formatDate(
          machine.consumption_end_date
        )}`
      : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <>
      <p
        className="text-[13px] font-semibold text-slate-900"
        title={title}
      >
        {formatConsumption(machine.avg_consumption)} L/{unit}
      </p>
      <p className="truncate text-[10px] text-slate-400" title={title}>
        {formatNumber(machine.consumption_liters)} L /{' '}
        {formatNumber(machine.consumption_distance)} {unit}
      </p>
    </>
  );
}

function Skeleton() {
  return (
    <div>
      <div className="flex items-center gap-4 border-b border-slate-100 bg-slate-50/90 px-4 py-3">
        <div className="h-2.5 w-28 animate-pulse rounded bg-slate-200/80" />
        <div className="h-2.5 w-20 animate-pulse rounded bg-slate-200/80" />
        <div className="h-2.5 w-24 animate-pulse rounded bg-slate-200/80" />
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

function EntryRow({ machine, selectedDate, onSave, onEdit }) {
  const [liters, setLiters] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const litersRef = useRef(null);

  const label = machineLabel(machine);
  const litersValue = parseDecimalInput(liters);
  const canSubmit = litersValue !== null && litersValue > 0;
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

    setSaving(true);
    setSaved(false);

    try {
      await onSave(machine, litersValue);
      setLiters('');
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

      <td className={TABLE_CELL}>
        <p
          className="truncate text-[12px] text-slate-600"
          title={machine.type_name || ''}
        >
          {machine.type_name || '—'}
        </p>
        {machine.subtype_name && (
          <p className={`truncate ${TABLE_MUTED}`}>{machine.subtype_name}</p>
        )}
      </td>

      <td className={TABLE_CELL}>
        <p className="truncate text-[12px] text-slate-600">
          {machine.car_mark_name || '—'}
        </p>
        {machine.car_model_name && (
          <p className={`truncate ${TABLE_MUTED}`}>{machine.car_model_name}</p>
        )}
      </td>

      <td className={TABLE_CELL}>
        <p className="truncate text-[12px] text-slate-600" title={machine.territory_name || ''}>
          {machine.territory_name || '—'}
        </p>
      </td>

      <td className={TABLE_CELL}>
        <StatusBadge
          status={
            machine.status_name
              ? { name: machine.status_name, color: machine.status_color }
              : null
          }
        />
      </td>

      <td className={`${TABLE_CELL} text-right`}>
        {machine.day_entry_count > 0 ? (
          <>
            <p className="text-[13px] font-semibold text-slate-900 tabular-nums">
              {formatNumber(machine.day_liters)} L
            </p>
            <p className={TABLE_MUTED}>{machine.day_entry_count} kayıt</p>
            {machine.last_given_by && (
              <p
                className="truncate text-[10px] text-slate-400"
                title={lastInfo || machine.last_given_by}
              >
                Son: {machine.last_given_by}
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-slate-300">—</p>
        )}
      </td>

      <td className="whitespace-nowrap px-2 py-3">
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

      <td className={TABLE_CELL}>
        <MeterCell machine={machine} />
      </td>

      <td className={TABLE_CELL}>
        <ConsumptionCell machine={machine} />
      </td>

      <td className="whitespace-nowrap px-2 py-3">
        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || !canSubmit}
            className={`flex w-full items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${
              saved
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            } disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500`}
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

          {/* Girilmiş kayıtların tarihini / litresini düzeltir: 24'ünün
              mazotu 25'inde girildiyse satır doğru güne taşınır. */}
          <button
            type="button"
            onClick={() => onEdit(machine)}
            className="flex w-full items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:bg-slate-50"
            title="Girilmiş kayıtları düzenle (tarih / litre)"
          >
            <PencilSquareIcon className="h-3.5 w-3.5" />
            Düzenle
          </button>
        </div>
      </td>

      <TableFillerTd />
    </tr>
  );
}

export default function FuelLogEntryTable({
  machines,
  loading,
  selectedDate,
  onSave,
  onEdit,
}) {
  const resize = useColumnResize('fuellog:list', FUEL_LOG_COLUMN_WIDTHS);

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
          <FireIcon className="h-4 w-4 text-slate-400" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Yakıt Girişi
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 tabular-nums">
            {machines.length}
          </span>
        </div>
        <span className="text-[11px] text-slate-400">
          Litre girip Enter ile kaydedin · Düzenle ile geçmiş kaydı düzeltin
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
                columnId="territory"
                label="Bölge"
                className={HEAD_CLASS}
              >
                Bölge
              </ResizableTh>
              <ResizableTh
                resize={resize}
                columnId="status"
                label="Durum"
                className={HEAD_CLASS}
              >
                Durum
              </ResizableTh>
              <ResizableTh
                resize={resize}
                columnId="day_total"
                label="Günlük Verilen"
                className={HEAD_RIGHT}
              >
                Günlük Verilen
              </ResizableTh>
              <ResizableTh
                resize={resize}
                columnId="liters"
                label="Litre"
                className={HEAD_RIGHT}
              >
                Litre
              </ResizableTh>
              <ResizableTh
                resize={resize}
                columnId="meter"
                label="Güncel KM / Saat"
                className={HEAD_CLASS}
              >
                Güncel KM / Saat
              </ResizableTh>
              <ResizableTh
                resize={resize}
                columnId="consumption"
                label="Ortalama Yakıt"
                className={HEAD_CLASS}
              >
                Ortalama Yakıt
              </ResizableTh>
              <ResizableTh
                resize={resize}
                columnId="action"
                label="İşlemler"
                className={HEAD_CENTER}
              >
                İşlemler
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
                      <FireIcon className="h-5 w-5" />
                    </span>
                    <p className="mt-3 text-sm font-semibold text-slate-900">
                      Gösterilecek makine yok
                    </p>
                    <p className="mt-1 text-[12px] text-slate-500">
                      Arama veya tarih seçimini değiştirmeyi deneyin.
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
                onEdit={onEdit}
              />
            ))}
          </tbody>
        </ResizableTable>
      </div>
    </div>
  );
}
