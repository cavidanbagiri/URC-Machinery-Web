// src/components/stock/StockIssuesTable.jsx
import {
  ArrowPathIcon,
  ArrowUpTrayIcon,
  ArrowUturnLeftIcon,
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
  TABLE_TOOLBAR,
} from '../ui/tableStyles';
import { formatDate, formatQuantity } from '../../utils/stock';

//: Başlık hücresi — hizalama ortak tokenla birlikte verilir.
const HEAD_CLASS = `text-left ${TABLE_HEAD_CELL}`;

const ISSUE_COLUMN_WIDTHS = {
  date: 120,
  item: 260,
  quantity: 130,
  machine: 220,
  given_to: 150,
  note: 220,
  created_by: 140,
  actions: 110,
};
const ISSUE_COLUMN_IDS = Object.keys(ISSUE_COLUMN_WIDTHS);

//: 8 görünür sütun + kalan alanı emen dolgu sütunu (boş durum satırı için).
const COLUMN_COUNT = 9;

function Skeleton() {
  return (
    <div>
      <div className="flex items-center gap-4 border-b border-slate-100 bg-slate-50/90 px-4 py-3">
        <div className="h-2.5 w-16 animate-pulse rounded bg-slate-200/80" />
        <div className="h-2.5 w-40 animate-pulse rounded bg-slate-200/80" />
        <div className="h-2.5 w-14 animate-pulse rounded bg-slate-200/80" />
        <div className="h-2.5 flex-1 animate-pulse rounded bg-slate-200/80" />
        <div className="h-2.5 w-20 animate-pulse rounded bg-slate-200/80" />
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex items-center gap-4 px-4 py-3">
            <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-48 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-16 animate-pulse rounded bg-slate-100" />
            <div className="h-3 flex-1 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StockIssuesTable({
  issues,
  loading,
  hasActiveFilters,
  onResetFilters,
  onDelete,
  rowBusy,
}) {
  const resize = useColumnResize('stock:issues', ISSUE_COLUMN_WIDTHS);

  if (loading && issues.length === 0) {
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
            <ArrowUpTrayIcon className="h-3.5 w-3.5" />
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Sahaya Çıkışlar
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-slate-500">
            {issues.length}
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
        <ResizableTable resize={resize} columnIds={ISSUE_COLUMN_IDS} filler>
          <thead className={TABLE_HEAD}>
            <tr className="border-b border-slate-200">
              <ResizableTh resize={resize} columnId="date" label="Tarih" className={HEAD_CLASS}>
                Tarih
              </ResizableTh>
              <ResizableTh resize={resize} columnId="item" label="Malzeme" className={HEAD_CLASS}>
                Malzeme
              </ResizableTh>
              <ResizableTh resize={resize} columnId="quantity" label="Miktar" className={HEAD_CLASS}>
                Miktar
              </ResizableTh>
              <ResizableTh resize={resize} columnId="machine" label="Makine" className={HEAD_CLASS}>
                Makine
              </ResizableTh>
              <ResizableTh resize={resize} columnId="given_to" label="Kime Verildi" className={HEAD_CLASS}>
                Kime Verildi
              </ResizableTh>
              <ResizableTh resize={resize} columnId="note" label="Not" className={HEAD_CLASS}>
                Not
              </ResizableTh>
              <ResizableTh resize={resize} columnId="created_by" label="Kaydeden" className={HEAD_CLASS}>
                Kaydeden
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
            {!loading && issues.length === 0 && (
              <tr>
                <td colSpan={COLUMN_COUNT} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <ArrowUpTrayIcon className="h-5 w-5" />
                    </span>
                    <p className="mt-3 text-sm font-semibold text-slate-900">
                      Sonuç bulunamadı
                    </p>
                    <p className="mt-1 text-[12px] text-slate-500">
                      {hasActiveFilters
                        ? 'Filtreleri değiştirin veya temizleyin'
                        : 'Henüz sahaya çıkış kaydı yok; stok sekmesinden "Sahaya Çıkış" yapın'}
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

            {issues.map((issue) => {
              const deleting =
                rowBusy?.scope === 'issues' &&
                rowBusy.id === issue.id &&
                rowBusy.action === 'delete';
              const machine =
                issue.machine_label ||
                [issue.identification_no, issue.plate_no]
                  .filter(Boolean)
                  .join(' · ');

              return (
                <tr
                  key={issue.id}
                  className={`${TABLE_ROW} ${loading ? 'opacity-60' : ''}`}
                >
                  <td className={`${TABLE_CELL} whitespace-nowrap tabular-nums`}>
                    {formatDate(issue.issue_date)}
                  </td>
                  <td className={TABLE_CELL}>
                    <div className={`truncate ${TABLE_PRIMARY}`}>
                      {issue.item_name}
                    </div>
                  </td>
                  <td className={TABLE_CELL}>
                    <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-indigo-700">
                      {formatQuantity(issue.quantity)} {issue.unit}
                    </span>
                  </td>
                  <td className={TABLE_CELL}>
                    <span
                      className="line-clamp-2 text-[12px] text-slate-600"
                      title={machine || ''}
                    >
                      {machine || '—'}
                    </span>
                  </td>
                  <td className={TABLE_CELL}>
                    <span
                      className="line-clamp-2 text-[12px] text-slate-700"
                      title={issue.given_to || ''}
                    >
                      {issue.given_to || '—'}
                    </span>
                  </td>
                  <td className={TABLE_CELL}>
                    <span
                      className="line-clamp-2 text-[12px] text-slate-500"
                      title={issue.note || ''}
                    >
                      {issue.note || '—'}
                    </span>
                  </td>
                  <td className={TABLE_CELL}>
                    <div className="truncate">
                      {issue.created_by_name || '—'}
                    </div>
                  </td>
                  <td className={`${TABLE_CELL} whitespace-nowrap text-right`}>
                    <button
                      type="button"
                      onClick={() => onDelete(issue)}
                      disabled={deleting}
                      title="Kaydı sil ve miktarı stoğa geri ekle"
                      aria-label={`${issue.item_name} çıkış kaydını sil`}
                      className="rounded-md p-1.5 text-red-600 transition hover:bg-red-50 disabled:opacity-40"
                    >
                      {deleting ? (
                        <ArrowPathIcon className="h-4 w-4 animate-spin" />
                      ) : (
                        <ArrowUturnLeftIcon className="h-4 w-4" />
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
    </div>
  );
}

