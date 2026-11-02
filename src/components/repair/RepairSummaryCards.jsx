// src/components/repair/RepairSummaryCards.jsx
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Gauge,
  Timer,
  Warehouse,
} from 'lucide-react';

const CARD_GRID =
  'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6';

const EMPTY_SUMMARY = {
  total: 0,
  active: 0,
  active_ratio: null,
  total_machines: 0,
  active_machines: 0,
  broken_machines: 0,
  opened_today: 0,
  completed_today: 0,
  completed: 0,
  cancelled: 0,
  overdue: 0,
  due_soon: 0,
  completed_this_month: 0,
  average_repair_days: null,
  by_garage_service: [],
};

function SummaryCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
  onClick,
  valueClassName = 'text-2xl font-semibold leading-tight',
}) {
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
    sky: {
      wrap: 'border-sky-100 bg-sky-50/60 hover:border-sky-200',
      icon: 'bg-sky-100 text-sky-700',
      value: 'text-sky-700',
    },
    indigo: {
      wrap: 'border-indigo-100 bg-indigo-50/60 hover:border-indigo-200',
      icon: 'bg-indigo-100 text-indigo-700',
      value: 'text-indigo-700',
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
        <span className={`block ${valueClassName} ${c.value}`}>
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
      <div className={CARD_GRID}>
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-[74px] animate-pulse rounded-xl bg-gray-100 ring-1 ring-gray-200/60"
          />
        ))}
      </div>
    );
  }

  const data = { ...EMPTY_SUMMARY, ...(summary || {}) };
  const garageBreakdown = (data.by_garage_service || []).filter(
    (service) => Number(service.active_count) > 0
  );

  return (
    <div className={CARD_GRID}>
      <SummaryCard
        label="Arızalı Ekipman"
        value={data.total}
        hint={`${data.cancelled} iptal edildi`}
        icon={ClipboardList}
        tone="gray"
        onClick={onResetFilters}
      />
      <SummaryCard
        label="Aktif Ekipman"
        value={
          data.active_ratio === null || data.active_ratio === undefined
            ? '—'
            : `${Math.round(data.active_ratio)}%`
        }
        hint={
          data.total_machines > 0
            ? `${data.active_machines} / ${data.total_machines} ekipman aktif`
            : 'Makine verisi alınamadı'
        }
        icon={Gauge}
        tone="blue"
        onClick={() => onSelectFilters?.({ status: 'tamirde' })}
      />
      <SummaryCard
        label="Garaj / Servis"
        value={
          garageBreakdown.length ? (
            <span className="flex flex-wrap items-center gap-1">
              {garageBreakdown.map((service) => (
                <span
                  key={service.garage_service_id ?? 'unassigned'}
                  title={`${service.name}: ${service.active_count} tamirde`}
                  className="rounded-md bg-sky-100 px-1.5 py-0.5 text-[11px] font-semibold text-sky-800"
                >
                  {service.name} · {service.active_count}
                </span>
              ))}
            </span>
          ) : (
            '—'
          )
        }
        hint="Tamirdeki ekipmanın garaj/servis dağılımı"
        icon={Warehouse}
        tone="sky"
        valueClassName="text-[13px] font-semibold leading-snug"
        onClick={() => onSelectFilters?.({ status: 'tamirde' })}
      />
      <SummaryCard
        label="Toplam Tamir"
        value={data.completed}
        hint="Şimdiye kadar tamamlanan"
        icon={CheckCircle2}
        tone="green"
        onClick={() => onSelectFilters?.({ status: 'tamamlandi' })}
      />
      <SummaryCard
        label="Günlük Tamir"
        value={data.completed_today}
        hint={`${data.opened_today} bugün açılan kayıt`}
        icon={CalendarDays}
        tone="amber"
        onClick={() => onSelectFilters?.({ status: 'tamamlandi' })}
      />
      <SummaryCard
        label="Ortalama Arızada Kalma"
        value={
          data.average_repair_days !== null &&
          data.average_repair_days !== undefined
            ? `${data.average_repair_days} gün`
            : '—'
        }
        hint="Tamamlanan kayıtların ortalaması"
        icon={Timer}
        tone="indigo"
      />
    </div>
  );
}
