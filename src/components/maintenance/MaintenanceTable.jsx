// src/components/maintenance/MaintenanceTable.jsx
import {
  CheckCircleIcon,
  ClockIcon,
  PencilSquareIcon,
  PlusCircleIcon,
} from '@heroicons/react/24/outline';

import FlaticonIcon from '../ui/FlaticonIcon';
import StatusBadge from '../machines/StatusBadge';
import {
  formatCounter,
  formatDate,
  formatNumber,
  unitLabel,
} from '../../utils/maintenance';

function ActionButton({ title, onClick, disabled, tone = 'blue', children }) {
  const tones = {
    blue: 'text-blue-600 hover:bg-blue-50',
    green: 'text-emerald-600 hover:bg-emerald-50',
    gray: 'text-gray-500 hover:bg-gray-100',
    amber: 'text-amber-600 hover:bg-amber-50',
  };

  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg p-1.5 transition disabled:cursor-not-allowed disabled:opacity-30 ${
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

function remainingClass(remaining, threshold, statusCode) {
  if (statusCode === 'veri_eksik' || statusCode === 'plan_yok') {
    return 'text-gray-400';
  }
  if (statusCode === 'veri_uyarisi') return 'font-medium text-orange-600';
  if (statusCode === 'pasif') return 'text-slate-500';
  if (remaining === null || remaining === undefined) return 'text-gray-400';
  if (remaining <= 0) return 'font-semibold text-red-600';
  if (threshold !== null && threshold !== undefined && remaining <= threshold) {
    return 'font-semibold text-amber-600';
  }
  return 'text-gray-700';
}

export default function MaintenanceTable({
  items,
  loading,
  hasActiveFilters,
  onOpenFilters,
  onResetFilters,
  onEditPlan,
  onReading,
  onComplete,
  onHistory,
  sortBy,
  sortOrder,
  onSortChange,
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
            : 'Bakım kaydı olan makine bulunmuyor'}
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
              <th className="px-4 py-2.5 text-left font-medium">Bölge</th>
              <th className="px-4 py-2.5 text-left font-medium">Tip</th>
              <th className="px-4 py-2.5 text-left font-medium">Marka / Model</th>
              <th className="px-4 py-2.5 text-left font-medium">Plan</th>
              <th className="px-4 py-2.5 text-left font-medium">Son Bakım</th>
              <th className="px-4 py-2.5 text-left font-medium">Güncel Sayaç</th>
              <th
                className="px-4 py-2.5 text-left font-medium"
                aria-sort={
                  sortBy === 'remaining'
                    ? sortOrder === 'desc'
                      ? 'descending'
                      : 'ascending'
                    : 'none'
                }
              >
                <button
                  type="button"
                  onClick={() => onSortChange?.()}
                  title="Kalan değerine göre sırala"
                  className={`inline-flex items-center gap-1 rounded transition hover:text-blue-700 ${
                    sortBy === 'remaining' ? 'text-blue-700' : ''
                  }`}
                >
                  Kalan
                  <FlaticonIcon
                    name={
                      sortBy === 'remaining'
                        ? `angle-${sortOrder === 'desc' ? 'down' : 'up'}`
                        : 'sort'
                    }
                    size="xs"
                  />
                </button>
              </th>
              <th className="px-4 py-2.5 text-right font-medium">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((item) => {
              const actionDisabled = !item.has_plan || !item.is_active;

              return (
                <tr key={item.machine_id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-2.5">
                    <StatusBadge status={item.status} />
                  </td>

                  <td className="whitespace-nowrap px-4 py-2.5">
                    <p className="text-[12px] font-medium text-gray-900">
                      {item.identification_no || `#${item.machine_id}`}
                    </p>
                    {item.plate_no && (
                      <p className="text-[11px] text-gray-500">{item.plate_no}</p>
                    )}
                  </td>

                  <td className="whitespace-nowrap px-4 py-2.5 text-[12px] text-gray-700">
                    {item.territory_name || '—'}
                  </td>

                  <td className="whitespace-nowrap px-4 py-2.5 text-[12px] text-gray-700">
                    {item.type_name || '—'}
                  </td>

                  <td className="whitespace-nowrap px-4 py-2.5 text-[12px] text-gray-700">
                    <p>{item.car_mark_name || '—'}</p>
                    {item.car_model_name && (
                      <p className="text-[11px] text-gray-500">
                        {item.car_model_name}
                      </p>
                    )}
                  </td>

                  <td className="whitespace-nowrap px-4 py-2.5 text-[12px] text-gray-700">
                    {item.has_plan ? (
                      <span className="inline-flex flex-col">
                        <span>
                          {formatNumber(item.interval_value)}{' '}
                          {unitLabel(item.usage_unit)}
                        </span>
                        {!item.is_active && (
                          <span className="text-[11px] text-slate-500">
                            Pasif plan
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-gray-400">Plan yok</span>
                    )}
                  </td>

                  <td className="whitespace-nowrap px-4 py-2.5 text-[12px] text-gray-700">
                    <p>{formatDate(item.last_maintenance_date)}</p>
                    {item.has_plan && item.last_counter !== null && (
                      <p className="text-[11px] text-gray-500">
                        {formatCounter(item.last_counter, item.usage_unit)}
                      </p>
                    )}
                  </td>

                  <td className="whitespace-nowrap px-4 py-2.5 text-[12px] text-gray-700">
                    <p>{formatCounter(item.current_counter, item.usage_unit)}</p>
                    {item.current_counter_date && (
                      <p className="text-[11px] text-gray-500">
                        {formatDate(item.current_counter_date)}
                      </p>
                    )}
                  </td>

                  <td
                    className={`whitespace-nowrap px-4 py-2.5 text-[12px] ${remainingClass(
                      item.remaining,
                      item.effective_warning_threshold,
                      item.status?.code
                    )}`}
                  >
                    {!item.has_plan
                      ? '—'
                      : item.status?.code === 'veri_uyarisi'
                        ? 'Kontrol gerekli'
                        : formatCounter(item.remaining, item.usage_unit)}
                    {item.next_counter !== null &&
                      item.next_counter !== undefined && (
                        <p className="text-[11px] font-normal text-gray-400">
                          Sonraki:{' '}
                          {formatCounter(item.next_counter, item.usage_unit)}
                        </p>
                      )}
                  </td>

                  <td className="whitespace-nowrap px-4 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <ActionButton
                        title={item.has_plan ? 'Planı düzenle' : 'Plan oluştur'}
                        onClick={() => onEditPlan(item)}
                        tone="blue"
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                      </ActionButton>

                      <ActionButton
                        title={
                          actionDisabled
                            ? 'Sayaç kaydı için aktif plan gerekli'
                            : 'Sayaç kaydı ekle'
                        }
                        onClick={() => onReading(item)}
                        disabled={actionDisabled}
                        tone="amber"
                      >
                        <PlusCircleIcon className="h-4 w-4" />
                      </ActionButton>

                      <ActionButton
                        title={
                          actionDisabled
                            ? 'Bakım tamamlamak için aktif plan gerekli'
                            : 'Bakımı tamamla'
                        }
                        onClick={() => onComplete(item)}
                        disabled={actionDisabled}
                        tone="green"
                      >
                        <CheckCircleIcon className="h-4 w-4" />
                      </ActionButton>

                      <ActionButton
                        title="Bakım geçmişi"
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

