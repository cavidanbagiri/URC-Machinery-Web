// src/components/dashboard/UpcomingMaintenance.jsx
//
// Gecikmiş planlı bakımlar (kalan değere göre artan sırada).
// Kaynak: GET /maintenance/fetch_maintenance?status=gecikmis&sort_by=remaining
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { AlertTriangle } from 'lucide-react';
import SectionCard from './SectionCard';
import WidgetList from './WidgetList';
import { formatDate, formatNumber, unitLabel } from '../../utils/maintenance';

function remainingText(item) {
  const remaining = item.remaining;
  if (remaining === null || remaining === undefined) return '—';

  const unit = unitLabel(item.usage_unit);
  const sign = remaining < 0 ? '−' : '';
  const value = `${sign}${formatNumber(Math.abs(remaining))}`;
  return unit ? `${value} ${unit}` : value;
}

export default function UpcomingMaintenance() {
  const navigate = useNavigate();
  const { overview, overviewLoading } = useSelector((s) => s.dashboard);
  const { items, error } = overview.overdueMaintenance;

  const rows = (items || []).map((item) => {
    const overdue = typeof item.remaining === 'number' && item.remaining < 0;

    return {
      key: item.machine_id,
      icon: AlertTriangle,
      title:
        item.identification_no ||
        item.plate_no ||
        `Makine #${item.machine_id}`,
      meta: `${item.territory_name || 'Bölge yok'} · son bakım ${formatDate(
        item.last_maintenance_date
      )}`,
      value: remainingText(item),
      tone: overdue ? 'red' : 'amber',
      onClick: () => navigate('/maintenance?status=gecikmis'),
    };
  });

  return (
    <SectionCard
      title="Gecikmiş Bakımlar"
      subtitle="Kalan değere göre en acil kayıtlar"
      icon={AlertTriangle}
      action={{
        label: 'Tümü',
        onClick: () => navigate('/maintenance?status=gecikmis'),
      }}
      loading={overviewLoading}
      error={error}
      empty={rows.length === 0}
      emptyIcon={AlertTriangle}
      emptyText="Gecikmiş bakım yok"
      emptyHint="Tüm planlı bakımlar zamanında görünüyor"
      bodyClassName="overflow-y-auto"
    >
      <WidgetList rows={rows} />
    </SectionCard>
  );
}
