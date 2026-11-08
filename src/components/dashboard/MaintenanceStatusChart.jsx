// src/components/dashboard/MaintenanceStatusChart.jsx
//
// Bakım durumu dağılımı (gecikmiş / yaklaşıyor / veri uyarısı / uygun / ...).
// Kaynak: GET /maintenance/summary → by_status
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Activity } from 'lucide-react';
import SectionCard from './SectionCard';
import BarList from './BarList';

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
      label: status.name,
      value: status.count,
      color: status.color,
    }));

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
      <BarList
        items={items}
        onSelect={(item) => navigate(`/maintenance?status=${item.code}`)}
      />
    </SectionCard>
  );
}
