// src/components/warehouse/PendingReceiptTable.jsx
import { ArrowPathIcon, InboxArrowDownIcon } from '@heroicons/react/24/outline';

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
import { formatDate, formatQuantity } from '../../utils/warehouse';

//: Başlık hücresi — hizalama ortak tokenla birlikte verilir.
const HEAD_CLASS = `text-left ${TABLE_HEAD_CELL}`;

// Sütunların başlangıç genişlikleri (px). Kullanıcı başlıktaki tutamaçtan
// sürükleyerek değiştirir; seçim tarayıcıda saklanır (useColumnResize).
const PENDING_RECEIPT_COLUMN_WIDTHS = {
  select: 56,
  request: 280,
  machine: 190,
  part: 240,
  quantity: 120,
  request_date: 140,
  target_stock: 240,
  action: 140,
};
const PENDING_RECEIPT_COLUMN_IDS = Object.keys(PENDING_RECEIPT_COLUMN_WIDTHS);

//: 8 görünür sütun + kalan alanı emen dolgu sütunu (boş durum satırı için).
const COLUMN_COUNT = 9;

export default function PendingReceiptTable({
  items,
  loading,
  hasActiveFilters,
  onResetFilters,
  selectedIds,
  onToggleSelect,
  onToggleAll,
  onReceive,
  busyId,
}) {
  // Excel tarzı genişlik ayarı: başlığın sağ kenarındaki tutamaçtan sürüklenir,
  // genişlikler tarayıcıda saklanır.
  const resize = useColumnResize(
    'warehouse:pending-receipts',
    PENDING_RECEIPT_COLUMN_WIDTHS
  );

  if (loading && items.length === 0) {
    return (
      <div className={TABLE_CARD}>
        <div>
          <div className="flex items-center gap-4 border-b border-slate-100 bg-slate-50/90 px-4 py-3">
            <div className="h-2.5 w-8 animate-pulse rounded bg-slate-200/80" />
            <div className="h-2.5 w-40 animate-pulse rounded bg-slate-200/80" />
            <div className="h-2.5 w-28 animate-pulse rounded bg-slate-200/80" />
            <div className="h-2.5 flex-1 animate-pulse rounded bg-slate-200/80" />
          </div>
          <div className="divide-y divide-slate-100">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center gap-4 px-4 py-3">
                <div className="h-4 w-4 animate-pulse rounded bg-slate-100" />
                <div className="h-3 w-52 animate-pulse rounded bg-slate-100" />
                <div className="h-3 w-32 animate-pulse rounded bg-slate-100" />
                <div className="h-3 flex-1 animate-pulse rounded bg-slate-100" />
                <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const allSelected =
    items.length > 0 &&
    items.every((item) => selectedIds.includes(item.request_item_id));

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
            <InboxArrowDownIcon className="h-3.5 w-3.5" />
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Depoya Alınacaklar
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
        <ResizableTable
          resize={resize}
          columnIds={PENDING_RECEIPT_COLUMN_IDS}
          filler
        >
          <thead className={TABLE_HEAD}>
            <tr className="border-b border-slate-200">
              <ResizableTh
                resize={resize}
                columnId="select"
                label="Seç"
                className={HEAD_CLASS}
              >
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleAll}
                  aria-label="Tümünü seç"
                  className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-blue-600"
                />
              </ResizableTh>
              <ResizableTh
                resize={resize}
                columnId="request"
                label="Talep"
                className={HEAD_CLASS}
              >
                Talep
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
                columnId="part"
                label="Parça"
                className={HEAD_CLASS}
              >
                Parça
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
                columnId="request_date"
                label="Talep Tarihi"
                className={HEAD_CLASS}
              >
                Talep Tarihi
              </ResizableTh>
              <ResizableTh
                resize={resize}
                columnId="target_stock"
                label="Hedef Stok Kartı"
                className={HEAD_CLASS}
              >
                Hedef Stok Kartı
              </ResizableTh>
              <ResizableTh
                resize={resize}
                columnId="action"
                label="İşlem"
                className={`${HEAD_CLASS} text-right`}
              >
                İşlem
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
                      <InboxArrowDownIcon className="h-5 w-5" />
                    </span>
                    <p className="mt-3 text-sm font-semibold text-slate-900">
                      Depoya alınacak kalem yok
                    </p>
                    <p className="mt-1 text-[12px] text-slate-500">
                      {hasActiveFilters
                        ? 'Arama kriterini değiştirin'
                        : 'Bir talep kaleminin siparişi tamamen geldiğinde ("Geldi") kalem burada listelenir'}
                    </p>
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={onResetFilters}
                        className="mt-3 rounded-md bg-blue-50 px-3 py-1.5 text-[12px] font-medium text-blue-600 transition hover:bg-blue-100"
                      >
                        Aramayı temizle
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}

            {items.map((item) => {
              const checked = selectedIds.includes(item.request_item_id);
              const busy = busyId === item.request_item_id;

              return (
                <tr
                  key={item.request_item_id}
                  className={`${TABLE_ROW} align-top ${
                    checked ? 'bg-blue-50/60 hover:bg-blue-50/60' : ''
                  }`}
                >
                  <td className={TABLE_CELL}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggleSelect(item.request_item_id)}
                      aria-label={`${item.request_title} kalemini seç`}
                      className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-blue-600"
                    />
                  </td>

                  <td className={TABLE_CELL}>
                    <p className={TABLE_PRIMARY}>{item.request_title}</p>
                    <p className={TABLE_MUTED}>
                      STF/HTF: {item.stf_htf_no}
                      {item.request_type_name
                        ? ` · ${item.request_type_name}`
                        : ''}
                      {item.territory_name ? ` · ${item.territory_name}` : ''}
                    </p>
                  </td>

                  <td className={TABLE_CELL}>
                    <p>{item.machine_label}</p>
                    {item.garage_request_no && (
                      <p className={TABLE_MUTED}>
                        Garaj No: {item.garage_request_no}
                      </p>
                    )}
                  </td>

                  <td className={TABLE_CELL}>
                    <p className="text-[12px] font-semibold text-slate-900">
                      {item.part_number || '—'}
                    </p>
                    <p className={TABLE_MUTED}>
                      {item.description_tr || item.description_ru || '—'}
                    </p>
                  </td>

                  <td className={`${TABLE_CELL} tabular-nums text-slate-900`}>
                    {formatQuantity(item.quantity)} {item.unit}
                  </td>

                  <td className={`${TABLE_CELL} tabular-nums`}>
                    {formatDate(item.request_date)}
                  </td>

                  <td className={TABLE_CELL}>
                    {item.stock_item_id ? (
                      <>
                        <p className="text-slate-900">{item.stock_item_name}</p>
                        <p className={TABLE_MUTED}>
                          Mevcut {formatQuantity(item.stock_item_quantity)}{' '}
                          {item.unit}
                        </p>
                      </>
                    ) : (
                      <span className="rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                        Yeni kart oluşturulacak
                      </span>
                    )}
                  </td>

                  <td className={`${TABLE_CELL} text-right`}>
                    <button
                      type="button"
                      onClick={() => onReceive(item)}
                      disabled={busy}
                      className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-[12px] font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {busy ? (
                        <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <InboxArrowDownIcon className="h-3.5 w-3.5" />
                      )}
                      Depoya Al
                    </button>
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
