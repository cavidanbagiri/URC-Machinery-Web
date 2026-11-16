// src/components/warehouse/MovementTable.jsx
import { ClipboardDocumentListIcon } from '@heroicons/react/24/outline';

import ResizableTable, { ResizableTh } from '../ui/ResizableTable';
import useColumnResize from '../ui/useColumnResize';
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

// Sütunların başlangıç genişlikleri (px). Kullanıcı başlıktaki tutamaçtan
// sürükleyerek değiştirir; seçim tarayıcıda saklanır (useColumnResize).
const MOVEMENT_COLUMN_WIDTHS = {
  movement_date: 120,
  movement_type: 130,
  item: 260,
  quantity: 150,
  machine: 190,
  document: 220,
  user: 150,
};
const MOVEMENT_COLUMN_IDS = Object.keys(MOVEMENT_COLUMN_WIDTHS);

export default function MovementTable({
  items,
  loading,
  hasActiveFilters,
  onResetFilters,
}) {
  // Excel tarzı genişlik ayarı: başlığın sağ kenarındaki tutamaçtan sürüklenir,
  // genişlikler tarayıcıda saklanır.
  const resize = useColumnResize('warehouse:movements', MOVEMENT_COLUMN_WIDTHS);

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
        <ResizableTable resize={resize} columnIds={MOVEMENT_COLUMN_IDS}>
          <thead className="bg-gray-50">
            <tr>
              <ResizableTh
                resize={resize}
                columnId="movement_date"
                label="Tarih"
                className={HEAD_CLASS}
              >
                Tarih
              </ResizableTh>
              <ResizableTh
                resize={resize}
                columnId="movement_type"
                label="Tip"
                className={HEAD_CLASS}
              >
                Tip
              </ResizableTh>
              <ResizableTh
                resize={resize}
                columnId="item"
                label="Malzeme"
                className={HEAD_CLASS}
              >
                Malzeme
              </ResizableTh>
              <ResizableTh
                resize={resize}
                columnId="quantity"
                label="Miktar"
                className={HEAD_CLASS}
              >
                Miktar
              </ResizableTh>
              <ResizableTh
                resize={resize}
                columnId="machine"
                label="Makine"
                className={HEAD_CLASS}
              >
                Makine
              </ResizableTh>
              <ResizableTh
                resize={resize}
                columnId="document"
                label="Belge / Kaynak"
                className={HEAD_CLASS}
              >
                Belge / Kaynak
              </ResizableTh>
              <ResizableTh
                resize={resize}
                columnId="user"
                label="Kullanıcı"
                className={HEAD_CLASS}
              >
                Kullanıcı
              </ResizableTh>
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
        </ResizableTable>
      </div>
    </div>
  );
}
