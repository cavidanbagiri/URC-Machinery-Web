// src/components/purchaserequest/ServiceRequestTable.jsx
import { ArrowPathIcon, TrashIcon } from '@heroicons/react/24/outline';

import { formatDate, machineLabel } from '../../utils/repair';

function Skeleton() {
  return (
    <div className="divide-y divide-gray-100">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex gap-4 px-6 py-3">
          <div className="h-5 w-40 animate-pulse rounded bg-gray-100" />
          <div className="h-5 w-24 animate-pulse rounded bg-gray-100" />
          <div className="h-5 flex-1 animate-pulse rounded bg-gray-100" />
          <div className="h-5 w-20 animate-pulse rounded bg-gray-100" />
        </div>
      ))}
    </div>
  );
}

export default function ServiceRequestTable({
  items,
  loading,
  hasActiveFilters,
  onResetFilters,
  onDelete,
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
            : 'Henüz servis/hizmet talebi bulunmuyor'}
        </p>
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={onResetFilters}
            className="mt-3 text-sm font-medium text-blue-600 hover:underline"
          >
            Filtreleri temizle
          </button>
        ) : (
          <p className="mt-2 text-xs text-gray-400">
            Servis form no, firma veya makine ile arama yapabilirsiniz
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {loading && (
        <div className="h-0.5 w-full overflow-hidden bg-blue-100">
          <div className="h-full w-1/3 animate-pulse bg-blue-500" />
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full" style={{ fontFamily: 'Inter' }}>
          <thead className="bg-gray-100 text-[11px] uppercase text-gray-700">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium">Servis Form</th>
              <th className="px-4 py-2.5 text-left font-medium">ID No</th>
              <th className="px-4 py-2.5 text-left font-medium">Firma</th>
              <th className="px-4 py-2.5 text-left font-medium">Hizmet Tanımı</th>
              <th className="px-4 py-2.5 text-left font-medium">Tarih</th>
              <th className="px-4 py-2.5 text-left font-medium">Kayıt</th>
              <th className="px-4 py-2.5 text-right font-medium">İşlem</th>
            </tr>
          </thead>

          <tbody className="text-sm text-gray-800">
            {items.map((item) => {
              const deleting =
                rowBusy?.scope === 'serviceRequests' &&
                rowBusy?.id === item.id &&
                rowBusy?.action === 'delete';

              return (
                <tr
                  key={item.id}
                  className="border-t border-gray-100 align-top hover:bg-gray-50"
                >
                  <td className="px-4 py-2.5">
                    <p className="text-[13px] font-medium text-gray-900">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      No: {item.service_form_no}
                    </p>
                  </td>

                  <td className="px-4 py-2.5">
                    <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-700">
                      {machineLabel(item) || '—'}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-4 py-2.5 text-[12px] text-gray-700">
                    {item.company_name}
                  </td>

                  <td className="max-w-md px-4 py-2.5 text-[12px] text-gray-700">
                    <p className="line-clamp-2" title={item.service_description}>
                      {item.service_description}
                    </p>
                  </td>

                  <td className="whitespace-nowrap px-4 py-2.5 text-[12px] text-gray-700">
                    {formatDate(item.request_date)}
                  </td>

                  <td className="whitespace-nowrap px-4 py-2.5 text-[12px] text-gray-500">
                    {item.created_by_name || '—'}
                  </td>

                  <td className="whitespace-nowrap px-4 py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => onDelete(item)}
                      disabled={deleting}
                      title="Talebi sil"
                      aria-label={`${item.title} talebini sil`}
                      className="rounded-lg p-1.5 text-red-600 transition hover:bg-red-50 disabled:opacity-40"
                    >
                      {deleting ? (
                        <ArrowPathIcon className="h-4 w-4 animate-spin" />
                      ) : (
                        <TrashIcon className="h-4 w-4" />
                      )}
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
