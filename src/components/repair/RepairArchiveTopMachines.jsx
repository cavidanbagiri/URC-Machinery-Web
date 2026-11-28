// src/components/repair/RepairArchiveTopMachines.jsx
// "Arşiv" sekmesinde "Tamir Türüne Göre İstatistik" panelinin yanında duran
// ikinci panel: en çok arıza yapan 5 makine. Veri `GET /api/repair/summary` →
// `top_machines` alanından gelir (backend: `build_top_machines`). Kayıtlar açık
// ve kapanmış tamirlerin tamamını sayar; tamamlandı / iptal / tamirde dağılımı
// satırın altında gösterilir. Panel bilinçli olarak nötr (siyah-beyaz) tutulur.
import { Trophy } from 'lucide-react';

const PANEL = 'rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm';
const MAX_ROWS = 5;

function machineLabel(row) {
  return (
    row?.identification_no ||
    row?.plate_no ||
    `Makine #${row?.machine_id ?? '—'}`
  );
}

function machineMeta(row) {
  return [row?.type_name, row?.car_mark_name, row?.car_model_name]
    .filter(Boolean)
    .join(' · ');
}

function SkeletonRows() {
  return (
    <div className="space-y-2">
      {Array.from({ length: MAX_ROWS }).map((_, index) => (
        <div
          key={index}
          className="h-[62px] animate-pulse rounded-lg bg-slate-100"
        />
      ))}
    </div>
  );
}

export default function RepairArchiveTopMachines({ summary, loading }) {
  const rows = (summary?.top_machines || []).slice(0, MAX_ROWS);
  const maxTotal = rows.reduce(
    (max, row) => Math.max(max, Number(row.total) || 0),
    0
  );
  const totalFaults = rows.reduce(
    (sum, row) => sum + (Number(row.total) || 0),
    0
  );

  return (
    <section className={PANEL} aria-label="En çok arıza yapan makineler">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600">
            <Trophy className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-gray-900">
              En Çok Arıza Yapan 5 Makine
            </h2>
            <p className="text-[11px] text-gray-500">
              Tüm Tamir Kayıtları (Açık + Kapanmış) · Arıza Sayısına Göre
            </p>
          </div>
        </div>

        {rows.length > 0 && (
          <span className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-gray-600">
            Toplam arıza
            <span className="text-xs font-semibold tabular-nums text-gray-900">
              {totalFaults}
            </span>
          </span>
        )}
      </div>

      <div className="mt-3 border-t border-slate-100 pt-3">
        {loading && !summary ? (
          <SkeletonRows />
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center">
            <Trophy className="h-5 w-5 text-slate-400" />
            <p className="text-sm font-medium text-gray-700">
              Arıza kaydı bulunmuyor
            </p>
            <p className="text-[11px] text-gray-500">
              Makinelerin tamir kayıtları oluştukça en çok arıza yapanlar burada
              listelenir.
            </p>
          </div>
        ) : (
          <ol className="space-y-1.5">
            {rows.map((row, index) => {
              const total = Number(row.total) || 0;
              const width = maxTotal
                ? Math.max(6, Math.round((total / maxTotal) * 100))
                : 0;
              const meta = machineMeta(row);
              const average = row.average_repair_days;

              return (
                <li
                  key={row.machine_id}
                  className="rounded-lg border border-slate-100 px-3 py-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-start gap-2">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-[10px] font-semibold tabular-nums text-slate-600">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-medium text-gray-800">
                          {machineLabel(row)}
                        </p>
                        <p className="truncate text-[11px] text-gray-500">
                          {[meta, row.plate_no && row.identification_no ? row.plate_no : null]
                            .filter(Boolean)
                            .join(' · ') || '—'}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-md bg-slate-900 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-white">
                      {total}
                    </span>
                  </div>

                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-slate-800"
                      style={{ width: `${width}%` }}
                    />
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-gray-500">
                    <span>{row.completed_count ?? 0} tamamlandı</span>
                    <span>{row.cancelled_count ?? 0} iptal</span>
                    {(row.active_count ?? 0) > 0 && (
                      <span>{row.active_count} tamirde</span>
                    )}
                    {average !== null && average !== undefined && (
                      <span>ort. {average} gün</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </section>
  );
}
