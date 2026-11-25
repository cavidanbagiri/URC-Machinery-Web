// src/components/dailyfault/DailyFaultPagination.jsx
import { useDispatch, useSelector } from 'react-redux';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

import { setLimit, setOffset } from '../../stores/daily_fault_slice';

function pageNumbers(totalPages, currentPage) {
  const pages = [];
  if (totalPages <= 7) {
    for (let page = 1; page <= totalPages; page += 1) pages.push(page);
    return pages;
  }

  pages.push(1);
  let start = Math.max(2, currentPage - 2);
  let end = Math.min(totalPages - 1, currentPage + 2);

  if (currentPage <= 3) {
    start = 2;
    end = 5;
  }
  if (currentPage >= totalPages - 2) {
    start = totalPages - 4;
    end = totalPages - 1;
  }

  if (start > 2) pages.push('...');
  for (let page = start; page <= end; page += 1) pages.push(page);
  if (end < totalPages - 1) pages.push('...');
  pages.push(totalPages);
  return pages;
}

export default function DailyFaultPagination() {
  const dispatch = useDispatch();
  const { total, limit, offset, loading } = useSelector((s) => s.dailyFault);

  if (total === 0) return null;

  const totalPages = Math.ceil(total / limit) || 1;
  const currentPage = Math.floor(offset / limit) + 1;
  const fromItem = offset + 1;
  const toItem = Math.min(offset + limit, total);

  const goToPage = (page) => {
    dispatch(setOffset((page - 1) * limit));
  };

  return (
    <div className="flex flex-col items-center justify-between gap-3 px-1 py-3 md:flex-row">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1 || loading}
          className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Önceki sayfa"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>

        {pageNumbers(totalPages, currentPage).map((page, index) =>
          page === '...' ? (
            <span
              key={`dots-${index}`}
              className="px-1.5 text-[12px] text-slate-400"
            >
              …
            </span>
          ) : (
            <button
              type="button"
              key={page}
              onClick={() => goToPage(page)}
              disabled={loading}
              className={`h-7 min-w-[28px] rounded-md border px-2 text-[12px] font-medium tabular-nums transition disabled:cursor-not-allowed disabled:opacity-50 ${
                page === currentPage
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {page}
            </button>
          )
        )}

        <button
          type="button"
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages || loading}
          className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Sonraki sayfa"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center gap-3 text-[11px] text-slate-500">
        <span className="tabular-nums">
          <span className="font-semibold text-slate-700">{fromItem}</span>
          {' – '}
          <span className="font-semibold text-slate-700">{toItem}</span>
          {' / '}
          <span className="font-semibold text-slate-700">{total}</span>
          <span className="ml-1">kayıt</span>
        </span>

        <div className="flex items-center gap-1.5">
          <label htmlFor="daily-fault-page-size">Sayfa boyutu</label>
          <select
            id="daily-fault-page-size"
            value={limit}
            onChange={(e) => dispatch(setLimit(Number(e.target.value)))}
            disabled={loading}
            className="rounded-md border border-slate-200 bg-white py-1 pl-1.5 pr-6 text-[11px] text-slate-600 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
          >
            {[20, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
