// src/components/repair/RepairSummaryCards.jsx
import { AlertTriangle, CheckCircle2, Clock, ClipboardList, Wrench } from 'lucide-react';

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
    green: {
      wrap: 'border-emerald-100 bg-emerald-50/60 hover:border-emerald-200',
      icon: 'bg-emerald-100 text-emerald-700',
      value: 'text-emerald-700',
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

export default function RepairSummaryCards({
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
    active: 0,
    completed: 0,
    cancelled: 0,
    overdue: 0,
    due_soon: 0,
    completed_this_month: 0,
    average_repair_days: null,
  };

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <SummaryCard
        label="Toplam Kayıt"
        value={data.total}
        hint={`${data.cancelled} iptal edildi`}
        icon={ClipboardList}
        tone="gray"
        onClick={onResetFilters}
      />
      <SummaryCard
        label="Tamirde"
        value={data.active}
        hint="Açık tamir kaydı"
        icon={Wrench}
        tone="blue"
        onClick={() => onSelectFilters?.({ status: 'tamirde' })}
      />
      <SummaryCard
        label="Gecikmiş"
        value={data.overdue}
        hint="Tahmini tarihi geçti"
        icon={AlertTriangle}
        tone="red"
        onClick={() => onSelectFilters?.({ status: 'tamirde', overdue: true })}
      />
      <SummaryCard
        label="Yaklaşan"
        value={data.due_soon}
        hint="3 gün içinde çıkış"
        icon={Clock}
        tone="amber"
        onClick={() => onSelectFilters?.({ status: 'tamirde', due_soon: true })}
      />
      <SummaryCard
        label="Tamamlanan"
        value={data.completed}
        hint={
          data.average_repair_days !== null
            ? `Ortalama ${data.average_repair_days} gün`
            : `${data.completed_this_month} bu ay`
        }
        icon={CheckCircle2}
        tone="green"
        onClick={() => onSelectFilters?.({ status: 'tamamlandi' })}
      />
    </div>
  );
}
