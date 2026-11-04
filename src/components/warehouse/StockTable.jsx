// src/components/warehouse/StockTable.jsx
import {
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  ClipboardDocumentListIcon,
  MinusCircleIcon,
  PencilSquareIcon,
  PlusCircleIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

import {
  formatQuantity,
  stockStatusBadgeClass,
  stockStatusLabel,
} from '../../utils/warehouse';

const HEAD_CLASS =
  'whitespace-nowrap px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500';

function Skeleton() {
  return (
    <div className="divide-y divide-gray-100">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex gap-4 px-6 py-3">
          <div className="h-5 w-48 animate-pulse rounded bg-gray-100" />
          <div className="h-5 w-24 animate-pulse rounded bg-gray-100" />
          <div className="h-5 w-20 animate-pulse rounded bg-gray-100" />
          <div className="h-5 flex-1 animate-pulse rounded bg-gray-100" />
          <div className="h-5 w-24 animate-pulse rounded-full bg-gray-100" />
        </div>
      ))}
    </div>
  );
}

export default function StockTable({
  items,
  loading,
  hasActiveFilters,
  onResetFilters,
  onEntry,
  onIssue,
  onEdit,
  onDelete,
  onShowMovements,
  rowBusy,
}) {
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
            ? 'Filtreleri değiştirin veya temizleyin'
            : 'Henüz stok kartı yok; "Depoya Al" ile gelen taleplerden otomatik oluşur'}
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
              <th className={HEAD_CLASS}>Malzeme</th>
              <th className={HEAD_CLASS}>Bölge / Konum</th>
              <th className={HEAD_CLASS}>Stok</th>
              <th className={HEAD_CLASS}>Kritik Seviye</th>
              <th className={HEAD_CLASS}>Hareket</th>
              <th className={`${HEAD_CLASS} text-right`}>İşlemler</th>
            </tr>
          </thead>

          <tbody className="text-sm text-gray-800">
            {items.map((item) => {
              const deleting =
                rowBusy?.scope === 'stock' &&
                rowBusy?.id === item.id &&
                rowBusy?.action === 'delete';

              return (
                <tr
                  key={item.id}
                  className="border-t border-gray-100 align-top hover:bg-gray-50"
                >
                  <td className="px-4 py-2.5">
                    <p className="text-[13px] font-medium text-gray-900">
                      {item.name}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {item.part_number
                        ? `Parça No: ${item.part_number}`
                        : 'Parça no yok'}
                      {item.description_tr ? ` · ${item.description_tr}` : ''}
                    </p>
                  </td>

                  <td className="whitespace-nowrap px-4 py-2.5 text-[12px] text-gray-700">
                    <p>{item.territory_name || '—'}</p>
                    <p className="text-[11px] text-gray-500">
                      {item.location
                        ? `Raf: ${item.location}`
                        : 'Raf belirtilmemiş'}
                    </p>
                  </td>

                  <td className="whitespace-nowrap px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-gray-900">
                        {formatQuantity(item.quantity)}
                      </span>
                      <span className="text-[11px] text-gray-500">
                        {item.unit}
                      </span>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${stockStatusBadgeClass(
                          item.stock_status
                        )}`}
                      >
                        {stockStatusLabel(item.stock_status)}
                      </span>
                    </div>
                  </td>

                  <td className="whitespace-nowrap px-4 py-2.5 text-[12px] text-gray-700">
                    {formatQuantity(item.min_quantity)} {item.unit}
                  </td>

                  <td className="whitespace-nowrap px-4 py-2.5 text-[12px]">
                    <button
                      type="button"
                      onClick={() => onShowMovements(item)}
                      className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                      title="Bu kartın hareketlerini gör"
                    >
                      {item.movement_count} hareket
                      <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
                    </button>
                  </td>

                  <td className="whitespace-nowrap px-4 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onEntry(item)}
                        title="Depoya giriş yap"
                        aria-label={`${item.name} için giriş`}
                        className="rounded-lg p-1.5 text-emerald-600 transition hover:bg-emerald-50"
                      >
                        <PlusCircleIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onIssue(item)}
                        title="Depodan çıkış yap"
                        aria-label={`${item.name} için çıkış`}
                        disabled={Number(item.quantity) <= 0}
                        className="rounded-lg p-1.5 text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <MinusCircleIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        title="Stok kartını düzenle"
                        aria-label={`${item.name} kartını düzenle`}
                        className="rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onShowMovements(item)}
                        title="Hareketleri görüntüle"
                        aria-label={`${item.name} hareketleri`}
                        className="rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                      >
                        <ClipboardDocumentListIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(item)}
                        disabled={deleting}
                        title="Stok kartını sil"
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
        </table>
      </div>
    </div>
  );
}
