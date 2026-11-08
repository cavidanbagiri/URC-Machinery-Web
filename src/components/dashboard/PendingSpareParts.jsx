// src/components/dashboard/PendingSpareParts.jsx
//
// Onay bekleyen yedek parça talepleri.
// Kaynak: GET /purchase-requests/spare-parts?status=bekleniyor
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ShoppingCart } from 'lucide-react';
import SectionCard from './SectionCard';
import WidgetList from './WidgetList';
import { formatDate } from '../../utils/repair';

export default function PendingSpareParts() {
  const navigate = useNavigate();
  const { overview, overviewLoading } = useSelector((s) => s.dashboard);
  const { items, total, error } = overview.spareParts;

  const rows = (items || []).map((request) => {
    const machines = (request.machine_labels || []).join(', ');

    return {
      key: request.id,
      icon: ShoppingCart,
      title: request.title,
      meta: `${machines || 'Makine seçilmemiş'} · ${formatDate(
        request.request_date
      )}`,
      value: `${request.item_count} kalem`,
      tone: 'amber',
      onClick: () => navigate('/purchase_requests?status=bekleniyor'),
    };
  });

  return (
    <SectionCard
      title="Bekleyen Yedek Parça"
      subtitle={`${total} talep teslim bekliyor`}
      icon={ShoppingCart}
      action={{
        label: 'Tümü',
        onClick: () => navigate('/purchase_requests?status=bekleniyor'),
      }}
      loading={overviewLoading}
      error={error}
      empty={rows.length === 0}
      emptyIcon={ShoppingCart}
      emptyText="Bekleyen talep yok"
      emptyHint="Tüm yedek parça talepleri teslim alınmış"
      bodyClassName="overflow-y-auto"
    >
      <WidgetList rows={rows} />
    </SectionCard>
  );
}
