// src/components/stock/StockIssuesTable.jsx
import {
  ArrowPathIcon,
  ArrowUturnLeftIcon,
} from '@heroicons/react/24/outline';

import ResizableTable, { ResizableTh } from '../ui/ResizableTable';
import useColumnResize from '../ui/useColumnResize';
import { formatDate, formatQuantity } from '../../utils/stock';

const HEAD_CLASS =
  'whitespace-nowrap px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500';

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

function Skeleton() {
  return (
    <div className="divide-y divide-gray-100">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex gap-4 px-6 py-3">
          <div className="h-5 w-20 animate-pulse rounded bg-gray-100" />
          <div className="h-5 w-48 animate-pulse rounded bg-gray-100" />
          <div className="h-5 w-16 animate-pulse rounded bg-gray-100" />
          <div className="h-5 flex-1 animate-pulse rounded bg-gray-100" />
          <div className="h-5 w-24 animate-pulse rounded bg-gray-100" />
        </div>
      ))}
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
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <Skeleton />
      </div>
    );
  }

  if (!loading && issues.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
        <p className="text-sm font-medium text-gray-900">Sonuç bulunamadı</p>
        <p className="mt-1 text-sm text-gray-500">
          {hasActiveFilters
            ? 'Filtreleri değiştirin veya temizleyin'
            : 'Henüz sahaya çıkış kaydı yok; stok sekmesinden "Sahaya Çıkış" yapın'}
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
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <ResizableTable resize={resize} columnIds={ISSUE_COLUMN_IDS}>
          <thead className="bg-gray-50">
            <tr>
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
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
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
                  className={`text-sm transition hover:bg-gray-50 ${
                    loading ? 'opacity-60' : ''
                  }`}
                >
                  <td className="whitespace-nowrap px-4 py-2.5 text-[12px] text-gray-600">
                    {formatDate(issue.issue_date)}
                  </td>
                  <td className="overflow-hidden px-4 py-2.5">
                    <div className="truncate font-medium text-gray-900">
                      {issue.item_name}
                    </div>
                  </td>
                  <td className="overflow-hidden px-4 py-2.5">
                    <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                      {formatQuantity(issue.quantity)} {issue.unit}
                    </span>
                  </td>
                  <td className="overflow-hidden px-4 py-2.5">
                    <span
                      className="line-clamp-2 text-[12px] text-gray-600"
                      title={machine || ''}
                    >
                      {machine || '—'}
                    </span>
                  </td>
                  <td className="overflow-hidden px-4 py-2.5 text-gray-700">
                    <span className="line-clamp-2" title={issue.given_to || ''}>
                      {issue.given_to || '—'}
                    </span>
                  </td>
                  <td className="overflow-hidden px-4 py-2.5">
                    <span
                      className="line-clamp-2 text-[12px] text-gray-500"
                      title={issue.note || ''}
                    >
                      {issue.note || '—'}
                    </span>
                  </td>
                  <td className="overflow-hidden px-4 py-2.5 text-[12px] text-gray-600">
                    <div className="truncate">
                      {issue.created_by_name || '—'}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => onDelete(issue)}
                      disabled={deleting}
                      title="Kaydı sil ve miktarı stoğa geri ekle"
                      aria-label={`${issue.item_name} çıkış kaydını sil`}
                      className="rounded-lg p-1.5 text-red-600 transition hover:bg-red-50 disabled:opacity-40"
                    >
                      {deleting ? (
                        <ArrowPathIcon className="h-4 w-4 animate-spin" />
                      ) : (
                        <ArrowUturnLeftIcon className="h-4 w-4" />
                      )}
                    </button>
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

