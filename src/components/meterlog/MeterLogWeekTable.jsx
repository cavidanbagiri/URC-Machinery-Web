// src/components/meterlog/MeterLogWeekTable.jsx
//
// Son 7 (veya seçilen pencere) günün özeti.  Her hücrede o günün **son** kaydı
// gösterilir; aynı gün birden fazla kayıt varsa "+N" rozeti ve tooltip ile
// kaç kayıt olduğu / kimin girdiği belirtilir.  Kayıtlar silinmediği için eski
// girişler de burada izlenebilir.
import { CalendarDaysIcon, ClockIcon } from '@heroicons/react/24/outline';

import { formatDateTime, formatNumber } from '../../utils/maintenance';
import { groupLogsByDate } from '../../utils/meterLog';
import {
  TABLE_BODY,
  TABLE_CARD,
  TABLE_HEAD,
  TABLE_ROW,
  TABLE_TOOLBAR,
} from '../ui/tableStyles';

function machineLabel(machine) {
  return machine.identification_no || machine.plate_no || `#${machine.machine_id}`;
}

function cellTitle(date, group) {
  if (!group) return `${date.label}: kayıt yok`;

  const parts = [
    `${group.count} kayıt`,
    `Son: ${formatDateTime(group.latest.created_at)}`,
  ];
  if (group.latest.entered_by_name) parts.push(group.latest.entered_by_name);
  return `${date.label} · ${parts.join(' · ')}`;
}

export default function MeterLogWeekTable({
  machines,
  dates,
  selectedDate,
  loading = false,
}) {
  // Tarih penceresi henüz sunucudan gelmediyse (ilk yükleme) kart hiç çizilmez.
  if (!dates.length) return null;

  const minWidth = 230 + dates.length * 155;

  return (
    <div className={TABLE_CARD}>
      {loading && (
        <div className="h-0.5 w-full overflow-hidden bg-blue-100">
          <div className="h-full w-1/3 animate-pulse bg-blue-500" />
        </div>
      )}

      <div className={TABLE_TOOLBAR}>
        <div className="flex items-center gap-2">
          <CalendarDaysIcon className="h-4 w-4 text-slate-400" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Geçmiş Kayıtlar
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 tabular-nums">
            {machines.length}
          </span>
        </div>
        <span className="text-[11px] text-slate-400">
          Son {dates.length} gün · hücreye gelerek kayıt sayısını görün
        </span>
      </div>

      <div className="max-h-[60vh] overflow-auto">
        <table
          className="w-full table-fixed border-collapse text-left"
          style={{ minWidth }}
        >
          <colgroup>
            <col style={{ width: 230 }} />
            {dates.map((date) => (
              <col key={date.iso} style={{ width: 155 }} />
            ))}
          </colgroup>

          <thead className={`sticky top-0 z-20 backdrop-blur ${TABLE_HEAD}`}>
            <tr>
              <th className="sticky left-0 top-0 z-30 border-b border-slate-200/80 bg-slate-50/95 px-4 py-2.5 text-left font-semibold">
                Makine
              </th>
              {dates.map((date) => {
                const isSelected = date.iso === selectedDate;
                return (
                  <th
                    key={date.iso}
                    className={`sticky top-0 z-20 border-b border-slate-200/80 px-2 py-2.5 text-center font-semibold ${
                      isSelected ? 'bg-blue-50 text-blue-700' : 'bg-slate-50/95'
                    }`}
                  >
                    <span className="block text-[11px]">{date.weekday}</span>
                    <span className="block text-[10px] font-normal text-slate-400">
                      {date.day} {date.month}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className={`divide-y divide-slate-100 ${TABLE_BODY}`}>
            {machines.length === 0 && (
              <tr>
                <td
                  colSpan={dates.length + 1}
                  className="px-6 py-16 text-center"
                >
                  <div className="flex flex-col items-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <ClockIcon className="h-5 w-5" />
                    </span>
                    <p className="mt-3 text-sm font-semibold text-slate-900">
                      Gösterilecek kayıt yok
                    </p>
                    <p className="mt-1 max-w-md text-[12px] text-slate-500">
                      Arama veya filtre seçimini değiştirmeyi deneyin.
                    </p>
                  </div>
                </td>
              </tr>
            )}

            {machines.map((machine) => {
              const groups = groupLogsByDate(machine.recent_logs);
              const label = machineLabel(machine);

              return (
                <tr key={machine.machine_id} className={TABLE_ROW}>
                  <td className="sticky left-0 z-10 border-r border-slate-100 bg-white px-4 py-2.5 group-hover:bg-slate-50/70">
                    <p className="truncate text-[12px] font-semibold text-slate-900">
                      {label}
                    </p>
                    <p className="truncate text-[10px] text-slate-400">
                      {machine.plate_no || machine.vin_no || '—'}
                    </p>
                  </td>

                  {dates.map((date) => {
                    const group = groups.get(date.iso);
                    const isSelected = date.iso === selectedDate;

                    return (
                      <td
                        key={date.iso}
                        title={cellTitle(date, group)}
                        className={`px-2 py-2.5 align-top ${
                          isSelected ? 'bg-blue-50/60' : ''
                        }`}
                      >
                        {group ? (
                          <div className="space-y-0.5">
                            <p className="flex items-center justify-between gap-1 text-[11px]">
                              <span className="text-[9px] font-semibold uppercase text-slate-400">
                                KM
                              </span>
                              <span className="font-medium text-slate-800 tabular-nums">
                                {formatNumber(group.latest.km)}
                              </span>
                            </p>
                            <p className="flex items-center justify-between gap-1 text-[11px]">
                              <span className="text-[9px] font-semibold uppercase text-slate-400">
                                Saat
                              </span>
                              <span className="font-medium text-slate-800 tabular-nums">
                                {formatNumber(group.latest.engine_hours)}
                              </span>
                            </p>
                            {group.count > 1 && (
                              <span className="inline-flex rounded-full bg-amber-50 px-1.5 py-0.5 text-[9px] font-medium text-amber-700 ring-1 ring-inset ring-amber-200">
                                +{group.count - 1} kayıt
                              </span>
                            )}
                          </div>
                        ) : (
                          <p className="pt-1 text-center text-[12px] text-slate-300">
                            —
                          </p>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
