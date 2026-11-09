// src/components/dashboard/MaintenanceStatusChart.jsx
//
// Bakım durumu dağılımı (gecikmiş / yaklaşıyor / veri uyarısı / uygun / ...).
// Kaynak: GET /maintenance/summary → by_status
//
// Görsel: "activity ring" tarzı RadialBar — her durum bir halka, halka yayının
// uzunluğu o durumdaki makine sayısıyla orantılı (domain sabit: en büyük değer).
// Legend, uzun Türkçe etiketler kırpılabilsin ve satırlar tıklanabilsin diye
// Recharts'ın legend'ı yerine elle çiziliyor.
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Activity } from 'lucide-react';
import {
  Cell,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import SectionCard from './SectionCard';
import ChartTooltip from './ChartTooltip';
import { chartColor } from './dashboardColors';

export default function MaintenanceStatusChart() {
  const navigate = useNavigate();
  const { overview, overviewLoading } = useSelector((s) => s.dashboard);
  const { data, error } = overview.maintenance;

  const items = (data?.by_status || [])
    .filter((status) => status.count > 0)
    .slice()
    .sort((a, b) => b.count - a.count)
    .map((status) => ({
      key: status.code,
      code: status.code,
      name: status.name,
      value: status.count,
      fill: chartColor(status.color),
    }));

  const total = items.reduce((sum, item) => sum + item.value, 0);
  const largest = items.reduce((max, item) => Math.max(max, item.value), 0);

  // Recharts halkaları içten dışa doğru çizer; en büyük dilim en dışta kalsın.
  const rings = items.slice().reverse();

  const openStatus = (code) => {
    if (code) navigate(`/maintenance?status=${code}`);
  };

  return (
    <SectionCard
      title="Bakım Durumu"
      subtitle={
        data
          ? `Planlı ${data.planned} · Gecikmiş ${data.overdue} · Yaklaşan ${data.due_soon}`
          : 'Bakım planı dağılımı'
      }
      icon={Activity}
      action={{ label: 'Tümü', onClick: () => navigate('/maintenance') }}
      loading={overviewLoading}
      error={error}
      empty={items.length === 0}
      emptyIcon={Activity}
      emptyText="Bakım kaydı yok"
      emptyHint="Makineye bakım planı eklendiğinde burada görünür"
    >
      <div className="flex h-full min-h-0 items-center gap-1.5">
        <div className="relative h-full min-h-[150px] w-[44%] min-w-[112px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              data={rings}
              innerRadius="38%"
              outerRadius="98%"
              startAngle={90}
              endAngle={-270}
            >
              <PolarAngleAxis
                type="number"
                domain={[0, Math.max(largest, 1)]}
                tick={false}
                axisLine={false}
              />
              <RadialBar
                dataKey="value"
                background={{ fill: '#f1f5f9' }}
                cornerRadius={2}
                className="cursor-pointer"
                onClick={(entry) =>
                  openStatus(entry?.payload?.code ?? entry?.code)
                }
              >
                {rings.map((item) => (
                  <Cell key={item.key} fill={item.fill} />
                ))}
              </RadialBar>
              <Tooltip
                content={<ChartTooltip unit="makine" total={total} />}
                cursor={false}
              />
            </RadialBarChart>
          </ResponsiveContainer>

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center leading-none">
            <span className="text-lg font-bold tracking-tight text-gray-900">
              {total}
            </span>
            <span className="mt-0.5 text-[8px] font-medium uppercase tracking-wide text-gray-400">
              makine
            </span>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col justify-center gap-0.5 overflow-y-auto pr-0.5">
          {items.map((item) => {
            const percent = total > 0 ? Math.round((item.value / total) * 100) : 0;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => openStatus(item.code)}
                title={`${item.name}: ${item.value} makine (%${percent})`}
                className="group flex w-full items-center gap-1.5 rounded-md px-1 py-1 text-left transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: item.fill }}
                />
                <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-gray-700">
                  {item.name}
                </span>
                <span className="shrink-0 text-[11px] font-semibold tabular-nums text-gray-900">
                  {item.value}
                </span>
                <span className="w-7 shrink-0 text-right text-[10px] tabular-nums text-gray-400">
                  {percent}%
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </SectionCard>
  );
}
