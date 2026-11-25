// src/components/stock/StockItemsTable.jsx
import {
  ArrowPathIcon,
  ArrowUpTrayIcon,
  CubeIcon,
  PencilSquareIcon,
  TrashIcon,
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
  TABLE_MUTED,
  TABLE_PRIMARY,
  TABLE_ROW,
  TABLE_TERTIARY,
  TABLE_TOOLBAR,
} from '../ui/tableStyles';
import { formatDate, formatQuantity } from '../../utils/stock';

//: Başlık hücresi — hizalama ortak tokenla birlikte verilir.
const HEAD_CLASS = `text-left ${TABLE_HEAD_CELL}`;

const ITEM_COLUMN_WIDTHS = {
  name: 300,
  quantity: 150,
  issues: 130,
  notes: 240,
  updated: 130,
  actions: 130,
};
const ITEM_COLUMN_IDS = Object.keys(ITEM_COLUMN_WIDTHS);

//: 6 görünür sütun + kalan alanı emen dolgu sütunu (boş durum satırı için).
const COLUMN_COUNT = 7;

function Skeleton() {
  return (
    <div>
      <div className="flex items-center gap-4 border-b border-slate-100 bg-slate-50/90 px-4 py-3">
        <div className="h-2.5 w-20 animate-pulse rounded bg-slate-200/80" />
        <div className="h-2.5 w-16 animate-pulse rounded bg-slate-200/80" />
        <div className="h-2.5 w-12 animate-pulse rounded bg-slate-200/80" />
        <div className="h-2.5 flex-1 animate-pulse rounded bg-slate-200/80" />
        <div className="h-2.5 w-14 animate-pulse rounded bg-slate-200/80" />
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex items-center gap-4 px-4 py-3">
            <div className="h-3 w-56 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />
            <div className="h-3 flex-1 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />
          </div>
        ))}
      </div>
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
            <CubeIcon className="h-3.5 w-3.5" />
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Malzeme Kartları
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
        <ResizableTable resize={resize} columnIds={ITEM_COLUMN_IDS} filler>
          <thead className={TABLE_HEAD}>
            <tr className="border-b border-slate-200">
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

              <TableFillerTh />
            </tr>
          </thead>
          <tbody className={`divide-y divide-slate-100 ${TABLE_BODY}`}>
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={COLUMN_COUNT} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <CubeIcon className="h-5 w-5" />
                    </span>
                    <p className="mt-3 text-sm font-semibold text-slate-900">
                      Sonuç bulunamadı
                    </p>
                    <p className="mt-1 text-[12px] text-slate-500">
                      {hasActiveFilters
                        ? 'Aramayı değiştirin veya temizleyin'
                        : 'Henüz malzeme kartı yok; "Yeni Malzeme" ile ilk kartı oluşturun'}
                    </p>
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={onResetFilters}
                        className="mt-3 rounded-md bg-blue-50 px-3 py-1.5 text-[12px] font-medium text-blue-600 transition hover:bg-blue-100"
                      >
                        Aramayı temizle
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}

            {items.map((item) => {
              const deleting =
                rowBusy?.scope === 'items' &&
                rowBusy.id === item.id &&
                rowBusy.action === 'delete';
              const empty = Number(item.quantity) <= 0;

              return (
                <tr
                  key={item.id}
                  className={`${TABLE_ROW} ${loading ? 'opacity-60' : ''}`}
                >
                  <td className={TABLE_CELL}>
                    <div className={`truncate ${TABLE_PRIMARY}`}>{item.name}</div>
                    <div className={TABLE_TERTIARY}>{item.unit}</div>
                  </td>
                  <td className={TABLE_CELL}>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums ${
                        empty
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {formatQuantity(item.quantity)} {item.unit}
                    </span>
                  </td>
                  <td className={TABLE_MUTED}>
                    {item.issue_count || 0} kayıt
                  </td>
                  <td className={TABLE_CELL}>
                    <span
                      className="line-clamp-2 text-[12px] text-slate-500"
                      title={item.notes || ''}
                    >
                      {item.notes || '—'}
                    </span>
                  </td>
                  <td className={`${TABLE_CELL} whitespace-nowrap tabular-nums`}>
                    {formatDate(item.updated_at)}
                  </td>
                  <td className={`${TABLE_CELL} whitespace-nowrap text-right`}>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onIssue(item)}
                        title="Sahaya çıkış yap"
                        aria-label={`${item.name} için sahaya çıkış`}
                        disabled={empty}
                        className="rounded-md p-1.5 text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ArrowUpTrayIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        title="Malzemeyi düzenle"
                        aria-label={`${item.name} kartını düzenle`}
                        className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(item)}
                        disabled={deleting}
                        title="Malzemeyi sil"
                        aria-label={`${item.name} kartını sil`}
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
              );
            })}
          </tbody>
        </ResizableTable>
      </div>
    </div>
  );
}
