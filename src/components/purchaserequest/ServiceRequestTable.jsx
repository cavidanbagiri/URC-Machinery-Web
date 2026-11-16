// src/components/purchaserequest/ServiceRequestTable.jsx
import { useDispatch, useSelector } from 'react-redux';
import { ArrowPathIcon, TrashIcon } from '@heroicons/react/24/outline';

import { ColumnFilterHeader } from '../ui/ColumnFilter';
import ResizableTable, { ResizableTh } from '../ui/ResizableTable';
import ColumnVisibilityMenu from '../ui/ColumnVisibilityMenu';
import useColumnResize from '../ui/useColumnResize';
import useColumnVisibility from '../ui/useColumnVisibility';
import { setServiceFilter } from '../../stores/purchase_request_slice';
import { formatDate, machineLabel } from '../../utils/repair';

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
    <div className="divide-y divide-gray-100">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex gap-4 px-6 py-3">
          <div className="h-5 w-40 animate-pulse rounded bg-gray-100" />
          <div className="h-5 w-24 animate-pulse rounded bg-gray-100" />
          <div className="h-5 flex-1 animate-pulse rounded bg-gray-100" />
          <div className="h-5 w-20 animate-pulse rounded bg-gray-100" />
        </div>
      ))}
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
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
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
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
          >
            <ArrowPathIcon className="h-4 w-4 text-gray-400" />
            Genişlikleri sıfırla
          </button>
        )}
      </div>

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
            <ResizableTable
              resize={resize}
              columnIds={visibleColumnIds}
              style={{ fontFamily: 'Inter' }}
            >
              <thead className="bg-gray-100 text-[11px] uppercase text-gray-700">
                <tr>
                  {headerColumns.map((column) => (
                    <ResizableTh
                      key={column.id}
                      resize={resize}
                      columnId={column.id}
                      label={column.label}
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
                    </ResizableTh>
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
                        : 'Henüz servis/hizmet talebi bulunmuyor'}
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
                  rowBusy?.scope === 'serviceRequests' &&
                  rowBusy?.id === item.id &&
                  rowBusy?.action === 'delete';

                return (
                  <tr
                    key={item.id}
                    className="border-t border-gray-100 align-top hover:bg-gray-50"
                  >
                    <td
                      className={columnClass('service_form', 'px-4 py-2.5')}
                    >
                      <p className="text-[13px] font-medium text-gray-900">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        No: {item.service_form_no}
                      </p>
                    </td>

                    <td
                      className={columnClass('identification_no', 'px-4 py-2.5')}
                    >
                      <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-700">
                        {machineLabel(item) || '—'}
                      </span>
                    </td>

                    <td
                      className={columnClass(
                        'company_name',
                        'whitespace-nowrap px-4 py-2.5 text-[12px] text-gray-700'
                      )}
                    >
                      {item.company_name}
                    </td>

                    <td
                      className={columnClass(
                        'service_description',
                        'max-w-md px-4 py-2.5 text-[12px] text-gray-700'
                      )}
                    >
                      <p className="line-clamp-2" title={item.service_description}>
                        {item.service_description}
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
                        'created_by',
                        'whitespace-nowrap px-4 py-2.5 text-[12px] text-gray-500'
                      )}
                    >
                      {item.created_by_name || '—'}
                    </td>

                    <td
                      className={columnClass(
                        'actions',
                        'whitespace-nowrap px-4 py-2.5 text-right'
                      )}
                    >
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
                    </td>
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
