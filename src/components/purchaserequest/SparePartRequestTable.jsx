// src/components/purchaserequest/SparePartRequestTable.jsx
import { Fragment, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  EyeIcon,
  PaperClipIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

import { ColumnFilterHeader } from '../ui/ColumnFilter';
import ColumnVisibilityMenu from '../ui/ColumnVisibilityMenu';
import useColumnVisibility from '../ui/useColumnVisibility';
import { formatDate } from '../../utils/repair';
import { setSpareFilter } from '../../stores/purchase_request_slice';
import {
  SPARE_STATUS_LABELS,
  SPARE_STATUSES,
  formatQuantity,
  spareArrivalBadgeClass,
  spareArrivalLabel,
  spareItemMachineLabel,
  spareStatusBadgeClass,
} from '../../utils/purchaseRequest';

const STATUS_OPTIONS = SPARE_STATUSES.map((value) => ({
  value,
  label: SPARE_STATUS_LABELS[value],
}));

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

function StatusSelect({ item, busy, onChangeStatus }) {
  const busyHere =
    busy?.scope === 'spareParts' &&
    busy?.id === item.id &&
    busy?.action === 'status';

  return (
    <div className="relative inline-flex items-center">
      <select
        value={item.status}
        disabled={busyHere}
        onChange={(event) => onChangeStatus(item, event.target.value)}
        onClick={(event) => event.stopPropagation()}
        title="Talep durumunu değiştir"
        aria-label={`${item.title} durumunu değiştir`}
        className={`cursor-pointer appearance-none rounded-full border py-0.5 pl-2.5 pr-6 text-[11px] font-medium transition hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60 ${spareStatusBadgeClass(
          item.status
        )}`}
      >
        {STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {busyHere ? (
        <ArrowPathIcon className="pointer-events-none absolute right-1.5 h-3 w-3 animate-spin" />
      ) : (
        <ChevronDownIcon className="pointer-events-none absolute right-1.5 h-3 w-3" />
      )}
    </div>
  );
}

/**
 * The sub-table under an expanded request: every part row with its own
 * "Geldi / Gelmedi" button, so one order can be three arrived out of six.
 */
function ItemRows({ request, busy, onToggleArrival }) {
  const items = request.items || [];

  if (items.length === 0) {
    return (
      <p className="px-4 py-3 text-[12px] text-gray-500">
        Bu talepte parça satırı yok.
      </p>
    );
  }

  return (
    <div className="border-y border-gray-100 bg-gray-50/70 px-4 py-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
          Parça Kalemleri · {request.arrived_count ?? 0}/{items.length} geldi
        </p>
        <p className="text-[11px] text-gray-400">
          Gelen kalemi işaretlemek için satırdaki durum düğmesine tıklayın
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full">
          <thead className="bg-gray-50 text-[10px] uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-3 py-1.5 text-left font-medium">ID No</th>
              <th className="px-3 py-1.5 text-left font-medium">Garaj No</th>
              <th className="px-3 py-1.5 text-left font-medium">Parça No</th>
              <th className="px-3 py-1.5 text-left font-medium">Açıklama (TR)</th>
              <th className="px-3 py-1.5 text-left font-medium">Açıklama (RU)</th>
              <th className="px-3 py-1.5 text-right font-medium">Miktar</th>
              <th className="px-3 py-1.5 text-left font-medium">Tedarik</th>
              <th className="px-3 py-1.5 text-right font-medium">Durum</th>
            </tr>
          </thead>
          <tbody className="text-[12px] text-gray-800">
            {items.map((item) => {
              const busyItem =
                busy?.scope === 'spareParts' &&
                busy?.id === request.id &&
                busy?.action === 'arrival' &&
                busy?.itemId === item.id;

              return (
                <tr key={item.id} className="border-t border-gray-100">
                  <td className="whitespace-nowrap px-3 py-1.5 font-medium">
                    {spareItemMachineLabel(item) || '—'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-1.5 text-gray-600">
                    {item.garage_request_no || '—'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-1.5 text-gray-600">
                    {item.part_number || '—'}
                  </td>
                  <td className="px-3 py-1.5 text-gray-700">
                    {item.description_tr || '—'}
                  </td>
                  <td className="px-3 py-1.5 text-gray-700">
                    {item.description_ru || '—'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-1.5 text-right">
                    {formatQuantity(item.quantity)} {item.unit}
                  </td>
                  <td className="whitespace-nowrap px-3 py-1.5 text-gray-600">
                    {item.supply_date ? formatDate(item.supply_date) : '—'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-1.5 text-right">
                    <button
                      type="button"
                      onClick={() =>
                        onToggleArrival(request, item, !item.is_arrived)
                      }
                      disabled={busyItem}
                      title={
                        item.is_arrived
                          ? 'Gelmedi olarak işaretle'
                          : 'Geldi olarak işaretle'
                      }
                      aria-label={`${item.part_number || 'Kalem'} ${
                        item.is_arrived ? 'gelmedi' : 'geldi'
                      } olarak işaretle`}
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60 ${spareArrivalBadgeClass(
                        item.is_arrived
                      )}`}
                    >
                      {busyItem ? (
                        <ArrowPathIcon className="h-3 w-3 animate-spin" />
                      ) : (
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      )}
                      {spareArrivalLabel(item.is_arrived)}
                    </button>
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
  onEdit,
  onChangeStatus,
  onToggleArrival,
  onDelete,
  rowBusy,
}) {
  const dispatch = useDispatch();
  const filters = useSelector((s) => s.purchaseRequest.spareParts.filters);
  const requestTypes = useSelector((s) => s.purchaseRequest.requestTypes.items);
  const territories = useSelector((s) => s.lookup.data.territory || []);

  // Which requests show their part rows underneath (click on the row).
  const [expandedIds, setExpandedIds] = useState([]);

  const toggleExpanded = (id) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]
    );
  };

  const handleFilterChange = (key, value) => {
    dispatch(setSpareFilter({ key, value }));
  };

  // Kolon başlıkları — `filter` taşıyan başlıklar Excel tarzı açılır filtre alır.
  const headerColumns = [
    {
      id: 'request',
      label: 'Talep',
      filter: { kind: 'text', key: 'search', placeholder: 'Başlık / STF no' },
    },
    {
      id: 'identification_no',
      label: 'ID No',
      filter: {
        kind: 'text',
        key: 'identification_no',
        placeholder: 'Kimlik no',
      },
    },
    {
      id: 'territory',
      label: 'Bölge',
      filter: { kind: 'select', key: 'territory_id', options: territories },
    },
    {
      id: 'request_type',
      label: 'Talep Türü',
      filter: {
        kind: 'select',
        key: 'request_type_id',
        options: requestTypes,
      },
    },
    { id: 'part', label: 'Parça' },
    {
      id: 'request_date',
      label: 'Tarih',
      filter: { kind: 'dateRange', keys: ['date_from', 'date_to'] },
    },
    {
      id: 'status',
      label: 'Durum',
      filter: { kind: 'select', key: 'status', options: STATUS_OPTIONS },
    },
    { id: 'actions', label: 'İşlem', align: 'right' },
  ];

  // Sütunlar varsayılan olarak açıktır; kullanıcı istediğini gizleyebilir.
  const visibility = useColumnVisibility(
    headerColumns.map((column) => column.id)
  );
  const menuColumns = headerColumns.map(({ id, label }) => ({ id, label }));

  // Gizlenen sütunun `th` ve `td` hücresi aynı sınıfla kaldırılır.
  const columnClass = (id, className = '') =>
    `${className} ${visibility.isVisible(id) ? '' : 'hidden'}`.trim();

  if (loading && items.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <Skeleton />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <ColumnVisibilityMenu columns={menuColumns} {...visibility} />

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {loading && (
          <div className="h-0.5 w-full overflow-hidden bg-blue-100">
            <div className="h-full w-1/3 animate-pulse bg-blue-500" />
          </div>
        )}

        {visibility.allHidden ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm font-medium text-gray-900">
              Tüm sütunlar gizli
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Görünür sütun kalmadı. Sütunları tekrar açabilirsiniz.
            </p>
            <button
              type="button"
              onClick={visibility.showAll}
              className="mt-3 text-sm font-medium text-blue-600 hover:underline"
            >
              Tüm sütunları göster
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" style={{ fontFamily: 'Inter' }}>
              <thead className="bg-gray-100 text-[11px] uppercase text-gray-700">
                <tr>
                  {headerColumns.map((column) => (
                    <th
                      key={column.id}
                      className={columnClass(
                        column.id,
                        `px-4 py-2.5 font-medium ${
                          column.align === 'right' ? 'text-right' : 'text-left'
                        }`
                      )}
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
                  <td
                    colSpan={Math.max(visibility.visibleCount, 1)}
                    className="px-4 py-12 text-center"
                  >
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
                const expanded = expandedIds.includes(item.id);

                return (
                  <Fragment key={item.id}>
                    <tr
                      onClick={() => toggleExpanded(item.id)}
                      className={`cursor-pointer border-t border-gray-100 align-top transition ${
                        expanded ? 'bg-blue-50/40' : 'hover:bg-gray-50'
                      }`}
                    >
                      <td className={columnClass('request', 'px-4 py-2.5')}>
                        <div className="flex items-start gap-1.5">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleExpanded(item.id);
                            }}
                            title={
                              expanded ? 'Kalemleri gizle' : 'Kalemleri göster'
                            }
                            aria-label={`${item.title} kalemlerini ${
                              expanded ? 'gizle' : 'göster'
                            }`}
                            aria-expanded={expanded}
                            className="mt-0.5 rounded p-0.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                          >
                            {expanded ? (
                              <ChevronDownIcon className="h-4 w-4" />
                            ) : (
                              <ChevronRightIcon className="h-4 w-4" />
                            )}
                          </button>

                          <div className="min-w-0">
                            <p className="text-[13px] font-medium text-gray-900">
                              {item.title}
                            </p>
                            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-gray-500">
                              <span>STF/HTF: {item.stf_htf_no}</span>
                              {(item.documents || []).length > 0 && (
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    onOpenDetail(item);
                                  }}
                                  title={`PDF evrak: ${(item.documents || [])
                                    .map((document) => document.file_name)
                                    .join(', ')}`}
                                  className="inline-flex items-center gap-0.5 rounded-full border border-blue-100 bg-blue-50 px-1.5 text-[10px] font-medium text-blue-700 transition hover:bg-blue-100"
                                >
                                  <PaperClipIcon className="h-2.5 w-2.5" />
                                  {item.documents.length} PDF
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td
                        className={columnClass(
                          'identification_no',
                          'px-4 py-2.5'
                        )}
                      >
                        <MachineLabels labels={item.machine_labels} />
                      </td>

                      <td
                        className={columnClass(
                          'territory',
                          'whitespace-nowrap px-4 py-2.5 text-[12px] text-gray-700'
                        )}
                      >
                        {item.territory_name || '—'}
                      </td>

                      <td
                        className={columnClass(
                          'request_type',
                          'whitespace-nowrap px-4 py-2.5'
                        )}
                      >
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                          {item.request_type_name || '—'}
                        </span>
                      </td>

                      <td
                        className={columnClass(
                          'part',
                          'whitespace-nowrap px-4 py-2.5 text-[12px] text-gray-700'
                        )}
                      >
                        <p className="font-medium text-gray-800">
                          {item.item_count} kalem
                        </p>
                        <p className="mt-0.5 text-[11px] text-gray-500">
                          {item.arrived_count ?? 0}/{item.item_count} geldi
                        </p>
                      </td>

                      <td
                        className={columnClass(
                          'request_date',
                          'whitespace-nowrap px-4 py-2.5 text-[12px] text-gray-700'
                        )}
                      >
                        {formatDate(item.request_date)}
                      </td>

                      <td
                        className={columnClass(
                          'status',
                          'whitespace-nowrap px-4 py-2.5'
                        )}
                      >
                        <StatusSelect
                          item={item}
                          busy={rowBusy}
                          onChangeStatus={onChangeStatus}
                        />
                      </td>

                      <td
                        className={columnClass(
                          'actions',
                          'whitespace-nowrap px-4 py-2.5 text-right'
                        )}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              onEdit(item);
                            }}
                            title="Talebi düzenle"
                            aria-label={`${item.title} talebini düzenle`}
                            className="rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-blue-700"
                          >
                            <PencilSquareIcon className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              onOpenDetail(item);
                            }}
                            title="Talep detayı ve PDF evrak"
                            aria-label={`${item.title} talebini görüntüle`}
                            className="rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              onDelete(item);
                            }}
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

                    {expanded && (
                      <tr className="align-top">
                        <td colSpan={visibility.visibleCount} className="p-0">
                          <ItemRows
                            request={item}
                            busy={rowBusy}
                            onToggleArrival={onToggleArrival}
                          />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
