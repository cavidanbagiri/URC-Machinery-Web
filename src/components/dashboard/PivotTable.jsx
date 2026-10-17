// src/components/dashboard/PivotTable.jsx
import { useSelector } from 'react-redux';
import { Table2 } from 'lucide-react';

export default function PivotTable() {
  const { pivot, pivotLoading } = useSelector((s) => s.dashboard);
  const { territories, rows, grand_totals, grand_total } = pivot;

  if (pivotLoading) {
    return (
      <div className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-5 py-4">
          <div className="h-5 w-48 animate-pulse rounded bg-gray-100" />
        </div>
        <div className="flex-1 space-y-2 p-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-7 animate-pulse rounded bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  if (!rows.length || grand_total === 0) {
    return (
      <div className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900">Ekipman Kod Tanımları</h2>
        <div className="mt-4 flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/60 py-14">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
            <Table2 className="h-5 w-5" />
          </div>
          <p className="mt-3 text-sm font-medium text-gray-600">Hələ heç bir maşın yoxdur</p>
          <p className="mt-1 text-xs text-gray-400">
            Maşın əlavə etdikdə burada bölgü görünəcək
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[480px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3.5">
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            Ekipman Kod Tanımları
          </h2>
          <p className="mt-0.5 text-xs text-gray-500">Territory üzrə bölgü</p>
        </div>
        <div className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-100">
          Cəmi: {grand_total}
        </div>
      </div>

      {/* Scrollable table area — flex-1 + min-h-0 kritikdir */}
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full border-separate border-spacing-0">
          <thead>
            <tr>
              <th className="sticky left-0 top-0 z-20 whitespace-nowrap border-b border-gray-200 bg-gray-50 px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                Ekipman
              </th>
              {territories.map((t) => (
                <th
                  key={t.id}
                  className="sticky top-0 z-10 whitespace-nowrap border-b border-gray-200 bg-gray-50 px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-gray-500"
                >
                  {t.name}
                </th>
              ))}
              <th className="sticky right-0 top-0 z-20 whitespace-nowrap border-b border-l border-gray-200 bg-blue-50 px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-blue-700">
                Toplam
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.type_id}
                className={i % 2 === 1 ? 'bg-gray-50/40' : 'bg-white'}
              >
                <td className="sticky left-0 z-10 whitespace-nowrap border-b border-gray-100 bg-inherit px-4 py-2 text-sm font-medium text-gray-900">
                  {row.type_name}
                </td>
                {territories.map((t) => {
                  const c = row.counts[String(t.id)] || 0;
                  return (
                    <td
                      key={t.id}
                      className={`whitespace-nowrap border-b border-gray-100 px-3 py-2 text-center text-sm ${
                        c > 0
                          ? 'font-semibold text-gray-900'
                          : 'text-gray-300'
                      }`}
                    >
                      {c > 0 ? c : '—'}
                    </td>
                  );
                })}
                <td className="sticky right-0 z-10 whitespace-nowrap border-b border-l border-gray-100 bg-blue-50/40 px-3 py-2 text-center text-sm font-bold text-blue-700">
                  {row.total}
                </td>
              </tr>
            ))}
          </tbody>

          <tfoot>
            <tr>
              <td className="sticky bottom-0 left-0 z-20 whitespace-nowrap border-t border-gray-200 bg-gray-100 px-4 py-2.5 text-sm font-bold text-gray-900">
                Toplam
              </td>
              {territories.map((t) => (
                <td
                  key={t.id}
                  className="sticky bottom-0 z-10 whitespace-nowrap border-t border-gray-200 bg-gray-100 px-3 py-2.5 text-center text-sm font-bold text-gray-900"
                >
                  {grand_totals[String(t.id)] || 0}
                </td>
              ))}
              <td className="sticky bottom-0 right-0 z-20 whitespace-nowrap border-l border-t border-gray-200 bg-blue-100 px-3 py-2.5 text-center text-sm font-bold text-blue-800">
                {grand_total}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}