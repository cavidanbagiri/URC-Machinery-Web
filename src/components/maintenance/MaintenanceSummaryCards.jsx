// src/components/maintenance/MaintenanceSummaryCards.jsx
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Clock,
  Gauge,
} from 'lucide-react';

function SummaryCard({ label, value, hint, icon: Icon, tone, onClick }) {
  const tones = {
    gray: {
      wrap: 'border-gray-200 bg-white hover:border-gray-300',
      icon: 'bg-gray-100 text-gray-600',
      value: 'text-gray-900',
    },
    blue: {
      wrap: 'border-blue-100 bg-blue-50/50 hover:border-blue-200',
      icon: 'bg-blue-100 text-blue-700',
      value: 'text-blue-700',
    },
    red: {
      wrap: 'border-red-100 bg-red-50/60 hover:border-red-200',
      icon: 'bg-red-100 text-red-700',
      value: 'text-red-700',
    },
    amber: {
      wrap: 'border-amber-100 bg-amber-50/60 hover:border-amber-200',
      icon: 'bg-amber-100 text-amber-700',
      value: 'text-amber-700',
    },
    orange: {
      wrap: 'border-orange-100 bg-orange-50/60 hover:border-orange-200',
      icon: 'bg-orange-100 text-orange-700',
      value: 'text-orange-700',
    },
  };
  const c = tones[tone] || tones.gray;
  const Element = onClick ? 'button' : 'div';

  return (
    <Element
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${c.wrap} ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
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
    </Element>
  );
}

export default function MaintenanceSummaryCards({
  summary,
  loading,
  onSelectFilters,
  onResetFilters,
}) {
  if (loading && !summary) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-[74px] animate-pulse rounded-xl bg-gray-100 ring-1 ring-gray-200/60"
          />
        ))}
      </div>
    );
  }

  const data = summary || {
    total: 0,
    planned: 0,
    unplanned: 0,
    inactive: 0,
    overdue: 0,
    due_soon: 0,
    needs_attention: 0,
  };

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <SummaryCard
        label="Toplam Makine"
        value={data.total}
        hint={`${data.unplanned} plansız · ${data.inactive} pasif`}
        icon={Gauge}
        tone="gray"
        onClick={onResetFilters}
      />
      <SummaryCard
        label="Planlı"
        value={data.planned}
        hint="Aktif bakım planı"
        icon={ClipboardList}
        tone="blue"
        onClick={() => onSelectFilters?.({ has_plan: 'true', status: '' })}
      />
      <SummaryCard
        label="Gecikmiş"
        value={data.overdue}
        hint="Bakım aralığı aşıldı"
        icon={AlertTriangle}
        tone="red"
        onClick={() => onSelectFilters?.({ status: 'gecikmis' })}
      />
      <SummaryCard
        label="Yaklaşan"
        value={data.due_soon}
        hint="Eşik değerine yakın"
        icon={Clock}
        tone="amber"
        onClick={() => onSelectFilters?.({ status: 'yaklasiyor' })}
      />
      <SummaryCard
        label="Dikkat Gereken"
        value={data.needs_attention}
        hint="Gecikmiş + yaklaşan + veri"
        icon={data.needs_attention > 0 ? AlertTriangle : CheckCircle2}
        tone={data.needs_attention > 0 ? 'orange' : 'gray'}
      />
    </div>
  );
}
