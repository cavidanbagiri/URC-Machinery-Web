// src/components/ui/Pagination.jsx
// Tabloların alt bilgisindeki sayfalama şeridi. Slice mantığı çağıran tarafta
// kalır: bileşen `total` / `limit` / `offset` değerlerini okur, sayfa veya sayfa
// boyutu değişince `onPageChange` / `onLimitChange` ile yukarı iletir. Böylece
// doküman takibi ve satın alma talepleri aynı slate görünümü paylaşır.
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const PAGE_SIZE_OPTIONS = [20, 50, 100];

//: Sayfa gezinme oku (geri / ileri).
const NAV_BUTTON =
  'rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40';

//: Sayfa numarası düğmesi.
const PAGE_BUTTON =
  'min-w-[36px] rounded-full border px-2 py-1.5 text-sm font-medium tabular-nums transition disabled:cursor-not-allowed disabled:opacity-50';

//: Görünen aralık bilgisi ("1 – 20 / 340").
const RANGE_TEXT = 'text-[12px] text-slate-500';

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

export default function Pagination({
  total,
  limit,
  offset,
  loading = false,
  onPageChange,
  onLimitChange,
  selectId = 'page-size',
}) {
  if (!total) return null;

  const totalPages = Math.ceil(total / limit) || 1;
  const currentPage = Math.floor(offset / limit) + 1;
  const fromItem = offset + 1;
  const toItem = Math.min(offset + limit, total);

  return (
    <div className="flex flex-col items-center justify-between gap-4 px-2 py-4 md:flex-row">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || loading}
          className={NAV_BUTTON}
          aria-label="Önceki sayfa"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>

        {pageNumbers(totalPages, currentPage).map((page, index) =>
          page === '...' ? (
            <span key={`dots-${index}`} className="px-2 text-sm text-slate-400">
              ...
            </span>
          ) : (
            <button
              type="button"
              key={page}
              onClick={() => onPageChange(page)}
              disabled={loading}
              aria-current={page === currentPage ? 'page' : undefined}
              className={`${PAGE_BUTTON} ${
                page === currentPage
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {page}
            </button>
          )
        )}

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || loading}
          className={NAV_BUTTON}
          aria-label="Sonraki sayfa"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center gap-4">
        <span className={RANGE_TEXT}>
          <span className="font-medium text-slate-900 tabular-nums">{fromItem}</span>
          {' – '}
          <span className="font-medium text-slate-900 tabular-nums">{toItem}</span>
          {' / '}
          <span className="font-medium text-slate-900 tabular-nums">{total}</span>
        </span>

        <div className="flex items-center gap-2">
          <label className="text-[11px] text-slate-500" htmlFor={selectId}>
            Sayfa boyutu:
          </label>
          <select
            id={selectId}
            value={limit}
            onChange={(event) => onLimitChange(Number(event.target.value))}
            disabled={loading}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
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
