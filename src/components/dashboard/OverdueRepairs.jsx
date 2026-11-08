// src/components/dashboard/OverdueRepairs.jsx
//
// Tahmini çıkış tarihi geçmiş tamirler.
// Kaynak: GET /repair/fetch_repairs?overdue=true
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Wrench } from 'lucide-react';
import SectionCard from './SectionCard';
import WidgetList from './WidgetList';
import { durationLabel, formatDate, remainingLabel } from '../../utils/repair';

export default function OverdueRepairs() {
  const navigate = useNavigate();
  const { overview, overviewLoading } = useSelector((s) => s.dashboard);
  const { items, error } = overview.overdueRepairs;

  const rows = (items || []).map((item) => ({
    key: item.id,
    icon: Wrench,
    title:
      item.identification_no ||
      item.plate_no ||
      `Makine #${item.machine_id}`,
    meta: `${formatDate(item.entry_date)} giriş · ${
      item.repair_type_name || 'Arıza'
    }${item.garage_service_name ? ` · ${item.garage_service_name}` : ''}`,
    value: remainingLabel(item) || durationLabel(item.duration_days),
    tone: 'red',
    onClick: () => navigate('/repair?status=tamirde'),
  }));

  return (
    <SectionCard
      title="Gecikmiş Tamirler"
      subtitle="Tahmini çıkış tarihi geçen kayıtlar"
      icon={Wrench}
      action={{
        label: 'Tümü',
        onClick: () => navigate('/repair?status=tamirde'),
      }}
      loading={overviewLoading}
      error={error}
      empty={rows.length === 0}
      emptyIcon={Wrench}
      emptyText="Gecikmiş tamir yok"
      emptyHint="Tüm tamirler tahmini tarihinde ilerliyor"
      bodyClassName="overflow-y-auto"
    >
      <WidgetList rows={rows} />
    </SectionCard>
  );
}
