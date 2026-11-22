// src/components/rentalmachine/RentalMachineTable.jsx
import {
  ArrowPathIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

import ResizableTable, { ResizableTh } from '../ui/ResizableTable';
import useColumnResize from '../ui/useColumnResize';
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
    STATUS_BADGE[item.status] || 'border-gray-200 bg-gray-50 text-gray-600';

  return (
    <div className="min-w-0">
      <span
        className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${className}`}
      >
        {item.status_label || item.status || '—'}
      </span>
      <p className="mt-1 truncate text-[11px] text-gray-500">
        {remainingText(item) || '—'}
      </p>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="divide-y divide-gray-100">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex gap-4 px-6 py-3">
          <div className="h-5 w-40 animate-pulse rounded bg-gray-100" />
          <div className="h-5 w-32 animate-pulse rounded bg-gray-100" />
          <div className="h-5 w-28 animate-pulse rounded bg-gray-100" />
          <div className="h-5 flex-1 animate-pulse rounded bg-gray-100" />
          <div className="h-5 w-24 animate-pulse rounded-full bg-gray-100" />
        </div>
      ))}
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
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <Skeleton />
      </div>
    );
  }

  if (!loading && items.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
        <p className="text-sm font-medium text-gray-900">Sonuç bulunamadı</p>
        <p className="mt-1 text-sm text-gray-500">
          {hasActiveFilters
            ? 'Filtreleri değiştirin veya temizleyin'
            : 'Henüz kiralık makine kaydı bulunmuyor'}
        </p>
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={onResetFilters}
            className="mt-3 text-sm font-medium text-blue-600 hover:underline"
          >
            Filtreleri temizle
          </button>
        ) : (
          <p className="mt-2 text-xs text-gray-400">{EMPTY_TEXT}</p>
        )}
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
          columnIds={COLUMN_IDS}
          style={{ fontFamily: 'Inter' }}
        >
          <thead className="bg-gray-100 text-[11px] uppercase text-gray-700">
            <tr>
              {HEADER_COLUMNS.map(([id, label]) => (
                <ResizableTh
                  key={id}
                  resize={resize}
                  columnId={id}
                  label={label}
                  className="px-4 py-2.5 text-left font-medium"
                >
                  {label}
                </ResizableTh>
              ))}
            </tr>
          </thead>

          <tbody className="text-sm text-gray-800">
            {items.map((item) => {
              const deleting = deletingId === item.id;

              return (
                <tr
                  key={item.id}
                  className="border-t border-gray-100 align-top hover:bg-gray-50"
                >
                  <td className="px-4 py-2.5">
                    <p
                      className="truncate text-[13px] font-medium text-gray-900"
                      title={item.equipment_name}
                    >
                      {item.equipment_name}
                    </p>
                    {item.created_by_name && (
                      <p className="truncate text-[11px] text-gray-400">
                        {item.created_by_name}
                      </p>
                    )}
                  </td>

                  <td className="px-4 py-2.5 text-[12px] text-gray-700">
                    <p className="truncate" title={item.company_name || ''}>
                      {item.company_name || '—'}
                    </p>
                  </td>

                  <td className="px-4 py-2.5 text-[12px] text-gray-700">
                    <p className="truncate" title={item.site_name || ''}>
                      {item.site_name || '—'}
                    </p>
                  </td>

                  <td className="whitespace-nowrap px-4 py-2.5 text-[12px] text-gray-700">
                    {formatDate(item.start_date)}
                  </td>

                  <td className="whitespace-nowrap px-4 py-2.5 text-[12px] text-gray-700">
                    {formatDate(item.end_date)}
                  </td>

                  <td className="whitespace-nowrap px-4 py-2.5 text-[12px] text-gray-500">
                    {item.duration_days ? `${item.duration_days} gün` : '—'}
                  </td>

                  <td className="px-4 py-2.5">
                    <StatusBadge item={item} />
                  </td>

                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        title="Düzenle"
                        aria-label={`${item.equipment_name} düzenle`}
                        className="rounded-lg p-1.5 text-gray-500 transition hover:bg-blue-50 hover:text-blue-700"
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDelete(item)}
                        disabled={deleting}
                        title="Sil"
                        aria-label={`${item.equipment_name} sil`}
                        className="rounded-lg p-1.5 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {deleting ? (
                          <ArrowPathIcon className="h-4 w-4 animate-spin" />
                        ) : (
                          <TrashIcon className="h-4 w-4" />
                        )}
                      </button>
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
