// src/components/meterlog/MeterLogWeekTable.jsx
//
// Son 7 (veya seçilen pencere) günün özeti.  Her hücrede o günün **son** kaydı
// gösterilir; aynı gün birden fazla kayıt varsa "+N" rozeti ve tooltip ile
// kaç kayıt olduğu / kimin girdiği belirtilir.  Kayıtlar silinmediği için eski
// girişler de burada izlenebilir.
import { formatDateTime, formatNumber } from '../../utils/maintenance';
import { groupLogsByDate } from '../../utils/meterLog';

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

export default function MeterLogWeekTable({ machines, dates, selectedDate }) {
  if (!machines.length || !dates.length) return null;

  const minWidth = 230 + dates.length * 155;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="max-h-[45vh] overflow-auto">
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

          <thead className="bg-gray-100 text-[11px] uppercase tracking-wide text-gray-600">
            <tr>
              <th className="sticky left-0 top-0 z-30 border-b border-gray-200 bg-gray-100 px-3 py-2 text-left font-semibold">
                Makine
              </th>
              {dates.map((date) => {
                const isSelected = date.iso === selectedDate;
                return (
                  <th
                    key={date.iso}
                    className={`sticky top-0 z-20 border-b border-gray-200 px-2 py-2 text-center font-semibold ${
                      isSelected ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'
                    }`}
                  >
                    <span className="block text-[11px]">{date.weekday}</span>
                    <span className="block text-[10px] font-normal text-gray-500">
                      {date.day} {date.month}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {machines.map((machine) => {
              const groups = groupLogsByDate(machine.recent_logs);
              const label = machineLabel(machine);

              return (
                <tr key={machine.machine_id} className="group hover:bg-gray-50/70">
                  <td className="sticky left-0 z-10 border-r border-gray-100 bg-white px-3 py-2 group-hover:bg-gray-50">
                    <p className="truncate text-xs font-semibold text-gray-900">
                      {label}
                    </p>
                    <p className="truncate text-[10px] text-gray-400">
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
                        className={`px-2 py-2 align-top ${
                          isSelected ? 'bg-blue-50/60' : ''
                        }`}
                      >
                        {group ? (
                          <div className="space-y-0.5">
                            <p className="flex items-center justify-between gap-1 text-[11px]">
                              <span className="text-[9px] font-semibold uppercase text-gray-400">
                                KM
                              </span>
                              <span className="font-medium text-gray-800">
                                {formatNumber(group.latest.km)}
                              </span>
                            </p>
                            <p className="flex items-center justify-between gap-1 text-[11px]">
                              <span className="text-[9px] font-semibold uppercase text-gray-400">
                                Saat
                              </span>
                              <span className="font-medium text-gray-800">
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
                          <p className="pt-1 text-center text-xs text-gray-300">—</p>
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
