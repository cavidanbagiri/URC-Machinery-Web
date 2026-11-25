// src/components/rentalmachine/RentalMachineTable.jsx
import { useDispatch, useSelector } from 'react-redux';
import {
  ArrowPathIcon,
  PencilSquareIcon,
  TrashIcon,
  TruckIcon,
} from '@heroicons/react/24/outline';

import { ColumnFilterHeader } from '../ui/ColumnFilter';
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
  TABLE_PRIMARY,
  TABLE_ROW,
  TABLE_TERTIARY,
  TABLE_TOOLBAR,
} from '../ui/tableStyles';
import {
  RENTAL_STATUS_OPTIONS,
  setFilter,
} from '../../stores/rental_machine_slice';
import { formatDate } from '../../utils/repair';

//: Status badge colours; the code comes from the backend (derived from dates).
const STATUS_BADGE = {
  aktif: 'border-emerald-100 bg-emerald-50 text-emerald-700',
  planlandi: 'border-blue-100 bg-blue-50 text-blue-700',
  suresi_doldu: 'border-red-100 bg-red-50 text-red-700',
};

// Kullanıcı başlıktaki tutamaçtan sürükleyerek değiştirir; seçim tarayıcıda
// saklanır (useColumnResize).
const RENTAL_COLUMN_WIDTHS = {
  machine_type: 150,
  car_mark: 120,
  car_model: 130,
  plate: 120,
  company: 180,
  site: 160,
  start_date: 120,
  end_date: 120,
  duration: 90,
  status: 140,
  actions: 90,
};

const COLUMN_IDS = Object.keys(RENTAL_COLUMN_WIDTHS);

//: 11 görünür sütun + kalan alanı emen dolgu sütunu (boş durum satırı için).
const COLUMN_COUNT = 12;

const EMPTY_TEXT =
  'Tip, marka, model, plaka, firma veya şantiye ile arama yapabilirsiniz';

/**
 * Sütun tanımları: başlık metni + Excel tarzı başlık filtresi. `filter`
 * olmayan sütunlar (süre, işlemler) düz başlık olarak çizilir.
 *
 * `lookups` redux'taki `{ type_transport: [...], car_mark: [...] }` nesnesidir;
 * seçenek listeleri `ColumnFilterHeader`'a `[{ id, name }]` olarak geçer.
 */
function buildHeaderColumns(lookups) {
  return [
    {
      id: 'machine_type',
      label: 'Makine Tipi',
      filter: {
        kind: 'select',
        key: 'machine_type_id',
        options: lookups.type_transport || [],
      },
    },
    {
      id: 'car_mark',
      label: 'Marka',
      filter: {
        kind: 'select',
        key: 'car_mark_id',
        options: lookups.car_mark || [],
      },
    },
    {
      id: 'car_model',
      label: 'Model',
      filter: {
        kind: 'select',
        key: 'car_model_id',
        options: lookups.car_model || [],
      },
    },
    {
      id: 'plate',
      label: 'Plaka',
      filter: {
        kind: 'text',
        key: 'plate',
        placeholder: 'Plaka içerir...',
        hint: 'Plakada geçen kayıtlar',
      },
    },
    {
      id: 'company',
      label: 'Firma',
      filter: {
        kind: 'text',
        key: 'company',
        placeholder: 'Firma içerir...',
        hint: 'Firma adında geçen kayıtlar',
      },
    },
    {
      id: 'site',
      label: 'Şantiye',
      filter: {
        kind: 'text',
        key: 'site',
        placeholder: 'Şantiye içerir...',
        hint: 'Şantiye adında geçen kayıtlar',
      },
    },
    {
      id: 'start_date',
      label: 'Başlangıç',
      filter: { kind: 'dateRange', keys: ['start_from', 'start_to'] },
    },
    {
      id: 'end_date',
      label: 'Bitiş',
      filter: { kind: 'dateRange', keys: ['end_from', 'end_to'] },
    },
    { id: 'duration', label: 'Süre' },
    {
      id: 'status',
      label: 'Durum',
      filter: {
        kind: 'select',
        key: 'status',
        options: RENTAL_STATUS_OPTIONS.map((option) => ({
          value: option.code,
          label: option.label,
        })),
      },
    },
    { id: 'actions', label: 'İşlemler', align: 'right' },
  ];
}


/**
 * "Kalan" alt satırı: bitmiş kiralamada kaç gün önce bittiğini, aktif olanda
 * kaç gün kaldığını yazar. Durum rozetiyle aynı `days_remaining` alanını
 * kullanır, böylece ikisi hiçbir zaman çelişmez.
 */
function remainingText(item) {
  const days = item.days_remaining;
  if (days === null || days === undefined) return null;
  if (days < 0) return `${Math.abs(days)} gün önce bitti`;
  if (days === 0) return 'Bugün bitiyor';
  return `${days} gün kaldı`;
}

