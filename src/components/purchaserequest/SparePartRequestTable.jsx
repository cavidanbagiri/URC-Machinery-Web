// src/components/purchaserequest/SparePartRequestTable.jsx
import { Fragment, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ClipboardDocumentListIcon,
  EyeIcon,
  PaperClipIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

import { ColumnFilterHeader } from '../ui/ColumnFilter';
import ResizableTable, {
  ResizableTh,
  TableFillerTd,
  TableFillerTh,
} from '../ui/ResizableTable';
import useColumnResize from '../ui/useColumnResize';
import useColumnVisibility from '../ui/useColumnVisibility';
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

// Sütunların başlangıç genişlikleri (px). Kullanıcı başlıktaki tutamaçtan
// sürükleyerek değiştirir; seçim tarayıcıda saklanır (useColumnResize).
const SPARE_COLUMN_WIDTHS = {
  request: 280,
  identification_no: 160,
  territory: 110,
  request_type: 130,
  part: 110,
  request_date: 115,
  status: 160,
  actions: 128,
};

function MachineLabels({ labels = [] }) {
  if (labels.length === 0) return <span className="text-slate-400">—</span>;

  const [first, ...rest] = labels;

  return (
    <div className="flex flex-wrap items-center gap-1">
      <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-700">
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
      <p className="px-4 py-3 text-[12px] text-slate-500">
        Bu talepte parça satırı yok.
      </p>
    );
  }

  return (
    <div className="border-y border-slate-100 bg-slate-50/60 px-4 py-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Parça Kalemleri · {request.arrived_count ?? 0}/{items.length} geldi
        </p>
        <p className="text-[11px] text-slate-400">
          Gelen kalemi işaretlemek için satırdaki durum düğmesine tıklayın
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full">
          <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-3 py-1.5 text-left font-semibold">ID No</th>
              <th className="px-3 py-1.5 text-left font-semibold">Garaj No</th>
              <th className="px-3 py-1.5 text-left font-semibold">Parça No</th>
              <th className="px-3 py-1.5 text-left font-semibold">
                Açıklama (TR)
              </th>
              <th className="px-3 py-1.5 text-left font-semibold">
                Açıklama (RU)
              </th>
              <th className="px-3 py-1.5 text-right font-semibold">Miktar</th>
              <th className="px-3 py-1.5 text-left font-semibold">Tedarik</th>
              <th className="px-3 py-1.5 text-right font-semibold">Durum</th>
            </tr>
          </thead>
          <tbody className="text-[12px] text-slate-700">
            {items.map((item) => {
              const busyItem =
                busy?.scope === 'spareParts' &&
                busy?.id === request.id &&
                busy?.action === 'arrival' &&
                busy?.itemId === item.id;

              return (
                <tr
                  key={item.id}
                  className="border-t border-slate-100 transition-colors hover:bg-slate-50/70"
                >
                  <td className="whitespace-nowrap px-3 py-1.5 font-medium text-slate-900">
                    {spareItemMachineLabel(item) || '—'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-1.5 text-slate-600">
                    {item.garage_request_no || '—'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-1.5 text-slate-600">
                    {item.part_number || '—'}
                  </td>
                  <td className="px-3 py-1.5 text-slate-700">
                    {item.description_tr || '—'}
                  </td>
                  <td className="px-3 py-1.5 text-slate-700">
                    {item.description_ru || '—'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-1.5 text-right tabular-nums text-slate-900">
                    {formatQuantity(item.quantity)} {item.unit}
                  </td>
                  <td className="whitespace-nowrap px-3 py-1.5 text-slate-600">
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
    <div>
      <div className="flex items-center gap-4 border-b border-slate-100 bg-slate-50/90 px-4 py-3">
        <div className="h-2.5 w-40 animate-pulse rounded bg-slate-200/80" />
        <div className="h-2.5 w-20 animate-pulse rounded bg-slate-200/80" />
        <div className="h-2.5 w-16 animate-pulse rounded bg-slate-200/80" />
        <div className="h-2.5 flex-1 animate-pulse rounded bg-slate-200/80" />
        <div className="h-2.5 w-20 animate-pulse rounded-full bg-slate-200/80" />
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex items-center gap-4 px-4 py-3">
            <div className="h-3 w-40 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
            <div className="h-3 flex-1 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-20 animate-pulse rounded-full bg-slate-100" />
          </div>
        ))}
      </div>
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

  // Excel tarzı genişlik ayarı: başlığın sağ kenarındaki tutamaçtan sürüklenir,
  // genişlikler tarayıcıda saklanır.
  const resize = useColumnResize('purchase-requests:spare-parts', SPARE_COLUMN_WIDTHS);
  const visibleColumnIds = headerColumns
    .filter((column) => visibility.isVisible(column.id))
    .map((column) => column.id);

  // Gizlenen sütunun `th` ve `td` hücresi aynı sınıfla kaldırılır.
  // `overflow-hidden`: daraltılan sütunda taşan içerik komşu sütuna taşmasın.
  const columnClass = (id, className = '') =>
    `${className} overflow-hidden ${
      visibility.isVisible(id) ? '' : 'hidden'
    }`.trim();

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
            <ClipboardDocumentListIcon className="h-3.5 w-3.5" />
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Yedek Parça Talepleri
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-slate-500">
            {items.length}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {resize.isCustomized && (
            <button
              type="button"
              onClick={resize.resetAll}
              title="Tüm sütunları varsayılan genişliğe döndür"
              className="rounded-md px-2 py-1 text-[11px] font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            >
              Sütun genişliklerini sıfırla
            </button>
          )}
        </div>
      </div>

      {visibility.allHidden ? (
        <div className="px-6 py-16 text-center">
          <p className="text-sm font-semibold text-slate-900">
            Tüm sütunlar gizli
          </p>
          <p className="mt-1 text-[12px] text-slate-500">
            Görünür sütun kalmadı. Sütunları tekrar açabilirsiniz.
          </p>
          <button
            type="button"
            onClick={visibility.showAll}
            className="mt-3 rounded-md bg-blue-50 px-3 py-1.5 text-[12px] font-medium text-blue-600 transition hover:bg-blue-100"
          >
            Tüm sütunları göster
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <ResizableTable
            resize={resize}
            columnIds={visibleColumnIds}
            filler
          >
            <thead className={TABLE_HEAD}>
              <tr className="border-b border-slate-200">
                {headerColumns.map((column) => (
                  <ResizableTh
                    key={column.id}
                    resize={resize}
                    columnId={column.id}
                    label={column.label}
                    className={columnClass(
                      column.id,
                      `${TABLE_HEAD_CELL} ${
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
                  </ResizableTh>
                ))}

                <TableFillerTh />
              </tr>
              </thead>

              <tbody className={`divide-y divide-slate-100 ${TABLE_BODY}`}>
                {items.length === 0 && (
                  <tr>
                    <td
                      colSpan={Math.max(visibility.visibleCount, 1) + 1}
                      className="px-6 py-16 text-center"
                    >
                      <div className="flex flex-col items-center">
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                          <ClipboardDocumentListIcon className="h-5 w-5" />
                        </span>
                        <p className="mt-3 text-sm font-semibold text-slate-900">
                          Sonuç bulunamadı
                        </p>
                        <p className="mt-1 text-[12px] text-slate-500">
                          {hasActiveFilters
                            ? 'Filtreleri değiştirin veya temizleyin'
                            : 'Henüz yedek parça talebi bulunmuyor'}
                        </p>
                        {hasActiveFilters && (
                          <button
                            type="button"
                            onClick={onResetFilters}
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
                  const deleting =
                    rowBusy?.scope === 'spareParts' &&
                    rowBusy?.id === item.id &&
                    rowBusy?.action === 'delete';
                  const expanded = expandedIds.includes(item.id);

                  return (
                    <Fragment key={item.id}>
                      <tr
                        onClick={() => toggleExpanded(item.id)}
                        className={`${TABLE_ROW} cursor-pointer align-top ${
                          expanded ? 'bg-blue-50/60 hover:bg-blue-50/60' : ''
                        }`}
                      >
                        <td className={columnClass('request', TABLE_CELL)}>
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
                              className="mt-0.5 rounded p-0.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                            >
                              {expanded ? (
                                <ChevronDownIcon className="h-4 w-4" />
                              ) : (
                                <ChevronRightIcon className="h-4 w-4" />
                              )}
                            </button>

                            <div className="min-w-0">
                              <p className={TABLE_PRIMARY}>{item.title}</p>
                              <div
                                className={`mt-0.5 flex flex-wrap items-center gap-1.5 ${TABLE_MUTED}`}
                              >
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
                            TABLE_CELL
                          )}
                        >
                          <MachineLabels labels={item.machine_labels} />
                        </td>

                        <td className={columnClass('territory', TABLE_CELL)}>
                          {item.territory_name || '—'}
                        </td>

                        <td className={columnClass('request_type', TABLE_CELL)}>
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                            {item.request_type_name || '—'}
                          </span>
                        </td>

                        <td className={columnClass('part', TABLE_CELL)}>
                          <p className={TABLE_PRIMARY}>{item.item_count} kalem</p>
                          <p className={`mt-0.5 ${TABLE_MUTED}`}>
                            {item.arrived_count ?? 0}/{item.item_count} geldi
                          </p>
                        </td>

                        <td
                          className={columnClass(
                            'request_date',
                            `${TABLE_CELL} tabular-nums`
                          )}
                        >
                          {formatDate(item.request_date)}
                        </td>

                        <td className={columnClass('status', TABLE_CELL)}>
                          <StatusSelect
                            item={item}
                            busy={rowBusy}
                            onChangeStatus={onChangeStatus}
                          />
                        </td>

                        <td
                          className={columnClass(
                            'actions',
                            `${TABLE_CELL} text-right`
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
                              className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-blue-700"
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
                              className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
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
                              className="rounded-md p-1.5 text-red-600 transition hover:bg-red-50 disabled:opacity-40"
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

                      {expanded && (
                        <tr className="align-top">
                          <td
                            colSpan={visibility.visibleCount + 1}
                            className="p-0"
                          >
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
            </ResizableTable>
        </div>
      )}
    </div>
  );
}
