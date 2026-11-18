// src/components/stock/StockItemsTable.jsx
import {
  ArrowPathIcon,
  ArrowUpTrayIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

import ResizableTable, { ResizableTh } from '../ui/ResizableTable';
import useColumnResize from '../ui/useColumnResize';
import { formatDate, formatQuantity } from '../../utils/stock';

const HEAD_CLASS =
  'whitespace-nowrap px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500';

const ITEM_COLUMN_WIDTHS = {
  name: 300,
  quantity: 150,
  issues: 130,
  notes: 240,
  updated: 130,
  actions: 130,
};
const ITEM_COLUMN_IDS = Object.keys(ITEM_COLUMN_WIDTHS);

function Skeleton() {
  return (
    <div className="divide-y divide-gray-100">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex gap-4 px-6 py-3">
          <div className="h-5 w-56 animate-pulse rounded bg-gray-100" />
          <div className="h-5 w-24 animate-pulse rounded bg-gray-100" />
          <div className="h-5 w-20 animate-pulse rounded bg-gray-100" />
          <div className="h-5 flex-1 animate-pulse rounded bg-gray-100" />
          <div className="h-5 w-20 animate-pulse rounded bg-gray-100" />
        </div>
      ))}
    </div>
  );
}

export default function StockItemsTable({
  items,
  loading,
  hasActiveFilters,
  onResetFilters,
  onIssue,
  onEdit,
  onDelete,
  rowBusy,
}) {
  const resize = useColumnResize('stock:items', ITEM_COLUMN_WIDTHS);

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
            ? 'Aramayı değiştirin veya temizleyin'
            : 'Henüz malzeme kartı yok; "Yeni Malzeme" ile ilk kartı oluşturun'}
        </p>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="mt-3 text-sm font-medium text-blue-600 hover:underline"
          >
            Aramayı temizle
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <ResizableTable resize={resize} columnIds={ITEM_COLUMN_IDS}>
          <thead className="bg-gray-50">
            <tr>
              <ResizableTh
                resize={resize}
                columnId="name"
                label="Malzeme"
                className={HEAD_CLASS}
              >
                Malzeme
              </ResizableTh>
              <ResizableTh
                resize={resize}
                columnId="quantity"
                label="Kalan Miktar"
                className={HEAD_CLASS}
              >
                Kalan Miktar
              </ResizableTh>
              <ResizableTh
                resize={resize}
                columnId="issues"
                label="Sahaya Çıkış"
                className={HEAD_CLASS}
              >
                Sahaya Çıkış
              </ResizableTh>
              <ResizableTh
                resize={resize}
                columnId="notes"
                label="Not"
                className={HEAD_CLASS}
              >
                Not
              </ResizableTh>
              <ResizableTh
                resize={resize}
                columnId="updated"
                label="Güncelleme"
                className={HEAD_CLASS}
              >
                Güncelleme
              </ResizableTh>
              <ResizableTh
                resize={resize}
                columnId="actions"
                label="İşlemler"
                className={`${HEAD_CLASS} text-right`}
              >
                <span className="sr-only">İşlemler</span>
              </ResizableTh>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((item) => {
              const deleting =
                rowBusy?.scope === 'items' &&
                rowBusy.id === item.id &&
                rowBusy.action === 'delete';
              const empty = Number(item.quantity) <= 0;

              return (
                <tr
                  key={item.id}
                  className={`text-sm transition hover:bg-gray-50 ${
                    loading ? 'opacity-60' : ''
                  }`}
                >
                  <td className="overflow-hidden px-4 py-2.5">
                    <div className="truncate font-medium text-gray-900">
                      {item.name}
                    </div>
                    <div className="text-[11px] text-gray-500">
                      {item.unit}
                    </div>
                  </td>
                  <td className="overflow-hidden px-4 py-2.5">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                        empty
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {formatQuantity(item.quantity)} {item.unit}
                    </span>
                  </td>
                  <td className="overflow-hidden px-4 py-2.5 text-gray-600">
                    {item.issue_count || 0} kayıt
                  </td>
                  <td className="overflow-hidden px-4 py-2.5">
                    <span
                      className="line-clamp-2 text-[12px] text-gray-500"
                      title={item.notes || ''}
                    >
                      {item.notes || '—'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-[12px] text-gray-500">
                    {formatDate(item.updated_at)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onIssue(item)}
                        title="Sahaya çıkış yap"
                        aria-label={`${item.name} için sahaya çıkış`}
                        disabled={empty}
                        className="rounded-lg p-1.5 text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ArrowUpTrayIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        title="Malzemeyi düzenle"
                        aria-label={`${item.name} kartını düzenle`}
                        className="rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(item)}
                        disabled={deleting}
                        title="Malzemeyi sil"
                        aria-label={`${item.name} kartını sil`}
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
        </ResizableTable>
      </div>
    </div>
  );
}
