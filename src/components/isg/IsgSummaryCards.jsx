// src/components/isg/IsgSummaryCards.jsx
import { Building2, CheckCircle2, ShieldCheck } from 'lucide-react';

const CARD_GRID =
  'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5';

const TONES = {
  amber: {
    wrap: 'border-amber-100 bg-amber-50/60',
    icon: 'bg-amber-100 text-amber-700',
    value: 'text-amber-700',
  },
  sky: {
    wrap: 'border-sky-100 bg-sky-50/60',
    icon: 'bg-sky-100 text-sky-700',
    value: 'text-sky-700',
  },
  green: {
    wrap: 'border-emerald-100 bg-emerald-50/60',
    icon: 'bg-emerald-100 text-emerald-700',
    value: 'text-emerald-700',
  },
  indigo: {
    wrap: 'border-indigo-100 bg-indigo-50/60',
    icon: 'bg-indigo-100 text-indigo-700',
    value: 'text-indigo-700',
  },
  blue: {
    wrap: 'border-blue-100 bg-blue-50/60',
    icon: 'bg-blue-100 text-blue-700',
    value: 'text-blue-700',
  },
};

function SummaryCard({ label, value, hint, icon: Icon, tone }) {
  const c = TONES[tone] || TONES.blue;

  return (
    <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${c.wrap}`}>
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${c.icon}`}
      >
        <Icon className="h-5 w-5" strokeWidth={2.1} />
      </span>
      <span className="min-w-0">
        <span className="block text-[11px] font-medium uppercase tracking-wide text-gray-500">
          {label}
        </span>
        <span className={`block text-2xl font-semibold leading-tight ${c.value}`}>
          {value}
        </span>
        {hint && <span className="block text-[11px] text-gray-500">{hint}</span>}
      </span>
    </div>
  );
}

/**
 * The five cards of the page (11.1). The numbers come from
 * ``GET /api/isg/overview`` and are computed from the site names, so a card
 * can never disagree with the table.
 */
export default function IsgSummaryCards({ overview, loading }) {
  if (loading && !overview) {
    return (
      <div className={CARD_GRID}>
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-[74px] animate-pulse rounded-xl bg-gray-100 ring-1 ring-gray-200/60"
          />
        ))}
      </div>
    );
  }

  const data = overview || {};

  return (
    <div className={CARD_GRID}>
      <SummaryCard
        label="SRU · Açılan"
        value={data.sru_opened ?? 0}
        hint={`${data.sru_open ?? 0} açık uygunsuzluk`}
        icon={Building2}
        tone="amber"
      />
      <SummaryCard
        label="DCU · Açılan"
        value={data.dcu_opened ?? 0}
        hint={`${data.dcu_open ?? 0} açık uygunsuzluk`}
        icon={Building2}
        tone="sky"
      />
      <SummaryCard
        label="SRU · Kapatılan"
        value={data.sru_closed ?? 0}
        hint="SRU şantiyesinde kapatılan"
        icon={CheckCircle2}
        tone="green"
      />
      <SummaryCard
        label="DCU · Kapatılan"
        value={data.dcu_closed ?? 0}
        hint="DCU şantiyesinde kapatılan"
        icon={CheckCircle2}
        tone="indigo"
      />
      <SummaryCard
        label="Toplam Kapatılan (SRU+DCU)"
        value={data.sites_closed_total ?? 0}
        hint={`Tüm kayıtlar: ${data.total ?? 0} · Açık: ${
          data.open_total ?? 0
        }`}
        icon={ShieldCheck}
        tone="blue"
      />
    </div>
  );
}
