// src/components/machines/MachinePagination.jsx
import { useDispatch, useSelector } from 'react-redux';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { setOffset, setLimit } from '../../stores/machine_slice';

export default function MachinePagination() {
  const dispatch = useDispatch();
  const { total, limit, offset, loading } = useSelector((s) => s.machine);

  const totalPages = Math.ceil(total / limit) || 1;
  const currentPage = Math.floor(offset / limit) + 1;

  // Görünən səhifə nömrələrini hesabla (maks 7 ədəd)
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    // Həmişə 1 və sonuncu göstər
    pages.push(1);

    let start = Math.max(2, currentPage - 2);
    let end = Math.min(totalPages - 1, currentPage + 2);

    // Əgər əvvəldəyiksə, sonu genişləndir
    if (currentPage <= 3) {
      start = 2;
      end = 5;
    }
    // Əgər sonda olsaq, başlanğıcı genişləndir
    if (currentPage >= totalPages - 2) {
      start = totalPages - 4;
      end = totalPages - 1;
    }

    if (start > 2) pages.push('...');
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages - 1) pages.push('...');

    pages.push(totalPages);
    return pages;
  };

  const goToPage = (page) => {
    const newOffset = (page - 1) * limit;
    dispatch(setOffset(newOffset));
  };

  const handlePrev = () => {
    if (currentPage > 1) goToPage(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) goToPage(currentPage + 1);
  };

  const handleLimitChange = (e) => {
    dispatch(setLimit(Number(e.target.value)));
  };

  // Total 0-dırsa göstərmə
  if (total === 0) return null;

  const fromItem = offset + 1;
  const toItem = Math.min(offset + limit, total);

  return (
    <div className="flex flex-col items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white px-6 py-4 shadow-sm md:flex-row">
      {/* Sol — məlumat + limit */}
      <div className="flex items-center gap-4 text-sm text-gray-600">
        <span>
          <span className="font-medium text-gray-900">{fromItem}</span>
          {' – '}
          <span className="font-medium text-gray-900">{toItem}</span>
          {' / '}
          <span className="font-medium text-gray-900">{total}</span>
        </span>

        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">Səhifə ölçüsü:</label>
          <select
            value={limit}
            onChange={handleLimitChange}
            disabled={loading}
            className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Sağ — səhifə nömrələri */}
      <div className="flex items-center gap-1">
        <button
          onClick={handlePrev}
          disabled={currentPage === 1 || loading}
          className="rounded-lg border border-gray-300 p-2 text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>

        {getPageNumbers().map((page, idx) =>
          page === '...' ? (
            <span
              key={`dots-${idx}`}
              className="px-2 text-sm text-gray-400"
            >
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => goToPage(page)}
              disabled={loading}
              className={`min-w-[36px] rounded-lg border px-2 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
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
          onClick={handleNext}
          disabled={currentPage === totalPages || loading}
          className="rounded-lg border border-gray-300 p-2 text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}