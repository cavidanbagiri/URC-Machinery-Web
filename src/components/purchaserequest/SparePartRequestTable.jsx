// src/components/purchaserequest/SparePartRequestTable.jsx
import { useDispatch, useSelector } from 'react-redux';
import { ArrowPathIcon, EyeIcon, TrashIcon } from '@heroicons/react/24/outline';

import { ColumnFilterHeader } from '../ui/ColumnFilter';
import { formatDate } from '../../utils/repair';
import { setSpareFilter } from '../../stores/purchase_request_slice';
import {
  SPARE_STATUS_LABELS,
  nextSpareStatus,
  spareStatusBadgeClass,
  spareStatusLabel,
} from '../../utils/purchaseRequest';

const COLUMN_COUNT = 8;

const STATUS_OPTIONS = Object.entries(SPARE_STATUS_LABELS).map(
  ([value, label]) => ({ value, label })
);

function MachineLabels({ labels = [] }) {
  if (labels.length === 0) return <span className="text-gray-400">—</span>;

  const [first, ...rest] = labels;

  return (
    <div className="flex flex-wrap items-center gap-1">
      <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-700">
        {first}
      </span>
      {rest.length > 0 && (
        <span
          className="rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700"
          title={labels.join(', ')}
        >
          +{rest.length}
        </span>
      )}
    </div>
  );
}

function StatusButton({ item, busy, onToggleStatus }) {
  const busyHere = busy?.scope === 'spareParts' && busy?.id === item.id;

  return (
    <button
      type="button"
      onClick={() => onToggleStatus(item, nextSpareStatus(item.status))}
      disabled={busyHere}
      title={
        item.status === 'geldi'
          ? 'Bekleniyor olarak işaretle'
          : 'Geldi olarak işaretle'
      }
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60 ${spareStatusBadgeClass(
        item.status
      )}`}
    >
      {busyHere ? (
        <ArrowPathIcon className="h-3 w-3 animate-spin" />
      ) : (
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
      )}
      {spareStatusLabel(item.status)}
    </button>
  );
}

function Skeleton() {
  return (
    <div className="divide-y divide-gray-100">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex gap-4 px-6 py-3">
          <div className="h-5 w-40 animate-pulse rounded bg-gray-100" />
          <div className="h-5 w-24 animate-pulse rounded bg-gray-100" />
          <div className="h-5 w-24 animate-pulse rounded bg-gray-100" />
          <div className="h-5 flex-1 animate-pulse rounded bg-gray-100" />
          <div className="h-5 w-20 animate-pulse rounded-full bg-gray-100" />
        </div>
      ))}
    </div>
  );
}

export default function SparePartRequestTable({
  items,
  loading,
  hasActiveFilters,
  onResetFilters,
  onOpenDetail,
  onToggleStatus,
  onDelete,
  rowBusy,
}) {
  const dispatch = useDispatch();
  const filters = useSelector((s) => s.purchaseRequest.spareParts.filters);
  const requestTypes = useSelector((s) => s.purchaseRequest.requestTypes.items);
  const territories = useSelector((s) => s.lookup.data.territory || []);

  const handleFilterChange = (key, value) => {
    dispatch(setSpareFilter({ key, value }));
  };

  // Kolon başlıkları — `filter` taşıyan başlıklar Excel tarzı açılır filtre alır.
  const headerColumns = [
    {
      label: 'Talep',
      filter: { kind: 'text', key: 'search', placeholder: 'Başlık / STF no' },
    },
    {
      label: 'ID No',
      filter: {
        kind: 'text',
        key: 'identification_no',
        placeholder: 'Kimlik no',
      },
    },
    {
      label: 'Bölge',
      filter: { kind: 'select', key: 'territory_id', options: territories },
    },
    {
      label: 'Talep Türü',
      filter: {
        kind: 'select',
        key: 'request_type_id',
        options: requestTypes,
      },
    },
    { label: 'Parça' },
    {
      label: 'Tarih',
      filter: { kind: 'dateRange', keys: ['date_from', 'date_to'] },
    },
    {
      label: 'Durum',
      filter: { kind: 'select', key: 'status', options: STATUS_OPTIONS },
    },
    { label: 'İşlem', align: 'right' },
  ];

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
        <table className="w-full" style={{ fontFamily: 'Inter' }}>
          <thead className="bg-gray-100 text-[11px] uppercase text-gray-700">
            <tr>
              {headerColumns.map((column) => (
                <th
                  key={column.label}
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
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="text-sm text-gray-800">
            {items.length === 0 && (
              <tr>
                <td colSpan={COLUMN_COUNT} className="px-4 py-12 text-center">
                  <p className="text-sm font-medium text-gray-900">
                    Sonuç bulunamadı
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {hasActiveFilters
                      ? 'Filtreleri değiştirin veya temizleyin'
                      : 'Henüz yedek parça talebi bulunmuyor'}
                  </p>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={onResetFilters}
                      className="mt-3 text-sm font-medium text-blue-600 hover:underline"
                    >
                      Filtreleri temizle
                    </button>
                  )}
                </td>
              </tr>
            )}
            {items.map((item) => {
              const deleting =
                rowBusy?.scope === 'spareParts' &&
                rowBusy?.id === item.id &&
                rowBusy?.action === 'delete';

              return (
                <tr
                  key={item.id}
                  className="border-t border-gray-100 align-top hover:bg-gray-50"
                >
                  <td className="px-4 py-2.5">
                    <p className="text-[13px] font-medium text-gray-900">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      STF/HTF: {item.stf_htf_no}
                    </p>
                  </td>

                  <td className="px-4 py-2.5">
                    <MachineLabels labels={item.machine_labels} />
                  </td>

                  <td className="whitespace-nowrap px-4 py-2.5 text-[12px] text-gray-700">
                    {item.territory_name || '—'}
                  </td>

                  <td className="whitespace-nowrap px-4 py-2.5">
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                      {item.request_type_name || '—'}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-4 py-2.5 text-[12px] text-gray-700">
                    {item.item_count} kalem
                  </td>

                  <td className="whitespace-nowrap px-4 py-2.5 text-[12px] text-gray-700">
                    {formatDate(item.request_date)}
                  </td>

                  <td className="whitespace-nowrap px-4 py-2.5">
                    <StatusButton
                      item={item}
                      busy={rowBusy}
                      onToggleStatus={onToggleStatus}
                    />
                  </td>

                  <td className="whitespace-nowrap px-4 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onOpenDetail(item)}
                        title="Talebi görüntüle"
                        aria-label={`${item.title} talebini görüntüle`}
                        className="rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(item)}
                        disabled={deleting}
                        title="Talebi sil"
                        aria-label={`${item.title} talebini sil`}
                        className="rounded-lg p-1.5 text-red-600 transition hover:bg-red-50 disabled:opacity-40"
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
        </table>
      </div>
    </div>
  );
}
