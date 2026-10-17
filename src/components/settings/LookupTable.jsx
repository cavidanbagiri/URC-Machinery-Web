// src/components/settings/LookupTable.jsx
import { PencilSquareIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Inbox } from 'lucide-react';

function SkeletonRow() {
  return (
    <tr>
      <td className="px-6 py-3"><div className="h-3 w-10 animate-pulse rounded bg-gray-100" /></td>
      <td className="px-6 py-3"><div className="h-4 w-48 animate-pulse rounded bg-gray-100" /></td>
      <td className="px-6 py-3">
        <div className="flex justify-end gap-2">
          <div className="h-7 w-7 animate-pulse rounded-lg bg-gray-100" />
          <div className="h-7 w-7 animate-pulse rounded-lg bg-gray-100" />
        </div>
      </td>
    </tr>
  );
}

export default function LookupTable({
  items,
  loading,
  onCreate,
  onEdit,
  onDelete,
  configLabel,
}) {
  return (
    <div>
      {/* Sub-header (kart artıq yuxarıda — burada yalnız başlıq + button) */}
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">{configLabel}</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Cəmi: <span className="font-medium text-gray-700">{items.length}</span> element
          </p>
        </div>
        <button
          onClick={onCreate}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          <PlusIcon className="h-4 w-4" strokeWidth={2.4} />
          Yeni əlavə et
        </button>
      </div>

      {/* Body */}
      {loading ? (
        <div className="border-t border-gray-100">
          <table className="w-full">
            <tbody className="divide-y divide-gray-100">
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </tbody>
          </table>
        </div>
      ) : items.length === 0 ? (
        <div className="border-t border-gray-100 px-6 py-12">
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/60 py-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-gray-400 ring-1 ring-gray-200">
              <Inbox className="h-5 w-5" />
            </div>
            <p className="mt-3 text-sm font-medium text-gray-700">Hələ heç bir element yoxdur</p>
            <p className="mt-1 text-xs text-gray-500">İlk elementi əlavə edərək başlayın</p>
            <button
              onClick={onCreate}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              <PlusIcon className="h-4 w-4" strokeWidth={2.4} />
              İlk elementi əlavə et
            </button>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto border-t border-gray-100">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/70">
                <th className="px-6 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  ID
                </th>
                <th className="px-6 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  Ad
                </th>
                <th className="px-6 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  Əməliyyatlar
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item, i) => (
                <tr
                  key={item.id}
                  className={`transition-colors hover:bg-blue-50/40 ${i % 2 === 1 ? 'bg-gray-50/30' : 'bg-white'}`}
                >
                  <td className="px-6 py-3 text-xs font-mono text-gray-400">
                    #{item.id}
                  </td>
                  <td className="px-6 py-3 text-sm font-medium text-gray-900">
                    {item.name}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => onEdit(item)}
                        aria-label={`${item.name} redaktə et`}
                        title="Redaktə et"
                        className="rounded-lg p-2 text-gray-500 transition hover:bg-blue-100 hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDelete(item)}
                        aria-label={`${item.name} sil`}
                        title="Sil"
                        className="rounded-lg p-2 text-gray-500 transition hover:bg-red-100 hover:text-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}