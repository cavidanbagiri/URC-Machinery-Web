// src/components/warehouse/StockTable.jsx
import {
  ArchiveBoxIcon,
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  ClipboardDocumentListIcon,
  MinusCircleIcon,
  PencilSquareIcon,
  PlusCircleIcon,
  TrashIcon,
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
  TABLE_MUTED,
  TABLE_PRIMARY,
  TABLE_ROW,
  TABLE_TERTIARY,
  TABLE_TOOLBAR,
} from '../ui/tableStyles';
import {
  formatQuantity,
  stockStatusBadgeClass,
  stockStatusLabel,
} from '../../utils/warehouse';

//: Başlık hücresi — hizalama ortak tokenla birlikte verilir.
const HEAD_CLASS = `text-left ${TABLE_HEAD_CELL}`;

// Sütunların başlangıç genişlikleri (px). Kullanıcı başlıktaki tutamaçtan
// sürükleyerek değiştirir; seçim tarayıcıda saklanır (useColumnResize).
const STOCK_COLUMN_WIDTHS = {
  material: 280,
  location: 200,
  quantity: 120,
  min_level: 150,
  movements: 150,
  actions: 260,
};
const STOCK_COLUMN_IDS = Object.keys(STOCK_COLUMN_WIDTHS);

//: 6 görünür sütun + kalan alanı emen dolgu sütunu (boş durum satırı için).
const COLUMN_COUNT = 7;

function Skeleton() {
  return (
    <div>
      <div className="flex items-center gap-4 border-b border-slate-100 bg-slate-50/90 px-4 py-3">
        <div className="h-2.5 w-20 animate-pulse rounded bg-slate-200/80" />
        <div className="h-2.5 w-16 animate-pulse rounded bg-slate-200/80" />
        <div className="h-2.5 w-12 animate-pulse rounded bg-slate-200/80" />
        <div className="h-2.5 flex-1 animate-pulse rounded bg-slate-200/80" />
        <div className="h-2.5 w-14 animate-pulse rounded bg-slate-200/80" />
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex items-center gap-4 px-4 py-3">
            <div className="h-3 w-48 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />
            <div className="h-3 flex-1 animate-pulse rounded bg-slate-100" />
            <div className="h-5 w-24 animate-pulse rounded-full bg-slate-100" />
          </div>
        ))}
      </div>
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
  // Excel tarzı genişlik ayarı: başlığın sağ kenarındaki tutamaçtan sürüklenir,
  // genişlikler tarayıcıda saklanır.
  const resize = useColumnResize('warehouse:stock', STOCK_COLUMN_WIDTHS);

  if (loading && items.length === 0) {
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
            <ArchiveBoxIcon className="h-3.5 w-3.5" />
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Stok Kartları
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
        <ResizableTable resize={resize} columnIds={STOCK_COLUMN_IDS} filler>
          <thead className={TABLE_HEAD}>
            <tr className="border-b border-slate-200">
              <ResizableTh
                resize={resize}
                columnId="material"
                label="Malzeme"
                className={HEAD_CLASS}
              >
                Malzeme
              </ResizableTh>
              <ResizableTh
                resize={resize}
                columnId="location"
                label="Bölge / Konum"
                className={HEAD_CLASS}
              >
                Bölge / Konum
              </ResizableTh>
              <ResizableTh
                resize={resize}
                columnId="quantity"
                label="Stok"
                className={HEAD_CLASS}
              >
                Stok
              </ResizableTh>
              <ResizableTh
                resize={resize}
                columnId="min_level"
                label="Kritik Seviye"
                className={HEAD_CLASS}
              >
                Kritik Seviye
              </ResizableTh>
              <ResizableTh
                resize={resize}
                columnId="movements"
                label="Hareket"
                className={HEAD_CLASS}
              >
                Hareket
              </ResizableTh>
              <ResizableTh
                resize={resize}
                columnId="actions"
                label="İşlemler"
                className={`${HEAD_CLASS} text-right`}
              >
                İşlemler
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
                      <ArchiveBoxIcon className="h-5 w-5" />
                    </span>
                    <p className="mt-3 text-sm font-semibold text-slate-900">
                      Sonuç bulunamadı
                    </p>
                    <p className="mt-1 text-[12px] text-slate-500">
                      {hasActiveFilters
                        ? 'Filtreleri değiştirin veya temizleyin'
                        : 'Henüz stok kartı yok; "Depoya Al" ile gelen taleplerden otomatik oluşur'}
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

            {items.map((item) => {
              const deleting =
                rowBusy?.scope === 'stock' &&
                rowBusy?.id === item.id &&
                rowBusy?.action === 'delete';

              return (
                <tr key={item.id} className={`${TABLE_ROW} align-top`}>
                  <td className={TABLE_CELL}>
                    <p className={TABLE_PRIMARY}>{item.name}</p>
                    <p className={TABLE_MUTED}>
                      {item.part_number
                        ? `Parça No: ${item.part_number}`
                        : 'Parça no yok'}
                      {item.description_tr ? ` · ${item.description_tr}` : ''}
                    </p>
                  </td>

                  <td className={TABLE_CELL}>
                    <p>{item.territory_name || '—'}</p>
                    <p className={TABLE_TERTIARY}>
                      {item.location
                        ? `Raf: ${item.location}`
                        : 'Raf belirtilmemiş'}
                    </p>
                  </td>

                  <td className={TABLE_CELL}>
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold tabular-nums text-slate-900">
                        {formatQuantity(item.quantity)}
                      </span>
                      <span className={TABLE_MUTED}>
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

                  <td className={`${TABLE_CELL} tabular-nums`}>
                    {formatQuantity(item.min_quantity)} {item.unit}
                  </td>

                  <td className={TABLE_CELL}>
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

                  <td className={`${TABLE_CELL} text-right`}>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onEntry(item)}
                        title="Depoya giriş yap"
                        aria-label={`${item.name} için giriş`}
                        className="rounded-md p-1.5 text-emerald-600 transition hover:bg-emerald-50"
                      >
                        <PlusCircleIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onIssue(item)}
                        title="Depodan çıkış yap"
                        aria-label={`${item.name} için çıkış`}
                        disabled={Number(item.quantity) <= 0}
                        className="rounded-md p-1.5 text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <MinusCircleIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        title="Stok kartını düzenle"
                        aria-label={`${item.name} kartını düzenle`}
                        className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onShowMovements(item)}
                        title="Hareketleri görüntüle"
                        aria-label={`${item.name} hareketleri`}
                        className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                      >
                        <ClipboardDocumentListIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(item)}
                        disabled={deleting}
                        title="Stok kartını sil"
                        aria-label={`${item.name} kartını sil`}
                        className="rounded-md p-1.5 text-rose-600 transition hover:bg-rose-50 disabled:opacity-40"
                      >
                        {deleting ? (
                          <ArrowPathIcon className="h-4 w-4 animate-spin" />
                        ) : (
                          <TrashIcon className="h-4 w-4" />
                        )}
                      </button>
                    </div>
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
