// src/components/maintenance/MaintenanceTable.jsx
import { useDispatch, useSelector } from 'react-redux';
import {
  CheckCircleIcon,
  ClockIcon,
  PencilSquareIcon,
  PlusCircleIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';

import FlaticonIcon from '../ui/FlaticonIcon';
import { ColumnFilterHeader } from '../ui/ColumnFilter';
import ResizableTable, {
  ResizableTh,
  TableFillerTd,
  TableFillerTh,
} from '../ui/ResizableTable';
import useColumnResize from '../ui/useColumnResize';
import StatusBadge from '../machines/StatusBadge';
import {
  MAINTENANCE_STATUS_OPTIONS,
  setFilter,
  setFilters,
} from '../../stores/maintenance_slice';
import {
  formatCounter,
  formatDate,
  formatNumber,
  isTrailerTypeName,
  unitLabel,
} from '../../utils/maintenance';
import {
  TABLE_BODY,
  TABLE_CARD,
  TABLE_CELL,
  TABLE_HEAD,
  TABLE_HEAD_CELL,
  TABLE_MUTED,
  TABLE_NUM,
  TABLE_PRIMARY,
  TABLE_ROW,
  TABLE_TERTIARY,
  TABLE_TOOLBAR,
} from '../ui/tableStyles';

//: 10 görünür sütun + kalan alanı emen dolgu sütunu (boş durum satırı için).
const COLUMN_COUNT = 11;

// Sütunların başlangıç genişlikleri (px). Kullanıcı başlıktaki tutamaçtan
// sürükleyerek değiştirir; seçim tarayıcıda saklanır (useColumnResize).
const MAINTENANCE_COLUMN_WIDTHS = {
  status: 132,
  machine: 250,
  territory: 140,
  type: 160,
  mark_model: 210,
  has_plan: 150,
  last_service: 150,
  current_counter: 190,
  remaining: 200,
  actions: 172,
};

const HAS_PLAN_OPTIONS = [
  { value: 'true', label: 'Planlı' },
  { value: 'false', label: 'Plan yok' },
];

//: Satırın solundaki ince durum şeridi — badge rengiyle aynı ailede.
const STATUS_ACCENT = {
  red: 'bg-red-400',
  yellow: 'bg-amber-400',
  orange: 'bg-orange-400',
  green: 'bg-emerald-400',
  blue: 'bg-blue-400',
  gray: 'bg-slate-200',
  slate: 'bg-slate-300',
};

//: "Kalan" çubuğunun rengi: gecikmiş kırmızı, yaklaşan amber, uygun yeşil.
function progressTone(statusCode) {
  if (statusCode === 'gecikmis') return 'bg-red-500';
  if (statusCode === 'yaklasiyor') return 'bg-amber-400';
  if (statusCode === 'veri_uyarisi') return 'bg-orange-400';
  if (statusCode === 'uygun') return 'bg-emerald-500';
  return 'bg-slate-300';
}

function ActionButton({ title, onClick, disabled, tone = 'blue', children }) {
  const tones = {
    blue: 'hover:bg-blue-50 hover:text-blue-600',
    green: 'hover:bg-emerald-50 hover:text-emerald-600',
    gray: 'hover:bg-slate-100 hover:text-slate-700',
    amber: 'hover:bg-amber-50 hover:text-amber-600',
  };

  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md p-1.5 transition ${
        disabled
          ? 'cursor-not-allowed text-slate-300'
          : `text-slate-400 ${tones[tone] || tones.blue}`
      }`}
    >
      {children}
    </button>
  );
}

function Skeleton() {
  return (
    <div className="divide-y divide-slate-100">
      <div className="flex gap-4 bg-slate-50/90 px-4 py-3">
        {[64, 96, 72, 104, 120].map((width) => (
          <div
            key={width}
            className="h-3 animate-pulse rounded-full bg-slate-200/80"
            style={{ width }}
          />
        ))}
      </div>
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex items-center gap-4 px-4 py-3.5">
          <div className="h-5 w-20 animate-pulse rounded-full bg-slate-100" />
          <div className="h-5 w-28 animate-pulse rounded bg-slate-100" />
          <div className="h-5 w-24 animate-pulse rounded bg-slate-100" />
          <div className="h-5 flex-1 animate-pulse rounded bg-slate-100" />
          <div className="h-5 w-24 animate-pulse rounded-full bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

function remainingClass(remaining, threshold, statusCode) {
  if (statusCode === 'veri_eksik' || statusCode === 'plan_yok') {
    return 'text-slate-400';
  }
  if (statusCode === 'veri_uyarisi') return 'font-medium text-orange-600';
  if (statusCode === 'pasif') return 'text-slate-500';
  if (remaining === null || remaining === undefined) return 'text-slate-400';
  if (remaining <= 0) return 'font-semibold text-red-600';
  if (threshold !== null && threshold !== undefined && remaining <= threshold) {
    return 'font-semibold text-amber-600';
  }
  return 'font-medium text-slate-800';
}

const isNumber = (value) => value !== null && value !== undefined;

/**
 * "Güncel KM / Saat": the newest reading of **Güncel KM ve Motor Saatleri**
 * (`machine_meter_logs`) when it is the freshest source of the counter.
 * The plan's own counter is the fallback for machines without a daily reading
 * (or when the plan counter is newer — see `resolve_current_counter`).
 */
function CounterCell({ item }) {
  if (item.has_plan && item.counter_source === 'meter') {
    return (
      <span
        className="inline-flex flex-col gap-0.5"
        title={`Güncel KM ve Motor Saatleri kaydı${
          item.meter_log_date ? ` (${formatDate(item.meter_log_date)})` : ''
        }`}
      >
        <span className={`font-medium text-slate-900 ${TABLE_NUM}`}>
          {formatCounter(item.meter_km, 'km')}
        </span>
        <span className={`text-slate-500 ${TABLE_NUM}`}>
          {formatCounter(item.meter_engine_hours, 'hour')}
        </span>
        {item.meter_log_date && (
          <span className={TABLE_TERTIARY}>{formatDate(item.meter_log_date)}</span>
        )}
      </span>
    );
  }

  if (item.has_plan && isNumber(item.current_counter)) {
    return (
      <span
        className="inline-flex flex-col gap-0.5"
        title="Plan sayacı (güncel KM / saat kaydı yok veya plan sayacı daha yeni)"
      >
        <span className={`font-medium text-slate-900 ${TABLE_NUM}`}>
          {formatCounter(item.current_counter, item.usage_unit)}
        </span>
        {item.current_counter_date && (
          <span className={TABLE_TERTIARY}>
            {formatDate(item.current_counter_date)}
          </span>
        )}
      </span>
    );
  }

  if (isNumber(item.meter_km) || isNumber(item.meter_engine_hours)) {
    // Plan yok ama günlük KM / saat kaydı var: yine de göster.
    return (
      <span
        className="inline-flex flex-col gap-0.5"
        title="Güncel KM ve Motor Saatleri kaydı"
      >
        <span className={`text-slate-700 ${TABLE_NUM}`}>
          {formatCounter(item.meter_km, 'km')}
        </span>
        <span className={`text-slate-500 ${TABLE_NUM}`}>
          {formatCounter(item.meter_engine_hours, 'hour')}
        </span>
      </span>
    );
  }

  return <span className="text-slate-300">—</span>;
}

/**
 * "Kalan": kalan ömrü sayı olarak gösterir, altında bakım aralığına göre
 * dolan ince bir çubuk çizer (gecikmiş → kırmızı, yaklaşan → amber).
 */
function RemainingCell({ item }) {
  if (!item.has_plan) {
    return <span className="text-slate-300">—</span>;
  }

  if (item.status?.code === 'veri_uyarisi') {
    return (
      <span className="font-medium text-orange-600">Kontrol gerekli</span>
    );
  }

  const interval = Number(item.interval_value);
  const remaining = Number(item.remaining);
  const ratio =
    Number.isFinite(interval) && interval > 0 && Number.isFinite(remaining)
      ? (remaining / interval) * 100
      : null;

  // Gecikmiş bakımda çubuk tamamen dolu/kırmızı; diğerlerinde oran kadar,
  // ama en az görünür bir dilim kalır.
  const isOverdue =
    item.status?.code === 'gecikmis' || (ratio !== null && remaining <= 0);
  const barWidth = isOverdue
    ? 100
    : ratio === null
      ? 0
      : Math.max(4, Math.min(100, ratio));

  return (
    <div className="min-w-0">
      <p
        className={`${TABLE_NUM} ${remainingClass(
          item.remaining,
          item.effective_warning_threshold,
          item.status?.code
        )}`}
      >
        {formatCounter(item.remaining, item.usage_unit)}
      </p>

      <div className="mt-1.5 flex items-center gap-2">
        <span
          className="h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-slate-100"
          title={
            ratio === null
              ? 'Bakım aralığı bilinmiyor'
              : `Aralığın %${Math.round(Math.max(0, Math.min(100, ratio)))} kadarı kaldı`
          }
        >
          {barWidth > 0 && (
            <span
              className={`block h-full rounded-full transition-all ${progressTone(
                item.status?.code
              )}`}
              style={{ width: `${barWidth}%` }}
            />
          )}
        </span>

        {item.next_counter !== null && item.next_counter !== undefined && (
          <span
            className={`truncate ${TABLE_TERTIARY} ${TABLE_NUM}`}
            title={`Sonraki bakım: ${formatCounter(
              item.next_counter,
              item.usage_unit
            )}`}
          >
            Sonraki {formatCounter(item.next_counter, item.usage_unit)}
          </span>
        )}
      </div>
    </div>
  );
}

export default function MaintenanceTable({
  items,
  loading,
  hasActiveFilters,
  onOpenFilters,
  onResetFilters,
  onEditPlan,
  onReading,
  onComplete,
  onHistory,
  sortBy,
  sortOrder,
  onSortChange,
}) {
  const dispatch = useDispatch();
  const filters = useSelector((s) => s.maintenance.filters);
  const lookups = useSelector((s) => s.lookup.data);

  const handleFilterChange = (key, value) => {
    if (key === 'status') {
      // "Pasif" durumu, varsayılan olarak gizlenen pasif planları da getirir;
      // bu durumdan çıkıldığında include_inactive tekrar kapatılır.
      const next = { status: value };
      if (value === 'pasif') next.include_inactive = true;
      else if (filters.status === 'pasif') next.include_inactive = false;
      dispatch(setFilters(next));
      return;
    }
    dispatch(setFilter({ key, value }));
  };

  // Kolon başlıkları — `filter` taşıyan başlıklar Excel tarzı açılır filtre alır.
  // `sortable` olan kolon başlığı sıralama düğmesi olarak kalır.
  const headerColumns = [
    {
      id: 'status',
      label: 'Durum',
      filter: {
        kind: 'select',
        key: 'status',
        options: MAINTENANCE_STATUS_OPTIONS.map((option) => ({
          value: option.code,
          label: option.name,
        })),
      },
    },
    {
      id: 'machine',
      label: 'Makine',
      filter: {
        kind: 'text',
        key: 'search',
        placeholder: 'Kimlik / plaka / VIN',
      },
    },
    {
      id: 'territory',
      label: 'Bölge',
      filter: {
        kind: 'select',
        key: 'territory_id',
        options: lookups.territory || [],
      },
    },
    {
      id: 'type',
      label: 'Tip',
      filter: {
        kind: 'select',
        key: 'type_id',
        // Dorseler Bakım listesinde yok (motor saati / KM'si yok), bu yüzden
        // tip filtresinde de seçenek olarak çıkmaz.
        options: (lookups.type_transport || []).filter(
          (type) => !isTrailerTypeName(type.name)
        ),
      },
    },
    {
      id: 'mark_model',
      label: 'Marka / Model',
      filter: {
        kind: 'stack',
        fields: [
          {
            key: 'car_mark_id',
            kind: 'select',
            label: 'Marka',
            options: lookups.car_mark || [],
          },
          {
            key: 'car_model_id',
            kind: 'select',
            label: 'Model',
            options: lookups.car_model || [],
          },
        ],
      },
    },
    {
      id: 'has_plan',
      label: 'Plan',
      filter: { kind: 'select', key: 'has_plan', options: HAS_PLAN_OPTIONS },
    },
    { id: 'last_service', label: 'Son Bakım' },
    { id: 'current_counter', label: 'Güncel KM / Saat' },
    { id: 'remaining', label: 'Kalan', sortable: true },
    { id: 'actions', label: 'İşlemler', align: 'right' },
  ];

  // Excel tarzı genişlik ayarı: başlığın sağ kenarındaki tutamaçtan sürüklenir,
  // genişlikler tarayıcıda saklanır. `filler` sayesinde genişlikler mutlaktır.
  const resize = useColumnResize('maintenance:list', MAINTENANCE_COLUMN_WIDTHS);
  const columnIds = headerColumns.map((column) => column.id);

  if (loading && items.length === 0) {
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
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-slate-500">
            <WrenchScrewdriverIcon className="h-3.5 w-3.5" />
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Makine Listesi
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-slate-500">
            {items.length}
          </span>
        </div>

        {resize.isCustomized && (
          <button
            type="button"
            onClick={resize.resetAll}
            className="shrink-0 rounded-md px-2 py-1 text-[11px] font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          >
            Sütun genişliklerini sıfırla
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <ResizableTable
          resize={resize}
          columnIds={columnIds}
          filler
          style={{ fontFamily: 'Inter' }}
        >
          <thead className={TABLE_HEAD}>
            <tr className="border-b border-slate-200">
              {headerColumns.map((column) => {
                if (column.sortable) {
                  return (
                    <ResizableTh
                      key={column.id}
                      resize={resize}
                      columnId={column.id}
                      label={column.label}
                      className={`text-left ${TABLE_HEAD_CELL}`}
                      aria-sort={
                        sortBy === 'remaining'
                          ? sortOrder === 'desc'
                            ? 'descending'
                            : 'ascending'
                          : 'none'
                      }
                    >
                      <button
                        type="button"
                        onClick={() => onSortChange?.()}
                        title="Kalan değerine göre sırala"
                        className={`inline-flex items-center gap-1 rounded-md px-1 py-0.5 transition hover:text-slate-700 ${
                          sortBy === 'remaining'
                            ? 'text-blue-600'
                            : 'text-slate-500'
                        }`}
                      >
                        Kalan
                        <FlaticonIcon
                          name={
                            sortBy === 'remaining'
                              ? `angle-${sortOrder === 'desc' ? 'down' : 'up'}`
                              : 'sort'
                          }
                          size="xs"
                        />
                      </button>
                    </ResizableTh>
                  );
                }

                return (
                  <ResizableTh
                    key={column.id}
                    resize={resize}
                    columnId={column.id}
                    label={column.label}
                    className={`${TABLE_HEAD_CELL} ${
                      column.align === 'right' ? 'text-right' : 'text-left'
                    }`}
                  >
                    {column.filter ? (
                      <ColumnFilterHeader
                        label={column.label}
                        filter={column.filter}
                        values={filters}
                        onChange={handleFilterChange}
                        align={column.align}
                      />
                    ) : (
                      column.label
                    )}
                  </ResizableTh>
                );
              })}

              <TableFillerTh />
            </tr>
          </thead>
          <tbody className={`divide-y divide-slate-100 ${TABLE_BODY}`}>
            {items.length === 0 && (
              <tr>
                <td colSpan={COLUMN_COUNT} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <WrenchScrewdriverIcon className="h-5 w-5" />
                    </span>
                    <p className="mt-3 text-sm font-semibold text-slate-900">
                      Sonuç bulunamadı
                    </p>
                    <p className="mt-1 text-[12px] text-slate-500">
                      {hasActiveFilters
                        ? 'Filtreleri değiştirin veya temizleyin'
                        : 'Bakım kaydı olan makine bulunmuyor'}
                    </p>
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={onResetFilters || onOpenFilters}
                        className="mt-3 rounded-md bg-blue-50 px-3 py-1.5 text-[12px] font-medium text-blue-600 transition hover:bg-blue-100"
                      >
                        Filtreleri temizle
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
            {items.map((item) => {
              const actionDisabled = !item.has_plan || !item.is_active;

              return (
                <tr key={item.machine_id} className={TABLE_ROW}>
                  <td className={`relative ${TABLE_CELL}`}>
                    {/* Satırın solunda durum şeridi: listeyi tararken renk
                        olmadan da gecikmiş makineler göze çarpar. */}
                    <span
                      aria-hidden="true"
                      className={`absolute inset-y-2.5 left-0 w-[3px] rounded-r-full ${
                        STATUS_ACCENT[item.status?.color] || STATUS_ACCENT.gray
                      }`}
                    />
                    <StatusBadge status={item.status} />
                  </td>

                  <td className={TABLE_CELL}>
                    <p className={TABLE_PRIMARY}>
                      {item.identification_no || `#${item.machine_id}`}
                    </p>
                    {item.plate_no && (
                      <span className="mt-1 inline-flex rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-slate-600">
                        {item.plate_no}
                      </span>
                    )}
                  </td>

                  <td className={`${TABLE_CELL} text-slate-600`}>
                    {item.territory_name || '—'}
                  </td>

                  <td className={TABLE_CELL}>
                    {item.type_name ? (
                      <span className="inline-flex max-w-full items-center truncate rounded-md bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600 ring-1 ring-inset ring-slate-200/80">
                        {item.type_name}
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>

                  <td className={TABLE_CELL}>
                    <p className="text-[12px] font-medium text-slate-800">
                      {item.car_mark_name || '—'}
                    </p>
                    {item.car_model_name && (
                      <p className={TABLE_MUTED}>{item.car_model_name}</p>
                    )}
                  </td>

                  <td className={TABLE_CELL}>
                    {item.has_plan ? (
                      <div className="flex flex-col gap-1">
                        <span
                          className={`text-[12px] font-medium text-slate-800 ${TABLE_NUM}`}
                        >
                          {formatNumber(item.interval_value)}{' '}
                          <span className="text-[11px] font-normal text-slate-400">
                            {unitLabel(item.usage_unit)}
                          </span>
                        </span>
                        {!item.is_active && (
                          <span className="inline-flex w-fit rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                            Pasif plan
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-300">Plan yok</span>
                    )}
                  </td>

                  <td className={TABLE_CELL}>
                    <p className={`text-slate-700 ${TABLE_NUM}`}>
                      {formatDate(item.last_maintenance_date)}
                    </p>
                    {item.has_plan && item.last_counter !== null && (
                      <p className={`${TABLE_MUTED} ${TABLE_NUM}`}>
                        {formatCounter(item.last_counter, item.usage_unit)}
                      </p>
                    )}
                  </td>

                  <td className={TABLE_CELL}>
                    <CounterCell item={item} />
                  </td>

                  <td className={TABLE_CELL}>
                    <RemainingCell item={item} />
                  </td>

                  <td className={`${TABLE_CELL} text-right`}>
                    <div className="inline-flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm">
                      <ActionButton
                        title={item.has_plan ? 'Planı düzenle' : 'Plan oluştur'}
                        onClick={() => onEditPlan(item)}
                        tone="blue"
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                      </ActionButton>

                      <ActionButton
                        title={
                          actionDisabled
                            ? 'Sayaç kaydı için aktif plan gerekli'
                            : 'Sayaç kaydı ekle'
                        }
                        onClick={() => onReading(item)}
                        disabled={actionDisabled}
                        tone="amber"
                      >
                        <PlusCircleIcon className="h-4 w-4" />
                      </ActionButton>

                      <ActionButton
                        title={
                          actionDisabled
                            ? 'Bakım tamamlamak için aktif plan gerekli'
                            : 'Bakımı tamamla'
                        }
                        onClick={() => onComplete(item)}
                        disabled={actionDisabled}
                        tone="green"
                      >
                        <CheckCircleIcon className="h-4 w-4" />
                      </ActionButton>

                      <ActionButton
                        title="Bakım geçmişi"
                        onClick={() => onHistory(item)}
                        tone="gray"
                      >
                        <ClockIcon className="h-4 w-4" />
                      </ActionButton>
                    </div>
                  </td>

                  <TableFillerTd />
                </tr>
              );
            })}
          </tbody>
        </ResizableTable>
      </div>
    </div>
  );
}

