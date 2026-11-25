// src/components/dashboard/FuelDistributionChart.jsx
//
// Son 7 günün **mazot dağılımı**: her gün için üç bar (SRU, DCU, Kiralık).
// Kaynak: GET /fuel-logs/statistics/daily?days=7
//
// SRU / DCU litreleri ``machine_fuel_logs`` tablosundan makinenin şantiyesine
// göre, "Kiralık" serisi ise dışarıdan kiralanan ekipmana verilen mazotun ayrı
// defterinden (``machine_rental_fuel_logs``) gelir. Gün bazında kayıt olmayan
// günler sıfır olarak döner, böylece bar grupları hep 7 günü gösterir.
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Fuel } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import SectionCard from './SectionCard';
import { formatNumber } from '../../utils/maintenance';

// Üç seri: etiket, veri anahtarı, pencere toplamı alanı ve renk.
const SERIES = [
  { key: 'sru_liters', totalKey: 'sru_total', label: 'SRU', color: '#3b82f6' },
  { key: 'dcu_liters', totalKey: 'dcu_total', label: 'DCU', color: '#6366f1' },
  {
    key: 'rental_liters',
    totalKey: 'rental_total',
    label: 'Kiralık',
    color: '#f59e0b',
  },
];

const TICK = { fontSize: 10, fill: '#6b7280' };

const WEEKDAYS = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

function parseDate(value) {
  if (!value) return null;
  const [year, month, day] = String(value).slice(0, 10).split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

/** X ekseni etiketi: ``22.11`` */
function dayLabel(value) {
  const date = parseDate(value);
  if (!date) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}.${month}`;
}

/** Tooltip başlığı: ``22.11.2026 · Cmt`` */
function fullLabel(value) {
  const date = parseDate(value);
  if (!date) return '';
  return `${dayLabel(value)}.${date.getFullYear()} · ${WEEKDAYS[date.getDay()]}`;
}

/** Y ekseni: 1 250 → "1,3b" */
function compactNumber(value) {
  const amount = Number(value) || 0;
  if (amount >= 1_000) {
    const thousands = amount / 1_000;
    return `${thousands.toFixed(thousands >= 10 ? 0 : 1).replace('.', ',')}b`;
  }
  return String(Math.round(amount));
}

function DistributionTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  const row = payload[0]?.payload || {};

  return (
    <div className="rounded-xl border border-gray-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur-sm">
      <p className="text-[11px] font-semibold text-gray-700">
        {row.fullLabel || label}
      </p>

      <div className="mt-1 space-y-0.5">
        {SERIES.map((series) => (
          <div key={series.key} className="flex items-center gap-2 text-[11px]">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: series.color }}
            />
            <span className="min-w-[42px] flex-1 text-gray-600">
              {series.label}
            </span>
            <span className="font-semibold tabular-nums text-gray-900">
              {formatNumber(row[series.key] || 0)} L
            </span>
          </div>
        ))}
      </div>

      <div className="mt-1 flex items-center justify-between gap-4 border-t border-gray-100 pt-1 text-[11px]">
        <span className="text-gray-500">Toplam</span>
        <span className="font-bold tabular-nums text-gray-900">
          {formatNumber(row.total_liters || 0)} L
        </span>
      </div>
    </div>
  );
}

export default function FuelDistributionChart() {
  const navigate = useNavigate();
  const { overview, overviewLoading } = useSelector((s) => s.dashboard);
  const { data, error } = overview.fuel || {};

  const items = (data?.items || []).map((item) => ({
    ...item,
    label: dayLabel(item.fuel_date),
    fullLabel: fullLabel(item.fuel_date),
  }));

  // Pencere içinde hiç mazot yoksa grafik yerine boş durum gösterilir.
  const hasFuel = items.some((item) => (item.total_liters || 0) > 0);

  return (
    <SectionCard
      title="Mazot Dağılımı"
      subtitle={
        data
          ? `Son ${data.days} gün · ${formatNumber(data.total)} L`
          : 'Son 7 günün mazot dağılımı'
      }
      icon={Fuel}
      action={{ label: 'Ayrıntıları gör', onClick: () => navigate('/fuel_logs') }}
      loading={overviewLoading}
      error={error}
      empty={items.length === 0 || !hasFuel}
      emptyIcon={Fuel}
      emptyText="Mazot kaydı yok"
      emptyHint="Son 7 gün için mazot dağıtımı girildiğinde burada görünür"
      bodyClassName="flex flex-col"
    >
      <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 px-1 pb-1">
        {SERIES.map((series) => (
          <span
            key={series.key}
            className="flex items-center gap-1 text-[10.5px] font-medium text-gray-600"
          >
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: series.color }}
            />
            {series.label}
            <span className="tabular-nums text-gray-400">
              {formatNumber(data?.[series.totalKey] ?? 0)} L
            </span>
          </span>
        ))}
      </div>

      <div className="min-h-0 w-full flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={items}
            margin={{ top: 4, right: 4, bottom: 0, left: -8 }}
            barCategoryGap="22%"
            barGap={2}
          >
            <CartesianGrid vertical={false} stroke="#f1f5f9" />

            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={TICK}
              interval={0}
              tickMargin={6}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={TICK}
              width={40}
              tickFormatter={compactNumber}
            />

            <Tooltip
              content={<DistributionTooltip />}
              cursor={{ fill: '#f8fafc' }}
            />

            {SERIES.map((series) => (
              <Bar
                key={series.key}
                dataKey={series.key}
                fill={series.color}
                radius={[3, 3, 0, 0]}
                maxBarSize={14}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </SectionCard>
  );
}
