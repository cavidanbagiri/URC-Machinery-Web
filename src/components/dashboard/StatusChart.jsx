// src/components/dashboard/StatusChart.jsx
//
// Makinelerin durum dağılımı. Kaynak: GET /machines/statistics/status → by_status
//
// Yerleşim MaintenanceStatusChart ile aynı: halka grafik solda, durumlar sağda
// yatay satırlar hâlinde (renk noktası · ad · adet · yüzde) listelenir.
// Dilime veya satıra tıklamak makine listesini duruma göre filtreler.
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { PieChart as PieIcon } from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import SectionCard from './SectionCard';
import ChartTooltip from './ChartTooltip';
import { chartColor } from './dashboardColors';

export default function StatusChart() {
  const navigate = useNavigate();
  const { byStatus, total, loading } = useSelector((s) => s.dashboard);

  const items = (byStatus || [])
    .filter((status) => status.count > 0)
    .slice()
    .sort((a, b) => b.count - a.count)
    .map((status) => ({
      key: status.id,
      id: status.id,
      name: status.name,
      value: status.count,
      fill: chartColor(status.color),
    }));

  // Durumu tanımsız makineler de olabileceği için merkezdeki sayı backend'in
  // toplamı; liste boşsa satır toplamına düşülür.
  const machineTotal =
    total || items.reduce((sum, item) => sum + item.value, 0);

  const openStatus = (status) => {
    const id = status?.id ?? status?.payload?.id;
    if (id) navigate(`/common_cars?status_id=${id}`);
  };

  return (
    <SectionCard
      title="Durum Dağılımı"
      subtitle={
        machineTotal > 0
          ? `${items.length} durum · ${machineTotal} makine`
          : 'Makine durum dağılımı'
      }
      icon={PieIcon}
      action={{ label: 'Tümü', onClick: () => navigate('/common_cars') }}
      loading={loading}
      empty={items.length === 0}
      emptyIcon={PieIcon}
      emptyText="Henüz hiçbir makine yok"
      emptyHint="Makine eklediğinizde durum dağılımı burada görünür"
    >
      <div className="flex h-full min-h-0 items-center gap-1.5">
        <div className="relative h-full min-h-[150px] w-[44%] min-w-[112px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={items}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius="62%"
                outerRadius="98%"
                paddingAngle={2}
                stroke="#fff"
                strokeWidth={2}
                className="cursor-pointer"
                onClick={openStatus}
              >
                {items.map((item) => (
                  <Cell key={item.key} fill={item.fill} />
                ))}
              </Pie>
              <Tooltip
                content={<ChartTooltip unit="makine" total={machineTotal} />}
                cursor={false}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center leading-none">
            <span className="text-lg font-bold tracking-tight text-gray-900">
              {machineTotal}
            </span>
            <span className="mt-0.5 text-[8px] font-medium uppercase tracking-wide text-gray-400">
              makine
            </span>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col justify-center gap-0.5 overflow-y-auto pr-0.5">
          {items.map((item) => {
            const percent =
              machineTotal > 0
                ? Math.round((item.value / machineTotal) * 100)
                : 0;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => openStatus(item)}
                title={`${item.name}: ${item.value} makine (%${percent})`}
                className="group flex w-full items-center gap-1.5 rounded-md px-1 py-1 text-left transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: item.fill }}
                />
                <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-gray-700">
                  {item.name}
                </span>
                <span className="shrink-0 text-[15px] font-semibold tabular-nums text-gray-900">
                  {item.value}
                </span>
                <span className="w-7 shrink-0 text-right text-[14px] tabular-nums text-gray-400">
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