function StatusBadge({ item }) {
  const className =
    STATUS_BADGE[item.status] || 'border-slate-200 bg-slate-50 text-slate-600';

  return (
    <div className="min-w-0">
      <span
        className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${className}`}
      >
        {item.status_label || item.status || '—'}
      </span>
      <p className={`mt-1 truncate ${TABLE_TERTIARY}`}>
        {remainingText(item) || '—'}
      </p>
    </div>
  );
}

function Skeleton() {
  return (
    <div>
      <div className="flex items-center gap-4 border-b border-slate-100 bg-slate-50/90 px-4 py-3">
        <div className="h-2.5 w-16 animate-pulse rounded bg-slate-200/80" />
        <div className="h-2.5 w-14 animate-pulse rounded bg-slate-200/80" />
        <div className="h-2.5 w-12 animate-pulse rounded bg-slate-200/80" />
        <div className="h-2.5 flex-1 animate-pulse rounded bg-slate-200/80" />
        <div className="h-2.5 w-14 animate-pulse rounded bg-slate-200/80" />
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex items-center gap-4 px-4 py-3">
            <div className="h-3 w-40 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-32 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-28 animate-pulse rounded bg-slate-100" />
            <div className="h-3 flex-1 animate-pulse rounded bg-slate-100" />
            <div className="h-5 w-24 animate-pulse rounded-full bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RentalMachineTable({
  items,
  loading,
  hasActiveFilters,
  onResetFilters,
  onEdit,
  onDelete,
  deletingId,
}) {
  const dispatch = useDispatch();
  const filters = useSelector((s) => s.rentalMachine.filters);
  const lookups = useSelector((s) => s.lookup.data);
  const resize = useColumnResize('rental-machines:list', RENTAL_COLUMN_WIDTHS);

  const headerColumns = buildHeaderColumns(lookups);

  // Başlık filtresi redux'a yazar; sayfanın debounce'lu fetch'i aynen çalışır.
  const handleFilterChange = (key, value) =>
    dispatch(setFilter({ key, value }));

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
            <TruckIcon className="h-3.5 w-3.5" />
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Kiralık Makineler
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
          columnIds={COLUMN_IDS}
          filler
          style={{ fontFamily: 'Inter' }}
        >
          <thead className={TABLE_HEAD}>
            <tr className="border-b border-slate-200">
              {headerColumns.map((column) => (
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
              ))}

              <TableFillerTh />
            </tr>
          </thead>

          <tbody className={`divide-y divide-slate-100 ${TABLE_BODY}`}>
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={COLUMN_COUNT} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <TruckIcon className="h-5 w-5" />
                    </span>
                    <p className="mt-3 text-sm font-semibold text-slate-900">
                      Sonuç bulunamadı
                    </p>
                    <p className="mt-1 text-[12px] text-slate-500">
                      {hasActiveFilters
                        ? 'Filtreleri değiştirin veya temizleyin'
                        : 'Henüz kiralık makine kaydı bulunmuyor'}
                    </p>
                    {hasActiveFilters ? (
                      <button
                        type="button"
                        onClick={onResetFilters}
                        className="mt-3 rounded-md bg-blue-50 px-3 py-1.5 text-[12px] font-medium text-blue-600 transition hover:bg-blue-100"
                      >
                        Filtreleri temizle
                      </button>
                    ) : (
                      <p className="mt-1 max-w-md text-[11px] text-slate-400">
                        {EMPTY_TEXT}
                      </p>
                    )}
                  </div>
                </td>
              </tr>
            )}

            {items.map((item) => {
              const deleting = deletingId === item.id;

              return (
                <tr key={item.id} className={`${TABLE_ROW} align-top`}>
                  <td className={TABLE_CELL}>
                    {/* Eski kayıtlarda tip/marka/model/plaka boştur; o satırlar
                        düzenlenene kadar elle yazılmış ekipman adı gösterilir. */}
                    <p
                      className={`truncate ${TABLE_PRIMARY}`}
                      title={item.equipment_name}
                    >
                      {item.machine_type_name || item.equipment_name || '—'}
                    </p>
                    {item.created_by_name && (
                      <p className={`truncate ${TABLE_TERTIARY}`}>
                        {item.created_by_name}
                      </p>
                    )}
                  </td>

                  <td className={TABLE_CELL}>
                    <p className="truncate" title={item.car_mark_name || ''}>
                      {item.car_mark_name || '—'}
                    </p>
                  </td>

                  <td className={TABLE_CELL}>
                    <p className="truncate" title={item.car_model_name || ''}>
                      {item.car_model_name || '—'}
                    </p>
                  </td>

                  <td className={TABLE_CELL}>
                    <p
                      className="truncate tabular-nums"
                      title={item.plate_no || ''}
                    >
                      {item.plate_no || '—'}
                    </p>
                  </td>

                  <td className={TABLE_CELL}>
                    <p className="truncate" title={item.company_name || ''}>
                      {item.company_name || '—'}
                    </p>
                  </td>

                  <td className={TABLE_CELL}>
                    <p className="truncate" title={item.site_name || ''}>
                      {item.site_name || '—'}
                    </p>
                  </td>

                  <td className={TABLE_CELL}>
                    {formatDate(item.start_date)}
                  </td>

                  <td className={TABLE_CELL}>
                    {formatDate(item.end_date)}
                  </td>

                  <td className={`${TABLE_CELL} tabular-nums`}>
                    {item.duration_days ? `${item.duration_days} gün` : '—'}
                  </td>

                  <td className={TABLE_CELL}>
                    <StatusBadge item={item} />
                  </td>

                  <td className={TABLE_CELL}>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        title="Düzenle"
                        aria-label={`${item.equipment_name} düzenle`}
                        className="rounded-md p-1.5 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDelete(item)}
                        disabled={deleting}
                        title="Sil"
                        aria-label={`${item.equipment_name} sil`}
                        className="rounded-md p-1.5 text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {deleting ? (
                          <ArrowPathIcon className="h-4 w-4 animate-spin" />
                        ) : (
                          <TrashIcon className="h-4 w-4" />
                        )}
                      </button>
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
