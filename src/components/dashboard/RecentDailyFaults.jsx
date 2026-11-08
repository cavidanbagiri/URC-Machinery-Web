// src/components/dashboard/RecentDailyFaults.jsx
//
// Son günlük arıza kayıtları. Kaynak: GET /daily-faults/fetch_daily_faults
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { CalendarDays } from 'lucide-react';
import SectionCard from './SectionCard';
import WidgetList from './WidgetList';
import { formatDate } from '../../utils/repair';

export default function RecentDailyFaults() {
  const navigate = useNavigate();
  const { overview, overviewLoading } = useSelector((s) => s.dashboard);
  const { recent, error } = overview.dailyFaults;

  const rows = (recent || []).map((fault) => ({
    key: fault.id,
    icon: CalendarDays,
    title:
      fault.identification_no ||
      fault.plate_no ||
      `Makine #${fault.machine_id}`,
    meta: `${formatDate(fault.fault_date)} · ${fault.territory_name || 'Bölge yok'}`,
    value: fault.repair_type_name || 'Arıza',
    tone: fault.documents?.length ? 'sky' : 'gray',
    onClick: () => navigate('/daily_faults'),
  }));

  return (
    <SectionCard
      title="Son Günlük Arızalar"
      subtitle="En yeni kayıtlar"
      icon={CalendarDays}
      action={{ label: 'Tümü', onClick: () => navigate('/daily_faults') }}
      loading={overviewLoading}
      error={error}
      empty={rows.length === 0}
      emptyIcon={CalendarDays}
      emptyText="Günlük arıza kaydı yok"
      emptyHint="Arıza bildirildiğinde burada listelenir"
      bodyClassName="overflow-y-auto"
    >
      <WidgetList rows={rows} />
    </SectionCard>
  );
}
