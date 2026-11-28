// src/components/repair/RepairArchiveTypeStats.jsx
// "Arşiv" sekmesinde, "Devam eden" sekmesindeki KPI kartlarının yerinde duran
// panel: kapanmış (tamamlandı / iptal edildi) tamirlerin "Tamir Tipi" dağılımı.
// Veri /repair/summary -> by_type alanından gelir; bir tipe tıklamak arşiv
// listesini sunucu tarafında o tipe filtreler (aynı tipe tekrar tıklamak
// filtreyi kaldırır). Kart tam genişlik kaplamaz (~%40), sağda özet çipleri.
import { useMemo } from 'react';
import { Archive, CheckCircle2, Timer, XCircle } from 'lucide-react';

const PANEL = 'rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm';

const CHIP_TONES = {
  slate: 'bg-slate-100 text-slate-700',
  green: 'bg-emerald-50 text-emerald-700',
  rose: 'bg-rose-50 text-rose-700',
  indigo: 'bg-indigo-50 text-indigo-700',
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
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="h-[52px] animate-pulse rounded-lg bg-slate-100"
        />
      ))}
    </div>
  );
}

export default function RepairArchiveTypeStats({
  summary,
  loading,
  activeTypeId,
  onSelectType,
}) {
  const rows = useMemo(() => {
    const list = summary?.by_type || [];
    return list
      .map((entry) => {
        const completed = entry.completed_count ?? 0;
        const cancelled = entry.cancelled_count ?? 0;
        // Eski bir API yanıtında arşiv sayaçları yoksa "toplam - aktif" ile
        // türetilir; panel bu durumda da doğru sayıyı gösterir.
        const archived =
          entry.archived_count ??
          (completed + cancelled ||
            Math.max(0, (entry.count ?? 0) - (entry.active_count ?? 0)));
        return { ...entry, completed, cancelled, archived };
      })
      .filter((entry) => entry.archived > 0)
      .sort(
        (a, b) => b.archived - a.archived || a.name.localeCompare(b.name, 'tr')
      );
  }, [summary]);

  const totals = rows.reduce(
    (acc, entry) => ({
      archived: acc.archived + entry.archived,
      completed: acc.completed + entry.completed,
      cancelled: acc.cancelled + entry.cancelled,
    }),
    { archived: 0, completed: 0, cancelled: 0 }
  );

  // Tipin "ortalama arızada kalma" süresi, tamamlanan kayıt sayısıyla
  // ağırlıklandırılarak tek bir ortalamaya indirilir.
  const weighted = rows.reduce(
    (acc, entry) =>
      entry.average_repair_days === null ||
      entry.average_repair_days === undefined
        ? acc
        : {
            days: acc.days + entry.average_repair_days * entry.completed,
            count: acc.count + entry.completed,
          },
    { days: 0, count: 0 }
  );
  const averageDays = weighted.count
    ? Math.round((weighted.days / weighted.count) * 10) / 10
    : null;

  const maxArchived = rows.length ? rows[0].archived : 0;

  return (
    <section className={PANEL} aria-label="Tamir tipine göre arşiv istatistiği">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <Archive className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-gray-900">
              Tamir Türüne Göre İstatistik
            </h2>
            <p className="text-[11px] text-gray-500">
              Arşivdeki Tamamlanan ve İptal Edilen Kayıtların Tamir Tipi
              Dağılımı · Tüm Arşiv
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <StatChip label="Arşiv" value={totals.archived} />
          <StatChip label="Tamamlandı" value={totals.completed} tone="green" />
          <StatChip label="İptal" value={totals.cancelled} tone="rose" />
          {averageDays !== null && (
            <StatChip
              label="Ort. süre"
              value={`${averageDays} gün`}
              tone="indigo"
            />
          )}
        </div>
      </div>

      <div className="mt-3 border-t border-slate-100 pt-3">
        {loading && !summary ? (
          <SkeletonRows />
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center">
            <Archive className="h-5 w-5 text-slate-400" />
            <p className="text-sm font-medium text-gray-700">
              Arşivde kayıt yok
            </p>
            <p className="text-[11px] text-gray-500">
              Tamamlanan veya iptal edilen tamirler burada tamir tipine göre
              gruplanır.
            </p>
          </div>
        ) : (
          <div className="max-h-[340px] space-y-1.5 overflow-y-auto pr-1">
            {rows.map((entry) => {
              const active = String(entry.repair_type_id) === String(activeTypeId);
              const width = maxArchived
                ? Math.max(6, Math.round((entry.archived / maxArchived) * 100))
                : 0;
              const share = totals.archived
                ? Math.round((entry.archived / totals.archived) * 100)
                : 0;

              return (
                <button
                  key={entry.repair_type_id}
                  type="button"
                  aria-pressed={active}
                  title={
                    active
                      ? `${entry.name} filtresini kaldır`
                      : `${entry.name} arşiv kayıtlarını listele`
                  }
                  onClick={() =>
                    onSelectType?.(active ? null : entry.repair_type_id)
                  }
                  className={`block w-full rounded-lg border px-3 py-2 text-left transition ${
                    active
                      ? 'border-blue-300 bg-blue-50/70'
                      : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-[13px] font-medium text-gray-800">
                      {entry.name}
                    </span>
                    <span className="flex shrink-0 items-center gap-1.5">
                      <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-700">
                        {entry.archived}
                      </span>
                      <span className="text-[11px] text-gray-500">{share}%</span>
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
                      {entry.completed} tamamlandı
                    </span>
                    <span className="inline-flex items-center gap-1 text-rose-600">
                      <XCircle className="h-3 w-3" />
                      {entry.cancelled} iptal
                    </span>
                    {entry.average_repair_days !== null &&
                      entry.average_repair_days !== undefined && (
                        <span className="inline-flex items-center gap-1 text-indigo-600">
                          <Timer className="h-3 w-3" />
                          ort. {entry.average_repair_days} gün
                        </span>
                      )}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {rows.length > 0 && (
        <p className="mt-2 text-[11px] text-gray-400">
          Bir Tamir Tipine Tıklayarak Arşiv Listesini Filtreleyin
          {activeTypeId ? ', tekrar tıklayarak filtreyi kaldırın' : ''}.
        </p>
      )}
    </section>
  );
}
