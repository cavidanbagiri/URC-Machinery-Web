// src/components/purchaserequest/ServiceRequestTable.jsx
import { useDispatch, useSelector } from 'react-redux';
import {
  ArrowPathIcon,
  TrashIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';

import { ColumnFilterHeader } from '../ui/ColumnFilter';
import ResizableTable, {
  ResizableTh,
  TableFillerTd,
  TableFillerTh,
} from '../ui/ResizableTable';
import ColumnVisibilityMenu from '../ui/ColumnVisibilityMenu';
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
import { setServiceFilter } from '../../stores/purchase_request_slice';
import { formatDate, machineLabel } from '../../utils/repair';

//: Başlık hücresi — hizalama ortak tokenla birlikte verilir.
const HEAD_CLASS = `text-left ${TABLE_HEAD_CELL}`;

// Sütunların başlangıç genişlikleri (px). Kullanıcı başlıktaki tutamaçtan
// sürükleyerek değiştirir; seçim tarayıcıda saklanır (useColumnResize).
const SERVICE_COLUMN_WIDTHS = {
  service_form: 300,
  identification_no: 150,
  company_name: 180,
  service_description: 320,
  request_date: 130,
  created_by: 140,
  actions: 90,
};

function Skeleton() {
  return (
    <div>
      <div className="flex items-center gap-4 border-b border-slate-100 bg-slate-50/90 px-4 py-3">
        <div className="h-2.5 w-32 animate-pulse rounded bg-slate-200/80" />
        <div className="h-2.5 w-16 animate-pulse rounded bg-slate-200/80" />
        <div className="h-2.5 w-24 animate-pulse rounded bg-slate-200/80" />
        <div className="h-2.5 flex-1 animate-pulse rounded bg-slate-200/80" />
        <div className="h-2.5 w-16 animate-pulse rounded bg-slate-200/80" />
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex items-center gap-4 px-4 py-3">
            <div className="h-3 w-40 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-16 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
            <div className="h-3 flex-1 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ServiceRequestTable({
  items,
  loading,
  hasActiveFilters,
  onResetFilters,
  onDelete,
  rowBusy,
}) {
  const dispatch = useDispatch();
  const filters = useSelector((s) => s.purchaseRequest.serviceRequests.filters);

  const handleFilterChange = (key, value) => {
    dispatch(setServiceFilter({ key, value }));
  };

  // Kolon başlıkları — `filter` taşıyan başlıklar Excel tarzı açılır filtre alır.
  const headerColumns = [
    {
      id: 'service_form',
      label: 'Servis Form',
      filter: { kind: 'text', key: 'search', placeholder: 'Başlık / form no' },
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
      id: 'company_name',
      label: 'Firma',
      filter: { kind: 'text', key: 'company_name', placeholder: 'Firma' },
    },
    {
      id: 'service_description',
      label: 'Hizmet Tanımı',
      filter: {
        kind: 'text',
        key: 'service_description',
        placeholder: 'Hizmet tanımı',
      },
    },
    {
      id: 'request_date',
      label: 'Tarih',
      filter: { kind: 'dateRange', keys: ['date_from', 'date_to'] },
    },
    { id: 'created_by', label: 'Kayıt' },
    { id: 'actions', label: 'İşlem', align: 'right' },
  ];

  // Sütunlar varsayılan olarak açıktır; kullanıcı istediğini gizleyebilir.
  const visibility = useColumnVisibility(
    headerColumns.map((column) => column.id)
  );
  const menuColumns = headerColumns.map(({ id, label }) => ({ id, label }));

  // Excel tarzı genişlik ayarı: başlığın sağ kenarındaki tutamaçtan sürüklenir,
  // genişlikler tarayıcıda saklanır.
  const resize = useColumnResize(
    'purchase-requests:service',
    SERVICE_COLUMN_WIDTHS
  );
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
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <ColumnVisibilityMenu columns={menuColumns} {...visibility} />
        {resize.isCustomized && (
          <button
            type="button"
            onClick={resize.resetAll}
            title="Tüm sütunları varsayılan genişliğe döndür"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <ArrowPathIcon className="h-4 w-4 text-slate-400" />
            Genişlikleri sıfırla
          </button>
        )}
      </div>

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
              Servis / Hizmet Talepleri
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-slate-500">
              {items.length}
            </span>
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
                        column.align === 'right'
                          ? `${TABLE_HEAD_CELL} text-right`
                          : HEAD_CLASS
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
                      ) : column.id === 'actions' ? (
                        <span className="sr-only">{column.label}</span>
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
                          <WrenchScrewdriverIcon className="h-5 w-5" />
                        </span>
                        <p className="mt-3 text-sm font-semibold text-slate-900">
                          Sonuç bulunamadı
                        </p>
                        <p className="mt-1 text-[12px] text-slate-500">
                          {hasActiveFilters
                            ? 'Filtreleri değiştirin veya temizleyin'
                            : 'Henüz servis/hizmet talebi bulunmuyor'}
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
                    rowBusy?.scope === 'serviceRequests' &&
                    rowBusy?.id === item.id &&
                    rowBusy?.action === 'delete';

                  return (
                    <tr
                      key={item.id}
                      className={`${TABLE_ROW} align-top ${loading ? 'opacity-60' : ''}`}
                    >
                      <td className={columnClass('service_form', TABLE_CELL)}>
                        <p className={`truncate ${TABLE_PRIMARY}`}>
                          {item.title}
                        </p>
                        <p className={`truncate ${TABLE_MUTED}`}>
                          No: {item.service_form_no}
                        </p>
                      </td>

                      <td className={columnClass('identification_no', TABLE_CELL)}>
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                          {machineLabel(item) || '—'}
                        </span>
                      </td>

                      <td
                        className={columnClass(
                          'company_name',
                          `${TABLE_CELL} text-slate-600`
                        )}
                      >
                        {item.company_name}
                      </td>

                      <td className={columnClass('service_description', TABLE_CELL)}>
                        <p
                          className="line-clamp-2 text-[12px] text-slate-600"
                          title={item.service_description}
                        >
                          {item.service_description}
                        </p>
                      </td>

                      <td className={columnClass('request_date', TABLE_CELL)}>
                        <span className="tabular-nums">
                          {formatDate(item.request_date)}
                        </span>
                      </td>

                      <td className={columnClass('created_by', TABLE_MUTED)}>
                        {item.created_by_name || '—'}
                      </td>

                      <td className={columnClass('actions', `${TABLE_CELL} text-right`)}>
                        <button
                          type="button"
                          onClick={() => onDelete(item)}
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
                      </td>

                      <TableFillerTd />
                    </tr>
                  );
                })}
              </tbody>
            </ResizableTable>
          </div>
        )}
      </div>
    </div>
  );
}
