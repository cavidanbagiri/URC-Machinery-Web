// src/components/warehouse/PendingReceiptTable.jsx
import { ArrowPathIcon, InboxArrowDownIcon } from '@heroicons/react/24/outline';

import { formatDate, formatQuantity } from '../../utils/warehouse';

const HEAD_CLASS =
  'whitespace-nowrap px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500';

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
  if (loading && items.length === 0) {
    return (
      <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white shadow-sm">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex gap-4 px-6 py-3">
            <div className="h-5 w-6 animate-pulse rounded bg-gray-100" />
            <div className="h-5 w-52 animate-pulse rounded bg-gray-100" />
            <div className="h-5 w-32 animate-pulse rounded bg-gray-100" />
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
        <InboxArrowDownIcon className="mx-auto h-10 w-10 text-gray-300" />
        <p className="mt-2 text-sm font-medium text-gray-900">
          Depoya alınacak kalem yok
        </p>
        <p className="mt-1 text-sm text-gray-500">
          {hasActiveFilters
            ? 'Arama kriterini değiştirin'
            : 'Satın alma talepleri "Geldi" olarak işaretlendiğinde kalemler burada listelenir'}
        </p>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="mt-3 text-sm font-medium text-blue-600 hover:underline"
          >
            Aramayı temizle
          </button>
        )}
      </div>
    );
  }

  const allSelected = items.every((item) =>
    selectedIds.includes(item.request_item_id)
  );

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className={`${HEAD_CLASS} w-10`}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleAll}
                  aria-label="Tümünü seç"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className={HEAD_CLASS}>Talep</th>
              <th className={HEAD_CLASS}>Makine</th>
              <th className={HEAD_CLASS}>Parça</th>
              <th className={HEAD_CLASS}>Miktar</th>
              <th className={HEAD_CLASS}>Talep Tarihi</th>
              <th className={HEAD_CLASS}>Hedef Stok Kartı</th>
              <th className={`${HEAD_CLASS} text-right`}>İşlem</th>
            </tr>
          </thead>

          <tbody className="text-sm text-gray-800">
            {items.map((item) => {
              const checked = selectedIds.includes(item.request_item_id);
              const busy = busyId === item.request_item_id;

              return (
                <tr
                  key={item.request_item_id}
                  className={`border-t border-gray-100 align-top ${
                    checked ? 'bg-blue-50/40' : 'hover:bg-gray-50'
                  }`}
                >
                  <td className="px-4 py-2.5">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggleSelect(item.request_item_id)}
                      aria-label={`${item.request_title} kalemini seç`}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>

                  <td className="px-4 py-2.5">
                    <p className="text-[13px] font-medium text-gray-900">
                      {item.request_title}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      STF/HTF: {item.stf_htf_no}
                      {item.request_type_name
                        ? ` · ${item.request_type_name}`
                        : ''}
                      {item.territory_name ? ` · ${item.territory_name}` : ''}
                    </p>
                  </td>

                  <td className="whitespace-nowrap px-4 py-2.5 text-[12px] text-gray-700">
                    <p>{item.machine_label}</p>
                    {item.garage_request_no && (
                      <p className="text-[11px] text-gray-500">
                        Garaj No: {item.garage_request_no}
                      </p>
                    )}
                  </td>

                  <td className="px-4 py-2.5">
                    <p className="text-[12px] font-medium text-gray-900">
                      {item.part_number || '—'}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {item.description_tr || item.description_ru || '—'}
                    </p>
                  </td>

                  <td className="whitespace-nowrap px-4 py-2.5 text-[12px] text-gray-900">
                    {formatQuantity(item.quantity)} {item.unit}
                  </td>

                  <td className="whitespace-nowrap px-4 py-2.5 text-[12px] text-gray-700">
                    {formatDate(item.request_date)}
                  </td>

                  <td className="px-4 py-2.5 text-[12px]">
                    {item.stock_item_id ? (
                      <>
                        <p className="text-gray-900">{item.stock_item_name}</p>
                        <p className="text-[11px] text-gray-500">
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

                  <td className="whitespace-nowrap px-4 py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => onReceive(item)}
                      disabled={busy}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-[12px] font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {busy ? (
                        <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <InboxArrowDownIcon className="h-3.5 w-3.5" />
                      )}
                      Depoya Al
                    </button>
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
