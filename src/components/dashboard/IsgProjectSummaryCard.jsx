// src/components/dashboard/IsgProjectSummaryCard.jsx
//
// Dashboard'daki ISG özet tablosu: her proje (şantiye) için açık/kapalı
// uygunsuzluk sayıları, açık/kapalı dağılımını gösteren durum göstergesi ve
// tablonun altında önem derecesi (Kritik / Önemli / Az Önemli) dağılımı.
// Veri `GET /api/isg/project_summary` üzerinden gelir; ISG sayfasındaki
// kartlarla aynı tabloyu okur, böylece iki ekran çelişmez.
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

import SectionCard from './SectionCard';
import { fetchIsgProjectSummary } from '../../stores/isg_slice';
import {
  TABLE_HEAD,
  TABLE_NUM,
  TABLE_PRIMARY,
  TABLE_ROW,
} from '../ui/tableStyles';

/** Önem derecesi renkleri — `utils/isg.js` tonlarıyla aynı (red/amber/sky). */
const SEVERITY_TONES = {
  kritik: { dot: 'bg-red-500', bar: 'bg-red-500' },
  onemli: { dot: 'bg-amber-400', bar: 'bg-amber-400' },
  az_onemli: { dot: 'bg-sky-400', bar: 'bg-sky-400' },
};

const FALLBACK_TONE = { dot: 'bg-slate-300', bar: 'bg-slate-300' };

function percent(part, whole) {
  return whole > 0 ? Math.round((part / whole) * 100) : 0;
}

