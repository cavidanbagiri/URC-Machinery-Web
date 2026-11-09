// src/components/dashboard/RepairTypeChart.jsx
//
// En sık görülen arıza tipleri (ilk 6). Kaynak: GET /repair/summary → by_type
//
// Görsel: yatay gradient bar chart. Etiketler Y ekseninde (Türkçe tipler uzun
// olduğu için eksende kısaltılıyor, tam ad tooltip'te), değerler bar ucunda.
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Gauge } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import SectionCard from './SectionCard';
import ChartTooltip from './ChartTooltip';

// Tek renk ailesi (mavi → turkuaz) — sıralamayı okumayı kolaylaştırır.
const BAR_TONES = ['#3b82f6', '#6366f1', '#8b5cf6', '#0ea5e9', '#06b6d4', '#14b8a6'];

// Y ekseninde uzun tip adları kartı taşırmasın diye kısaltma.
const TICK_MAX = 15;

function shortenTick(name) {
  const text = String(name ?? '');
  return text.length > TICK_MAX ? `${text.slice(0, TICK_MAX - 1)}…` : text;
}

export default function RepairTypeChart() {
  const navigate = useNavigate();
  const { overview, overviewLoading } = useSelector((s) => s.dashboard);
  const { data, error } = overview.repair;

  const items = (data?.by_type || [])
    .slice()
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
    .map((type, index) => ({
      key: type.repair_type_id ?? `type-${index}`,
      repairTypeId: type.repair_type_id,
      name: type.name,
      value: type.count,
      active: type.active_count,
      fill: BAR_TONES[index % BAR_TONES.length],
    }));

  const openType = (row) => {
    const id = row?.repairTypeId ?? row?.payload?.repairTypeId;
    if (id) navigate(`/repair?repair_type_id=${id}`);
  };

  return (
    <SectionCard
      title="Arıza Tipi Dağılımı"
      subtitle={
        data ? `Toplam ${data.total} kayıt · ${data.active} aktif` : 'Arıza tipine göre kayıtlar'
      }
      icon={Gauge}
      action={{ label: 'Tümü', onClick: () => navigate('/repair') }}
      loading={overviewLoading}
      error={error}
      empty={items.length === 0}
      emptyIcon={Gauge}
      emptyText="Tamir kaydı yok"
      emptyHint="Arıza kaydı oluşturulduğunda tip dağılımı burada görünür"
    >
      <div className="h-full min-h-[190px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={items}
            layout="vertical"
            margin={{ top: 2, right: 24, bottom: 0, left: 0 }}
            barCategoryGap="18%"
          >
            <defs>
              {items.map((item, index) => (
                <linearGradient
                  key={item.key}
                  id={`repair-type-${index}`}
                  x1="0"
                  y1="0"
                  x2="1"
                  y2="0"
                >
                  <stop offset="0%" stopColor={item.fill} stopOpacity={0.95} />
                  <stop offset="100%" stopColor={item.fill} stopOpacity={0.5} />
                </linearGradient>
              ))}
            </defs>

            <CartesianGrid horizontal={false} stroke="#f1f5f9" />

            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              width={92}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10.5, fill: '#4b5563' }}
              tickFormatter={shortenTick}
            />

            <Tooltip
              content={
                <ChartTooltip
                  unit="kayıt"
                  total={data?.total || 0}
                  secondaryKey="active"
                  secondaryLabel="tamirde"
                />
              }
              cursor={{ fill: '#f8fafc' }}
            />

            <Bar
              dataKey="value"
              radius={[4, 7, 7, 4]}
              barSize={12}
              className="cursor-pointer"
              onClick={openType}
            >
              {items.map((item, index) => (
                <Cell key={item.key} fill={`url(#repair-type-${index})`} />
              ))}
              <LabelList
                dataKey="value"
                position="right"
                offset={6}
                fill="#111827"
                fontSize={11}
                fontWeight={600}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </SectionCard>
  );
}

