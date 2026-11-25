// src/components/settings/LookupTable.jsx
import { PencilSquareIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Inbox } from 'lucide-react';

import { TABLE_HEAD, TABLE_ROW } from '../ui/tableStyles';

const COLOR_DOT = {
  gray: 'bg-slate-400',
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
  blue: 'bg-blue-500',
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  purple: 'bg-purple-500',
};

function SkeletonRow() {
  return (
    <tr>
      <td className="px-6 py-3"><div className="h-3 w-10 animate-pulse rounded bg-slate-100" /></td>
      <td className="px-6 py-3"><div className="h-4 w-48 animate-pulse rounded bg-slate-100" /></td>
      <td className="px-6 py-3">
        <div className="flex justify-end gap-2">
          <div className="h-7 w-7 animate-pulse rounded-lg bg-slate-100" />
          <div className="h-7 w-7 animate-pulse rounded-lg bg-slate-100" />
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
  showColor = false,
}) {
  return (
    <div>
      {/* Sub-header (kart artıq yuxarıda — burada yalnız başlıq + button) */}
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">{configLabel}</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Toplam: <span className="font-medium text-slate-700">{items.length}</span> öğe
          </p>
        </div>
        <button
          onClick={onCreate}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          <PlusIcon className="h-4 w-4" strokeWidth={2.4} />
          Yeni Ekle
        </button>
      </div>

      {/* Body */}
      {loading ? (
        <div className="border-t border-slate-100">
          <table className="w-full">
            <tbody className="divide-y divide-slate-100">
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </tbody>
          </table>
        </div>
      ) : items.length === 0 ? (
        <div className="border-t border-slate-100 px-6 py-12">
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 py-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-400 ring-1 ring-slate-200">
              <Inbox className="h-5 w-5" />
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-900">Henüz hiçbir öğe yok</p>
            <p className="mt-1 text-[12px] text-slate-500">İlk öğeyi ekleyerek başlayın</p>
            <button
              onClick={onCreate}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              <PlusIcon className="h-4 w-4" strokeWidth={2.4} />
              İlk Öğeyi Ekle
            </button>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto border-t border-slate-100">
          <table className="w-full">
            <thead className={TABLE_HEAD}>
              <tr>
                <th className="px-6 py-2.5 text-left">
                  ID
                </th>
                <th className="px-6 py-2.5 text-left">
                  Ad
                </th>
                <th className="px-6 py-2.5 text-right">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item, i) => (
                <tr
                  key={item.id}
                  className={`${TABLE_ROW} ${i % 2 === 1 ? 'bg-slate-50/30' : ''}`}
                >
                  <td className="px-6 py-3 text-xs font-mono text-slate-400">
                    #{item.id}
                  </td>
                  <td className="px-6 py-3 text-sm font-medium text-slate-900">
                    {showColor && (
                      <span
                        className={`mr-2 inline-block h-2.5 w-2.5 rounded-full ${COLOR_DOT[item.color] || COLOR_DOT.gray}`}
                        aria-label={`Renk: ${item.color || 'gray'}`}
                      />
                    )}
                    {item.name}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => onEdit(item)}
                        aria-label={`${item.name} düzenle`}
                        title="Düzenle"
                        className="rounded-lg p-2 text-slate-500 transition hover:bg-blue-100 hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDelete(item)}
                        aria-label={`${item.name} sil`}
                        title="Sil"
                        className="rounded-lg p-2 text-slate-500 transition hover:bg-red-100 hover:text-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
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