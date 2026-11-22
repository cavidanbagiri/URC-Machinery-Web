// src/components/maintenance/MaintenanceTable.jsx
import { useDispatch, useSelector } from 'react-redux';
import {
  CheckCircleIcon,
  ClockIcon,
  PencilSquareIcon,
  PlusCircleIcon,
} from '@heroicons/react/24/outline';

import FlaticonIcon from '../ui/FlaticonIcon';
import { ColumnFilterHeader } from '../ui/ColumnFilter';
import ResizableTable, { ResizableTh } from '../ui/ResizableTable';
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

const COLUMN_COUNT = 10;

// Sütunların başlangıç genişlikleri (px). Kullanıcı başlıktaki tutamaçtan
// sürükleyerek değiştirir; seçim tarayıcıda saklanır (useColumnResize).
const MAINTENANCE_COLUMN_WIDTHS = {
  status: 130,
  machine: 230,
  territory: 130,
  type: 150,
  mark_model: 190,
  has_plan: 140,
  last_service: 140,
  current_counter: 170,
  remaining: 140,
  actions: 170,
};

const HAS_PLAN_OPTIONS = [
  { value: 'true', label: 'Planlı' },
  { value: 'false', label: 'Plan yok' },
];

function ActionButton({ title, onClick, disabled, tone = 'blue', children }) {
  const tones = {
    blue: 'text-blue-600 hover:bg-blue-50',
    green: 'text-emerald-600 hover:bg-emerald-50',
    gray: 'text-gray-500 hover:bg-gray-100',
    amber: 'text-amber-600 hover:bg-amber-50',
  };

  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg p-1.5 transition disabled:cursor-not-allowed disabled:opacity-30 ${
        tones[tone] || tones.blue
      }`}
    >
      {children}
    </button>
  );
}

function Skeleton() {
  return (
    <div className="divide-y divide-gray-100">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex gap-4 px-6 py-3">
          <div className="h-5 w-20 animate-pulse rounded-full bg-gray-100" />
          <div className="h-5 w-28 animate-pulse rounded bg-gray-100" />
          <div className="h-5 w-24 animate-pulse rounded bg-gray-100" />
          <div className="h-5 flex-1 animate-pulse rounded bg-gray-100" />
          <div className="h-5 w-24 animate-pulse rounded bg-gray-100" />
        </div>
      ))}
    </div>
  );
}

function remainingClass(remaining, threshold, statusCode) {
  if (statusCode === 'veri_eksik' || statusCode === 'plan_yok') {
    return 'text-gray-400';
  }
  if (statusCode === 'veri_uyarisi') return 'font-medium text-orange-600';
  if (statusCode === 'pasif') return 'text-slate-500';
  if (remaining === null || remaining === undefined) return 'text-gray-400';
  if (remaining <= 0) return 'font-semibold text-red-600';
  if (threshold !== null && threshold !== undefined && remaining <= threshold) {
    return 'font-semibold text-amber-600';
  }
  return 'text-gray-700';
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
        className="inline-flex flex-col"
        title={`Güncel KM ve Motor Saatleri kaydı${
          item.meter_log_date ? ` (${formatDate(item.meter_log_date)})` : ''
        }`}
      >
        <span className="font-medium text-gray-900">
          {formatCounter(item.meter_km, 'km')}
        </span>
        <span className="text-gray-600">
          {formatCounter(item.meter_engine_hours, 'hour')}
        </span>
        {item.meter_log_date && (
          <span className="text-[11px] text-gray-400">
            {formatDate(item.meter_log_date)}
          </span>
        )}
      </span>
    );
  }

  if (item.has_plan && isNumber(item.current_counter)) {
    return (
      <span
        className="inline-flex flex-col"
        title="Plan sayacı (güncel KM / saat kaydı yok veya plan sayacı daha yeni)"
      >
        <span className="font-medium text-gray-900">
          {formatCounter(item.current_counter, item.usage_unit)}
        </span>
        {item.current_counter_date && (
          <span className="text-[11px] text-gray-400">
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
        className="inline-flex flex-col"
        title="Güncel KM ve Motor Saatleri kaydı"
      >
        <span className="text-gray-700">{formatCounter(item.meter_km, 'km')}</span>
        <span className="text-gray-500">
          {formatCounter(item.meter_engine_hours, 'hour')}
        </span>
      </span>
    );
  }

  return <span className="text-gray-400">—</span>;
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
  // genişlikler tarayıcıda saklanır.
  const resize = useColumnResize('maintenance:list', MAINTENANCE_COLUMN_WIDTHS);
  const columnIds = headerColumns.map((column) => column.id);

  if (loading && items.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <Skeleton />
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

      <div className="overflow-x-auto">
        <ResizableTable
          resize={resize}
          columnIds={columnIds}
          style={{ fontFamily: 'Inter' }}
        >
          <thead className="bg-gray-100 text-[11px] uppercase text-gray-700">
            <tr>
              {headerColumns.map((column) => {
                if (column.sortable) {
                  return (
                    <ResizableTh
                      key={column.id}
                      resize={resize}
                      columnId={column.id}
                      label={column.label}
                      className="px-4 py-2.5 text-left font-medium"
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
                        className={`inline-flex items-center gap-1 rounded transition hover:text-blue-700 ${
                          sortBy === 'remaining' ? 'text-blue-700' : ''
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
                    className={`px-4 py-2.5 font-medium ${
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
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.length === 0 && (
              <tr>
                <td colSpan={COLUMN_COUNT} className="px-4 py-12 text-center">
                  <p className="text-sm font-medium text-gray-900">
                    Sonuç bulunamadı
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {hasActiveFilters
                      ? 'Filtreleri değiştirin veya temizleyin'
                      : 'Bakım kaydı olan makine bulunmuyor'}
                  </p>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={onResetFilters || onOpenFilters}
                      className="mt-3 text-sm font-medium text-blue-600 hover:underline"
                    >
                      Filtreleri temizle
                    </button>
                  )}
                </td>
              </tr>
            )}
            {items.map((item) => {
              const actionDisabled = !item.has_plan || !item.is_active;

              return (
                <tr key={item.machine_id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-2.5">
                    <StatusBadge status={item.status} />
                  </td>

                  <td className="whitespace-nowrap px-4 py-2.5">
                    <p className="text-[12px] font-medium text-gray-900">
                      {item.identification_no || `#${item.machine_id}`}
                    </p>
                    {item.plate_no && (
                      <p className="text-[11px] text-gray-500">{item.plate_no}</p>
                    )}
                  </td>

                  <td className="whitespace-nowrap px-4 py-2.5 text-[12px] text-gray-700">
                    {item.territory_name || '—'}
                  </td>

                  <td className="whitespace-nowrap px-4 py-2.5 text-[12px] text-gray-700">
                    {item.type_name || '—'}
                  </td>

                  <td className="whitespace-nowrap px-4 py-2.5 text-[12px] text-gray-700">
                    <p>{item.car_mark_name || '—'}</p>
                    {item.car_model_name && (
                      <p className="text-[11px] text-gray-500">
                        {item.car_model_name}
                      </p>
                    )}
                  </td>

                  <td className="whitespace-nowrap px-4 py-2.5 text-[12px] text-gray-700">
                    {item.has_plan ? (
                      <span className="inline-flex flex-col">
                        <span>
                          {formatNumber(item.interval_value)}{' '}
                          {unitLabel(item.usage_unit)}
                        </span>
                        {!item.is_active && (
                          <span className="text-[11px] text-slate-500">
                            Pasif plan
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-gray-400">Plan yok</span>
                    )}
                  </td>

                  <td className="whitespace-nowrap px-4 py-2.5 text-[12px] text-gray-700">
                    <p>{formatDate(item.last_maintenance_date)}</p>
                    {item.has_plan && item.last_counter !== null && (
                      <p className="text-[11px] text-gray-500">
                        {formatCounter(item.last_counter, item.usage_unit)}
                      </p>
                    )}
                  </td>

                  <td className="whitespace-nowrap px-4 py-2.5 text-[12px] text-gray-700">
                    <CounterCell item={item} />
                  </td>

                  <td
                    className={`whitespace-nowrap px-4 py-2.5 text-[12px] ${remainingClass(
                      item.remaining,
                      item.effective_warning_threshold,
                      item.status?.code
                    )}`}
                  >
                    {!item.has_plan
                      ? '—'
                      : item.status?.code === 'veri_uyarisi'
                        ? 'Kontrol gerekli'
                        : formatCounter(item.remaining, item.usage_unit)}
                    {item.next_counter !== null &&
                      item.next_counter !== undefined && (
                        <p className="text-[11px] font-normal text-gray-400">
                          Sonraki:{' '}
                          {formatCounter(item.next_counter, item.usage_unit)}
                        </p>
                      )}
                  </td>

                  <td className="whitespace-nowrap px-4 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
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
                </tr>
              );
            })}
          </tbody>
        </ResizableTable>
      </div>
    </div>
  );
}