/** Oran çubuğu + "%N kapalı" rozeti. Dar kartta satır içinde kullanılır. */
function StatusMeter({ open, closed, total }) {
  const closedPct = percent(closed, total);
  const openPct = total > 0 ? 100 - closedPct : 0;
  const allClosed = total > 0 && open === 0;

  return (
    <div className="mt-1 flex items-center gap-1.5">
      <span
        className="flex h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-100"
        role="img"
        aria-label={`${open} açık, ${closed} kapalı`}
      >
        <span
          className="h-full bg-amber-400"
          style={{ width: `${openPct}%` }}
        />
        <span
          className="h-full bg-emerald-500"
          style={{ width: `${closedPct}%` }}
        />
      </span>
      <span
        className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
          allClosed
            ? 'bg-emerald-50 text-emerald-700'
            : 'bg-amber-50 text-amber-700'
        }`}
      >
        {allClosed ? 'Tümü kapalı' : `%${closedPct} kapalı`}
      </span>
    </div>
  );
}

/**
 * Önem derecesi (Kritik / Önemli / Az Önemli) dağılımı: yığılmış oran çubuğu
 * ve altında her derece için sayı + yüzde. Yüzdeler kartın toplam kayıt
 * sayısına göre hesaplanır, böylece satırlar her zaman %100'e tamamlanır.
 */
function SeverityBreakdown({ items, total }) {
  if (!items.length) return null;

  const summary = items
    .map(
      (item) =>
        `${item.severity_label}: ${item.total} (%${percent(item.total, total)})`
    )
    .join(', ');

  return (
    <div className="shrink-0 border-t border-slate-200 px-3 py-2">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          Önem derecesi
        </p>
        <span className="text-[10px] text-slate-400">{total} kayıt</span>
      </div>

      <span
        className="mt-1.5 flex h-1.5 overflow-hidden rounded-full bg-slate-100"
        role="img"
        aria-label={summary}
      >
        {items.map((item) => (
          <span
            key={item.severity}
            className={(SEVERITY_TONES[item.severity] || FALLBACK_TONE).bar}
            style={{ width: `${percent(item.total, total)}%` }}
          />
        ))}
      </span>

      <ul className="mt-1.5">
        {items.map((item) => {
          const tone = SEVERITY_TONES[item.severity] || FALLBACK_TONE;

          return (
            <li
              key={item.severity}
              className="flex items-center gap-1.5 py-0.5 text-[11px]"
              title={`${item.open} açık / ${item.closed} kapalı`}
            >
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${tone.dot}`}
              />
              <span className="truncate text-slate-600">
                {item.severity_label}
              </span>
              <span className="ml-auto font-semibold text-slate-900">
                {item.total}
              </span>
              <span
                className={`w-9 text-right ${
                  item.total > 0
                    ? 'font-semibold text-slate-600'
                    : 'text-slate-400'
                }`}
              >
                %{percent(item.total, total)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function IsgProjectSummaryCard({ className = '' }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    projectSummary,
    projectSummaryLoading = false,
    projectSummaryError = null,
  } = useSelector((state) => state.isg);

  const items = projectSummary?.items || [];
  const severities = projectSummary?.severities || [];
  const projectCount = projectSummary?.project_count || 0;
  const openTotal = projectSummary?.open_total || 0;
  const closedTotal = projectSummary?.closed_total || 0;
  const total = projectSummary?.total || 0;

  const subtitle = projectCount
    ? `${projectCount} proje · ${openTotal} açık / ${closedTotal} kapalı`
    : 'Projelere göre açık/kapalı uygunsuzluklar';

  return (
    <SectionCard
      title="ISG Uygunsuzlukları"
      subtitle={subtitle}
      icon={ShieldCheck}
      action={{ label: 'ISG', onClick: () => navigate('/isg') }}
      loading={projectSummaryLoading && !projectSummary}
      error={projectSummaryError}
      onRetry={() => dispatch(fetchIsgProjectSummary())}
      empty={items.length === 0}
      emptyIcon={ShieldCheck}
      emptyText="ISG kaydı bulunamadı"
      emptyHint="Uygunsuzluk açıldığında proje özeti burada görünecek"
      className={className}
      bodyClassName="px-0 py-0"
    >
      <div className="flex h-full flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto">
          <table className="w-full table-fixed border-separate border-spacing-0 text-left">
            <thead className="sticky top-0 z-10">
              <tr>
                <th
                  scope="col"
                  className={`${TABLE_HEAD} border-b border-slate-200 px-3 py-2 backdrop-blur`}
                >
                  Proje
                </th>
                <th
                  scope="col"
                  className={`${TABLE_HEAD} w-12 border-b border-slate-200 px-1.5 py-2 text-right backdrop-blur`}
                >
                  Açık
                </th>
                <th
                  scope="col"
                  className={`${TABLE_HEAD} w-12 border-b border-slate-200 px-1.5 py-2 text-right backdrop-blur`}
                >
                  Kapalı
                </th>
                <th
                  scope="col"
                  className={`${TABLE_HEAD} w-14 border-b border-slate-200 px-1.5 py-2 text-right backdrop-blur`}
                >
                  Toplam
                </th>
              </tr>
            </thead>

            <tbody>
              {items.map((project) => (
                <tr key={project.territory_id} className={TABLE_ROW}>
                  <td className="border-b border-slate-100 px-3 py-2">
                    <p
                      className={`truncate ${TABLE_PRIMARY}`}
                      title={project.territory_name}
                    >
                      {project.territory_name}
                    </p>
                    <StatusMeter
                      open={project.open}
                      closed={project.closed}
                      total={project.total}
                    />
                  </td>
                  <td
                    className={`border-b border-slate-100 px-1.5 py-2 text-right align-top text-[13px] font-semibold text-amber-700 ${TABLE_NUM}`}
                  >
                    {project.open}
                  </td>
                  <td
                    className={`border-b border-slate-100 px-1.5 py-2 text-right align-top text-[13px] font-semibold text-emerald-700 ${TABLE_NUM}`}
                  >
                    {project.closed}
                  </td>
                  <td
                    className={`border-b border-slate-100 px-1.5 py-2 text-right align-top text-[13px] font-semibold text-slate-900 ${TABLE_NUM}`}
                  >
                    {project.total}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="shrink-0 border-t border-slate-200 bg-slate-50/70">
          <table className="w-full table-fixed border-separate border-spacing-0 text-left">
            <tbody>
              <tr>
                <td className="px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Toplam
                  </p>
                  <StatusMeter
                    open={openTotal}
                    closed={closedTotal}
                    total={total}
                  />
                </td>
                <td
                  className={`w-12 px-1.5 py-2 text-right align-top text-[12px] font-semibold text-amber-700 ${TABLE_NUM}`}
                >
                  {openTotal}
                </td>
                <td
                  className={`w-12 px-1.5 py-2 text-right align-top text-[12px] font-semibold text-emerald-700 ${TABLE_NUM}`}
                >
                  {closedTotal}
                </td>
                <td
                  className={`w-14 px-1.5 py-2 text-right align-top text-[12px] font-semibold text-slate-900 ${TABLE_NUM}`}
                >
                  {total}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <SeverityBreakdown items={severities} total={total} />
      </div>
    </SectionCard>
  );
}
