// src/components/repair/RepairTable.jsx
import {
  ArrowPathIcon,
  ChatBubbleLeftEllipsisIcon,
  CheckCircleIcon,
  ClockIcon,
  PencilSquareIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

import StatusBadge from '../machines/StatusBadge';
import { durationLabel, formatDate, remainingLabel } from '../../utils/repair';

function ActionButton({ title, onClick, tone = 'blue', children }) {
  const tones = {
    blue: 'text-blue-600 hover:bg-blue-50',
    green: 'text-emerald-600 hover:bg-emerald-50',
    gray: 'text-gray-500 hover:bg-gray-100',
    red: 'text-red-600 hover:bg-red-50',
    amber: 'text-amber-600 hover:bg-amber-50',
  };

  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`rounded-lg p-1.5 transition ${
        tones[tone] || tones.blue
      }`}
    >
      {children}
    </button>
  );
}

function Skeleton() {
  return (
    <div className="divide-y divide-gray-100">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex gap-4 px-6 py-3">
          <div className="h-5 w-20 animate-pulse rounded-full bg-gray-100" />
          <div className="h-5 w-28 animate-pulse rounded bg-gray-100" />
          <div className="h-5 w-24 animate-pulse rounded bg-gray-100" />
          <div className="h-5 flex-1 animate-pulse rounded bg-gray-100" />
          <div className="h-5 w-24 animate-pulse rounded bg-gray-100" />
        </div>
      ))}
    </div>
  );
}

export default function RepairTable({
  items,
  loading,
  hasActiveFilters,
  onOpenFilters,
  onResetFilters,
  onEdit,
  onCloseRepair,
  onCancel,
  onReopen,
  onNote,
  onHistory,
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
            : 'Henüz tamir kaydı bulunmuyor'}
        </p>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters || onOpenFilters}
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
      {loading && (
        <div className="h-0.5 w-full overflow-hidden bg-blue-100">
          <div className="h-full w-1/3 animate-pulse bg-blue-500" />
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full" style={{ fontFamily: 'Inter' }}>
          <thead className="bg-gray-100 text-[11px] uppercase text-gray-700">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium">Durum</th>
              <th className="px-4 py-2.5 text-left font-medium">Makine</th>
              <th className="px-4 py-2.5 text-left font-medium">Tamir Tipi</th>
              <th className="px-4 py-2.5 text-left font-medium">Arıza Yeri</th>
              <th className="px-4 py-2.5 text-left font-medium">Giriş</th>
              <th className="px-4 py-2.5 text-left font-medium">Tahmini Çıkış</th>
              <th className="px-4 py-2.5 text-left font-medium">Çıkış</th>
              <th className="px-4 py-2.5 text-right font-medium">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((item) => {
              const isActive = item.status === 'tamirde';
              const remaining = remainingLabel(item);

              return (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-2.5 ">
                    <StatusBadge status={item.status_detail} />
                  </td>

                  <td className="whitespace-nowrap px-4 py-2.5">
                    <p className="text-[12px] font-medium text-gray-900">
                      {item.identification_no || `Makine #${item.machine_id}`}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {[item.plate_no, item.territory_name]
                        .filter(Boolean)
                        .join(' · ') || '—'}
                    </p>
                  </td>

                  <td className="whitespace-nowrap px-4 py-2.5 text-[12px] text-gray-700">
                    {item.repair_type_name || '—'}
                  </td>

                  <td className="max-w-[220px] px-4 py-2.5 text-[12px] text-gray-700">
                    <p className="truncate">{item.fault_location || '—'}</p>
                    {item.notes && (
                      <p className="truncate text-[11px] text-gray-400">
                        {item.notes}
                      </p>
                    )}
                  </td>

                  <td className="whitespace-nowrap px-4 py-2.5 text-[12px] text-gray-700">
                    <p>{formatDate(item.entry_date)}</p>
                    <p className="text-[11px] text-gray-500">
                      {durationLabel(item.duration_days)}
                    </p>
                  </td>

                  <td className="whitespace-nowrap px-4 py-2.5 text-[12px]">
                    <p
                      className={
                        item.is_overdue
                          ? 'font-semibold text-red-600'
                          : 'text-gray-700'
                      }
                    >
                      {formatDate(item.estimated_exit_date)}
                    </p>
                    {remaining && (
                      <p
                        className={`text-[11px] ${
                          item.is_overdue
                            ? 'font-medium text-red-600'
                            : 'text-gray-500'
                        }`}
                      >
                        {remaining}
                      </p>
                    )}
                  </td>

                  <td className="whitespace-nowrap px-4 py-2.5 text-[12px] text-gray-700">
                    {formatDate(item.exit_date)}
                  </td>

                  <td className="whitespace-nowrap px-4 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {isActive && (
                        <>
                          <ActionButton
                            title="Tamir kaydını düzenle"
                            onClick={() => onEdit(item)}
                            tone="blue"
                          >
                            <PencilSquareIcon className="h-4 w-4" />
                          </ActionButton>

                          <ActionButton
                            title="Tamiri tamamla"
                            onClick={() => onCloseRepair(item)}
                            tone="green"
                          >
                            <CheckCircleIcon className="h-4 w-4" />
                          </ActionButton>

                          <ActionButton
                            title="Tamiri iptal et"
                            onClick={() => onCancel(item)}
                            tone="red"
                          >
                            <XCircleIcon className="h-4 w-4" />
                          </ActionButton>
                        </>
                      )}

                      {!isActive && (
                        <ActionButton
                          title="Tamiri yeniden aç"
                          onClick={() => onReopen(item)}
                          tone="amber"
                        >
                          <ArrowPathIcon className="h-4 w-4" />
                        </ActionButton>
                      )}

                      <ActionButton
                        title="Not ekle"
                        onClick={() => onNote(item)}
                        tone="gray"
                      >
                        <ChatBubbleLeftEllipsisIcon className="h-4 w-4" />
                      </ActionButton>

                      <ActionButton
                        title="Tamir geçmişi"
                        onClick={() => onHistory(item)}
                        tone="gray"
                      >
                        <ClockIcon className="h-4 w-4" />
                      </ActionButton>
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
