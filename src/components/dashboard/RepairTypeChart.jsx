// src/components/dashboard/RepairTypeChart.jsx
//
// En sık görülen arıza tipleri (ilk 6). Kaynak: GET /repair/summary → by_type
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Gauge } from 'lucide-react';
import SectionCard from './SectionCard';
import BarList from './BarList';

// Tek renk ailesi içinde küçük bir varyasyon — bar listesini okumayı kolaylaştırır.
const BAR_TONES = ['blue', 'indigo', 'sky', 'blue', 'indigo', 'sky'];

export default function RepairTypeChart() {
  const navigate = useNavigate();
  const { overview, overviewLoading } = useSelector((s) => s.dashboard);
  const { data, error } = overview.repair;

  const items = (data?.by_type || [])
    .slice()
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
    .map((type, index) => ({
      key: type.repair_type_id,
      repairTypeId: type.repair_type_id,
      label: type.name,
      value: type.count,
      secondary: `${type.active_count} tamirde`,
      color: BAR_TONES[index % BAR_TONES.length],
    }));

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
      <BarList
        items={items}
        onSelect={(item) =>
          navigate(`/repair?repair_type_id=${item.repairTypeId}`)
        }
      />
    </SectionCard>
  );
}
