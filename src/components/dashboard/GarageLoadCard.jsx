// src/components/dashboard/GarageLoadCard.jsx
//
// Garaj / servis yükü + ortalama arızada kalma süresi.
// Kaynak: GET /repair/summary → by_garage_service, average_repair_days
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Warehouse } from 'lucide-react';
import SectionCard from './SectionCard';
import BarList from './BarList';

export default function GarageLoadCard() {
  const navigate = useNavigate();
  const { overview, overviewLoading } = useSelector((s) => s.dashboard);
  const { data, error } = overview.repair;

  const garages = (data?.by_garage_service || [])
    .filter((service) => Number(service.active_count) > 0)
    .slice()
    .sort((a, b) => b.active_count - a.active_count)
    .map((service, index) => ({
      key: service.garage_service_id ?? `unassigned-${index}`,
      label: service.name,
      value: service.active_count,
      secondary: `${service.count} toplam kayıt`,
      color: index === 0 ? 'sky' : index === 1 ? 'blue' : 'indigo',
    }));

  const averageDays = data?.average_repair_days;
  const averageLabel =
    averageDays === null || averageDays === undefined
      ? '—'
      : `${averageDays} gün`;

  return (
    <SectionCard
      title="Garaj / Servis Yükü"
      subtitle="Tamirdeki ekipmanın dağılımı"
      icon={Warehouse}
      action={{
        label: 'Tümü',
        onClick: () => navigate('/repair?status=tamirde'),
      }}
      loading={overviewLoading}
      error={error}
      empty={garages.length === 0}
      emptyIcon={Warehouse}
      emptyText="Tamirde ekipman yok"
      emptyHint="Ekipman tamire alındığında garaj yükü burada görünür"
    >
      <div className="flex h-full min-h-0 flex-col">
        <div className="mx-2 mb-2 rounded-lg bg-indigo-50/70 px-3 py-2">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[11px] font-medium uppercase tracking-wide text-indigo-700">
              Ort. arızada kalma
            </span>
            <span className="text-lg font-semibold leading-tight text-indigo-900">
              {averageLabel}
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-indigo-700/80">
            Bugün açılan {data?.opened_today ?? 0} · bugün kapanan{' '}
            {data?.completed_today ?? 0}
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <BarList
            items={garages}
            onSelect={() => navigate('/repair?status=tamirde')}
          />
        </div>
      </div>
    </SectionCard>
  );
}
