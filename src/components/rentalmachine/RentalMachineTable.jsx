// src/components/rentalmachine/RentalMachineTable.jsx
import {
  ArrowPathIcon,
  PencilSquareIcon,
  TrashIcon,
  TruckIcon,
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
  TABLE_PRIMARY,
  TABLE_ROW,
  TABLE_TERTIARY,
  TABLE_TOOLBAR,
} from '../ui/tableStyles';
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
  equipment: 240,
  company: 190,
  site: 170,
  start_date: 110,
  end_date: 110,
  duration: 90,
  status: 140,
  actions: 90,
};

const COLUMN_IDS = Object.keys(RENTAL_COLUMN_WIDTHS);

//: 8 görünür sütun + kalan alanı emen dolgu sütunu (boş durum satırı için).
const COLUMN_COUNT = 9;

const EMPTY_TEXT =
  'Ekipman tanımı, firma veya şantiye ile arama yapabilirsiniz';

const HEADER_COLUMNS = [
  ['equipment', 'Ekipman Tanımı'],
  ['company', 'Firma'],
  ['site', 'Şantiye'],
  ['start_date', 'Başlangıç'],
  ['end_date', 'Bitiş'],
  ['duration', 'Süre'],
  ['status', 'Durum'],
  ['actions', 'İşlemler'],
];

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
  const resize = useColumnResize('rental-machines:list', RENTAL_COLUMN_WIDTHS);

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
              {HEADER_COLUMNS.map(([id, label]) => (
                <ResizableTh
                  key={id}
                  resize={resize}
                  columnId={id}
                  label={label}
                  className={`text-left ${TABLE_HEAD_CELL}`}
                >
                  {label}
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
                    <p
                      className={`truncate ${TABLE_PRIMARY}`}
                      title={item.equipment_name}
                    >
                      {item.equipment_name}
                    </p>
                    {item.created_by_name && (
                      <p className={`truncate ${TABLE_TERTIARY}`}>
                        {item.created_by_name}
                      </p>
                    )}
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
