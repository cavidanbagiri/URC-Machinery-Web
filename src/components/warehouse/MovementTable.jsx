// src/components/warehouse/MovementTable.jsx
import { ClipboardDocumentListIcon } from '@heroicons/react/24/outline';

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
  TABLE_TOOLBAR,
} from '../ui/tableStyles';
import {
  formatDate,
  formatQuantity,
  movementBadgeClass,
  movementQuantityClass,
  movementQuantityPrefix,
  movementTypeLabel,
} from '../../utils/warehouse';

//: Başlık hücresi — hizalama ortak tokenla birlikte verilir.
const HEAD_CLASS = `text-left ${TABLE_HEAD_CELL}`;

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

//: 7 görünür sütun + kalan alanı emen dolgu sütunu (boş durum satırı için).
const COLUMN_COUNT = 8;

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
      <div className={TABLE_CARD}>
        <div>
          <div className="flex items-center gap-4 border-b border-slate-100 bg-slate-50/90 px-4 py-3">
            <div className="h-2.5 w-16 animate-pulse rounded bg-slate-200/80" />
            <div className="h-2.5 w-12 animate-pulse rounded bg-slate-200/80" />
            <div className="h-2.5 flex-1 animate-pulse rounded bg-slate-200/80" />
            <div className="h-2.5 w-16 animate-pulse rounded bg-slate-200/80" />
          </div>
          <div className="divide-y divide-slate-100">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="flex items-center gap-4 px-4 py-3">
                <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />
                <div className="h-5 w-16 animate-pulse rounded-full bg-slate-100" />
                <div className="h-3 flex-1 animate-pulse rounded bg-slate-100" />
                <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
              </div>
            ))}
          </div>
        </div>
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
            <ClipboardDocumentListIcon className="h-3.5 w-3.5" />
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Stok Hareketleri
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
        <ResizableTable resize={resize} columnIds={MOVEMENT_COLUMN_IDS} filler>
          <thead className={TABLE_HEAD}>
            <tr className="border-b border-slate-200">
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

              <TableFillerTh />
            </tr>
          </thead>

          <tbody className={`divide-y divide-slate-100 ${TABLE_BODY}`}>
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={COLUMN_COUNT} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <ClipboardDocumentListIcon className="h-5 w-5" />
                    </span>
                    <p className="mt-3 text-sm font-semibold text-slate-900">
                      Hareket bulunamadı
                    </p>
                    <p className="mt-1 text-[12px] text-slate-500">
                      {hasActiveFilters
                        ? 'Filtreleri değiştirin veya temizleyin'
                        : 'Giriş ve çıkışlar burada listelenir'}
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

            {items.map((movement) => (
              <tr key={movement.id} className={`${TABLE_ROW} align-top`}>
                <td className={`${TABLE_CELL} tabular-nums`}>
                  {formatDate(movement.movement_date)}
                </td>

                <td className={TABLE_CELL}>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${movementBadgeClass(
                      movement.movement_type
                    )}`}
                  >
                    {movementTypeLabel(movement.movement_type)}
                  </span>
                </td>

                <td className={TABLE_CELL}>
                  <p className={TABLE_PRIMARY}>{movement.item_name}</p>
                  <p className={TABLE_MUTED}>
                    {movement.item_part_number || 'Parça no yok'}
                  </p>
                </td>

                <td
                  className={`${TABLE_CELL} text-[13px] font-semibold tabular-nums ${movementQuantityClass(
                    movement.movement_type
                  )}`}
                >
                  {movementQuantityPrefix(movement.movement_type)}
                  {formatQuantity(movement.quantity)} {movement.unit || ''}
                </td>

                <td className={TABLE_CELL}>
                  {movement.machine_label || '—'}
                </td>

                <td className={TABLE_CELL}>
                  <p>{movement.document_no || '—'}</p>
                  {movement.source_request_no && (
                    <p className={TABLE_MUTED}>
                      Satın alma: {movement.source_request_no}
                    </p>
                  )}
                  {movement.note && (
                    <p className={TABLE_MUTED}>{movement.note}</p>
                  )}
                </td>

                <td className={TABLE_CELL}>
                  {movement.created_by_name || '—'}
                </td>

                <TableFillerTd />
              </tr>
            ))}
          </tbody>
        </ResizableTable>
      </div>
    </div>
  );
}
