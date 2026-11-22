// src/components/tire/TireSummaryCards.jsx
//
// Lastik Takibi sayfasının üst şeridi: toplam değişim ve bu ayki değişim.
// Veri: GET /api/tires/summary (summary.total / summary.changed_this_month).
import { CalendarDaysIcon } from '@heroicons/react/24/outline';
import { GiCarWheel } from 'react-icons/gi';

const CARD_GRID = 'grid grid-cols-1 gap-3 sm:grid-cols-2';

const EMPTY_SUMMARY = {
  total: 0,
  changed_this_month: 0,
};

const TONES = {
  indigo: {
    wrap: 'border-indigo-100 bg-gradient-to-br from-indigo-50/90 via-white to-white',
    badge: 'bg-indigo-600 text-white',
    label: 'text-indigo-700',
    value: 'text-indigo-900',
    glow: 'bg-indigo-100/70',
  },
  emerald: {
    wrap: 'border-emerald-100 bg-gradient-to-br from-emerald-50/90 via-white to-white',
    badge: 'bg-emerald-600 text-white',
    label: 'text-emerald-700',
    value: 'text-emerald-900',
    glow: 'bg-emerald-100/70',
  },
};

function formatCount(value) {
  return Number(value || 0).toLocaleString('tr-TR');
}

function SummaryCard({ label, value, hint, icon: Icon, tone = 'indigo' }) {
  const c = TONES[tone] || TONES.indigo;

  return (
    <div
      className={`relative overflow-hidden rounded-xl border p-4 shadow-sm ${c.wrap}`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute -bottom-8 -right-4 h-24 w-24 rounded-full ${c.glow}`}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className={`text-[11px] font-semibold uppercase tracking-wider ${c.label}`}
          >
            {label}
          </p>
          <p
            className={`mt-1 text-3xl font-semibold leading-none tabular-nums ${c.value}`}
          >
            {formatCount(value)}
          </p>
          {hint && <p className="mt-2 text-[11px] text-gray-500">{hint}</p>}
        </div>

        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${c.badge}`}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}

export default function TireSummaryCards({ summary, loading }) {
  if (loading && !summary) {
    return (
      <div className={CARD_GRID}>
        {Array.from({ length: 2 }).map((_, index) => (
          <div
            key={index}
            className="h-[104px] animate-pulse rounded-xl bg-gray-100 ring-1 ring-gray-200/60"
          />
        ))}
      </div>
    );
  }

  const data = { ...EMPTY_SUMMARY, ...(summary || {}) };
  const today = new Date();
  // "Kasım 2026" — the counter runs from the 1st of the current month.
  const monthLabel = today.toLocaleDateString('tr-TR', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className={CARD_GRID}>
      <SummaryCard
        label="Toplam Değişen Lastik"
        value={data.total}
        hint="Kayıtlı tüm lastik değişimleri"
        icon={GiCarWheel}
        tone="indigo"
      />
      <SummaryCard
        label="Aylık Toplam"
        value={data.changed_this_month}
        hint={`${monthLabel} içinde değişen lastikler`}
        icon={CalendarDaysIcon}
        tone="emerald"
      />
    </div>
  );
}
