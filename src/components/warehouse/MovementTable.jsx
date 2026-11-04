// src/components/warehouse/MovementTable.jsx
import { ClipboardDocumentListIcon } from '@heroicons/react/24/outline';

import {
  formatDate,
  formatQuantity,
  movementBadgeClass,
  movementQuantityClass,
  movementQuantityPrefix,
  movementTypeLabel,
} from '../../utils/warehouse';

const HEAD_CLASS =
  'whitespace-nowrap px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500';

export default function MovementTable({
  items,
  loading,
  hasActiveFilters,
  onResetFilters,
}) {
  if (loading && items.length === 0) {
    return (
      <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white shadow-sm">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex gap-4 px-6 py-3">
            <div className="h-5 w-20 animate-pulse rounded bg-gray-100" />
            <div className="h-5 w-16 animate-pulse rounded-full bg-gray-100" />
            <div className="h-5 flex-1 animate-pulse rounded bg-gray-100" />
            <div className="h-5 w-24 animate-pulse rounded bg-gray-100" />
          </div>
        ))}
      </div>
    );
  }

  if (!loading && items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center shadow-sm">
        <ClipboardDocumentListIcon className="mx-auto h-10 w-10 text-gray-300" />
        <p className="mt-2 text-sm font-medium text-gray-900">
          Hareket bulunamadı
        </p>
        <p className="mt-1 text-sm text-gray-500">
          {hasActiveFilters
            ? 'Filtreleri değiştirin veya temizleyin'
            : 'Giriş ve çıkışlar burada listelenir'}
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
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className={HEAD_CLASS}>Tarih</th>
              <th className={HEAD_CLASS}>Tip</th>
              <th className={HEAD_CLASS}>Malzeme</th>
              <th className={HEAD_CLASS}>Miktar</th>
              <th className={HEAD_CLASS}>Makine</th>
              <th className={HEAD_CLASS}>Belge / Kaynak</th>
              <th className={HEAD_CLASS}>Kullanıcı</th>
            </tr>
          </thead>

          <tbody className="text-sm text-gray-800">
            {items.map((movement) => (
              <tr
                key={movement.id}
                className="border-t border-gray-100 align-top hover:bg-gray-50"
              >
                <td className="whitespace-nowrap px-4 py-2.5 text-[12px] text-gray-700">
                  {formatDate(movement.movement_date)}
                </td>

                <td className="whitespace-nowrap px-4 py-2.5">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${movementBadgeClass(
                      movement.movement_type
                    )}`}
                  >
                    {movementTypeLabel(movement.movement_type)}
                  </span>
                </td>

                <td className="px-4 py-2.5">
                  <p className="text-[13px] font-medium text-gray-900">
                    {movement.item_name}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    {movement.item_part_number || 'Parça no yok'}
                  </p>
                </td>

                <td
                  className={`whitespace-nowrap px-4 py-2.5 text-[13px] font-semibold ${movementQuantityClass(
                    movement.movement_type
                  )}`}
                >
                  {movementQuantityPrefix(movement.movement_type)}
                  {formatQuantity(movement.quantity)} {movement.unit || ''}
                </td>

                <td className="whitespace-nowrap px-4 py-2.5 text-[12px] text-gray-700">
                  {movement.machine_label || '—'}
                </td>

                <td className="px-4 py-2.5 text-[12px] text-gray-700">
                  <p>{movement.document_no || '—'}</p>
                  {movement.source_request_no && (
                    <p className="text-[11px] text-gray-500">
                      Satın alma: {movement.source_request_no}
                    </p>
                  )}
                  {movement.note && (
                    <p className="text-[11px] text-gray-500">{movement.note}</p>
                  )}
                </td>

                <td className="whitespace-nowrap px-4 py-2.5 text-[12px] text-gray-700">
                  {movement.created_by_name || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
