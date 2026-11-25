// src/components/rentalmachine/RentalMachineTypeStats.jsx
// "Makine Tipine Göre İstatistik" paneli: kiralamaların makine tipi dağılımı.
// Veri `GET /rental-machines/fetch_rental_machines` cevabındaki `type_stats`
// alanından gelir (sunucu tarafında `GROUP BY machine_type_id`), böylece panel
// tablodaki durum rozetleriyle her zaman aynı sayıları gösterir.
//
// Bir tipe tıklamak listeyi `machine_type_id` filtresiyle daraltır; aynı tipe
// tekrar tıklamak filtreyi kaldırır. Panel sayaçları tip filtresi hariç diğer
// filtreleri uygular, bu yüzden seçili tip panelden kaybolmaz.
import { useMemo } from 'react';
import { CalendarClock, ChartBarBig, CheckCircle2, XCircle } from 'lucide-react';

const PANEL = 'rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm';

const CHIP_TONES = {
  slate: 'bg-slate-100 text-slate-700',
  green: 'bg-emerald-50 text-emerald-700',
  blue: 'bg-blue-50 text-blue-700',
  rose: 'bg-rose-50 text-rose-700',
};

function StatChip({ label, value, tone = 'slate' }) {
  return (
    <span
      className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium ${CHIP_TONES[tone]}`}
    >
      {label}
      <span className="text-xs font-semibold tabular-nums">{value}</span>
    </span>
  );
}

function SkeletonRows() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="h-[52px] animate-pulse rounded-lg bg-slate-100"
        />
      ))}
    </div>
  );
}

export default function RentalMachineTypeStats({
  stats,
  loading,
  activeTypeId,
  onSelectType,
}) {
  const rows = useMemo(() => {
    const list = Array.isArray(stats) ? stats : [];
    return list
      .map((entry) => ({
        ...entry,
        total: Number(entry.total) || 0,
        active_count: Number(entry.active_count) || 0,
        planned_count: Number(entry.planned_count) || 0,
        expired_count: Number(entry.expired_count) || 0,
      }))
      .filter((entry) => entry.total > 0)
      .sort(
        (a, b) =>
          b.total - a.total || a.type_name.localeCompare(b.type_name, 'tr')
      );
  }, [stats]);

  const totals = rows.reduce(
    (acc, entry) => ({
      total: acc.total + entry.total,
      active: acc.active + entry.active_count,
      planned: acc.planned + entry.planned_count,
      expired: acc.expired + entry.expired_count,
    }),
    { total: 0, active: 0, planned: 0, expired: 0 }
  );

  const maxTotal = rows.length ? rows[0].total : 0;

  return (
    <section className={PANEL} aria-label="Makine tipine göre istatistik">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <ChartBarBig className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-gray-900">
              Makine Tipine Göre İstatistik
            </h2>
            <p className="text-[11px] text-gray-500">
              Kiralamaların makine tipi dağılımı · tip filtresi hariç diğer
              filtreler uygulanır
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <StatChip label="Toplam" value={totals.total} />
          <StatChip label="Aktif" value={totals.active} tone="green" />
          <StatChip label="Planlandı" value={totals.planned} tone="blue" />
          <StatChip label="Süresi doldu" value={totals.expired} tone="rose" />
        </div>
      </div>

      <div className="mt-3 border-t border-slate-100 pt-3">
        {loading && rows.length === 0 ? (
          <SkeletonRows />
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center">
            <ChartBarBig className="h-5 w-5 text-slate-400" />
            <p className="text-sm font-medium text-gray-700">
              İstatistik için kayıt yok
            </p>
            <p className="text-[11px] text-gray-500">
              Kiralama kaydı eklediğinizde makine tipi dağılımı burada görünür.
            </p>
          </div>
        ) : (
          <div className="max-h-[260px] space-y-1.5 overflow-y-auto pr-1">
            {rows.map((entry) => {
              const clickable =
                entry.type_id !== null && entry.type_id !== undefined;
              const active =
                clickable && String(entry.type_id) === String(activeTypeId);
              const width = maxTotal
                ? Math.max(6, Math.round((entry.total / maxTotal) * 100))
                : 0;
              const share = totals.total
                ? Math.round((entry.total / totals.total) * 100)
                : 0;

              return (
                <button
                  key={entry.type_id ?? entry.type_name}
                  type="button"
                  disabled={!clickable}
                  aria-pressed={clickable ? active : undefined}
                  title={
                    !clickable
                      ? 'Makine tipi atanmamış kayıtlar'
                      : active
                        ? `${entry.type_name} filtresini kaldır`
                        : `${entry.type_name} kiralamalarını listele`
                  }
                  onClick={() => onSelectType?.(active ? '' : entry.type_id)}
                  className={`block w-full rounded-lg border px-3 py-2 text-left transition ${
                    active
                      ? 'border-blue-300 bg-blue-50/70'
                      : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                  } ${clickable ? '' : 'cursor-default'}`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-[13px] font-medium text-gray-800">
                      {entry.type_name}
                    </span>
                    <span className="flex shrink-0 items-center gap-1.5">
                      <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-700">
                        {entry.total}
                      </span>
                      <span className="text-[11px] text-gray-500">
                        {share}%
                      </span>
                    </span>
                  </span>

                  <span className="mt-1.5 block h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <span
                      className={`block h-full rounded-full ${
                        active ? 'bg-blue-600' : 'bg-blue-400'
                      }`}
                      style={{ width: `${width}%` }}
                    />
                  </span>

                  <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-gray-500">
                    <span className="inline-flex items-center gap-1 text-emerald-600">
                      <CheckCircle2 className="h-3 w-3" />
                      {entry.active_count} aktif
                    </span>
                    <span className="inline-flex items-center gap-1 text-blue-600">
                      <CalendarClock className="h-3 w-3" />
                      {entry.planned_count} planlandı
                    </span>
                    <span className="inline-flex items-center gap-1 text-rose-600">
                      <XCircle className="h-3 w-3" />
                      {entry.expired_count} süresi doldu
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {rows.length > 0 && (
        <p className="mt-2 text-[11px] text-gray-400">
          Bir makine tipine tıklayarak listeyi filtreleyin
          {activeTypeId ? ', tekrar tıklayarak filtreyi kaldırın' : ''}.
        </p>
      )}
    </section>
  );
}
