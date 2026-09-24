// src/components/settings/LookupTable.jsx
import { PencilSquareIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';

export default function LookupTable({
  items,
  loading,
  onCreate,
  onEdit,
  onDelete,
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            Siyahı
          </h2>
          <p className="text-xs text-gray-500">
            Cəmi: {items.length} element
          </p>
        </div>
        <button
          onClick={onCreate}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <PlusIcon className="h-4 w-4" />
          Yeni əlavə et
        </button>
      </div>

      {/* Body */}
      {loading ? (
        <div className="p-8 text-center text-sm text-gray-500">
          Yüklənir...
        </div>
      ) : items.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-sm text-gray-500">
            Hələ heç bir element yoxdur.
          </p>
          <button
            onClick={onCreate}
            className="mt-2 text-sm font-medium text-blue-600 hover:underline"
          >
            İlk elementi əlavə edin
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-6 py-3 text-left font-medium">ID</th>
                <th className="px-6 py-3 text-left font-medium">Ad</th>
                <th className="px-6 py-3 text-right font-medium">Əməliyyatlar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-sm text-gray-500">
                    #{item.id}
                  </td>
                  <td className="px-6 py-3 text-sm font-medium text-gray-900">
                    {item.name}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => onEdit(item)}
                        className="rounded-lg p-2 text-gray-500 hover:bg-blue-50 hover:text-blue-600"
                        title="Redaktə et"
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDelete(item)}
                        className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"
                        title="Sil"
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