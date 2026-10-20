// src/components/repair/RepairPagination.jsx
import { useDispatch, useSelector } from 'react-redux';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

import { setLimit, setOffset } from '../../stores/repair_slice';

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

export default function RepairPagination() {
  const dispatch = useDispatch();
  const { total, limit, offset, loading } = useSelector((s) => s.repair);

  if (total === 0) return null;

  const totalPages = Math.ceil(total / limit) || 1;
  const currentPage = Math.floor(offset / limit) + 1;
  const fromItem = offset + 1;
  const toItem = Math.min(offset + limit, total);

  const goToPage = (page) => {
    dispatch(setOffset((page - 1) * limit));
  };

  return (
    <div className="flex flex-col items-center justify-between gap-4 px-2 py-4 md:flex-row">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1 || loading}
          className="rounded-lg border border-gray-300 p-2 text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Önceki sayfa"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>

        {pageNumbers(totalPages, currentPage).map((page, index) =>
          page === '...' ? (
            <span key={`dots-${index}`} className="px-2 text-sm text-gray-400">
              ...
            </span>
          ) : (
            <button
              type="button"
              key={page}
              onClick={() => goToPage(page)}
              disabled={loading}
              className={`min-w-[36px] rounded-full border px-2 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                page === currentPage
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
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
          className="rounded-lg border border-gray-300 p-2 text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Sonraki sayfa"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-600">
        <span>
          <span className="font-medium text-gray-900">{fromItem}</span>
          {' – '}
          <span className="font-medium text-gray-900">{toItem}</span>
          {' / '}
          <span className="font-medium text-gray-900">{total}</span>
        </span>

        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500" htmlFor="repair-page-size">
            Sayfa boyutu:
          </label>
          <select
            id="repair-page-size"
            value={limit}
            onChange={(e) => dispatch(setLimit(Number(e.target.value)))}
            disabled={loading}
            className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
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
