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
  onClick,
  valueClassName = 'text-2xl font-semibold leading-tight',
}) {
  // Kartlar bilinçli olarak siyah-beyazdır: renkli arka planlar yerine beyaz
  // yüzey + gri kenarlık kullanılır, değerler koyu gri yazılır.
  const Element = onClick ? 'button' : 'div';

  return (
    <Element
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-left transition ${
        onClick ? 'cursor-pointer hover:border-gray-400 hover:bg-gray-50' : ''
      }`}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-700">
        <Icon className="h-5 w-5" strokeWidth={2.1} />
      </span>
      <span className="min-w-0">
        <span className="block text-[11px] font-medium uppercase tracking-wide text-gray-500">
          {label}
        </span>
        <span className={`block text-gray-900 ${valueClassName}`}>
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
        hint=""
        icon={ClipboardList}
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
            ? `${data.active_machines} / ${data.total_machines} Aktif Ekipman Oranı`
            : 'Makine verisi alınamadı'
        }
        icon={Gauge}
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
                  className="rounded-md border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[11px] font-semibold text-gray-700"
                >
                  {service.name} · {service.active_count}
                </span>
              ))}
            </span>
          ) : (
            '—'
          )
        }
        hint="Tamirdeki Ekipmanın Garaj/Servis Dağılımı"
        icon={Warehouse}
        valueClassName="text-[13px] font-semibold leading-snug"
        onClick={() => onSelectFilters?.({ status: 'tamirde' })}
      />
      <SummaryCard
        label="Toplam Tamir"
        value={data.completed}
        hint="Şimdiye Kadar Tamamlanan"
        icon={CheckCircle2}
        onClick={() => onSelectFilters?.({ status: 'tamamlandi' })}
      />
      <SummaryCard
        label="Günlük Tamir"
        value={data.completed_today}
        hint={`${data.opened_today} Gün İçinde Tamamlanan Arıza`}
        icon={CalendarDays}
      />
      <SummaryCard
        label="Ortalama Arızada Kalma"
        value={
          data.average_repair_days !== null &&
          data.average_repair_days !== undefined
            ? `${data.average_repair_days} gün`
            : '—'
        }
        hint="Tamamlanan Kayıtların Ortalaması"
        icon={Timer}
      />
    </div>
  );
}
