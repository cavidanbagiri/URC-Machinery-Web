// src/components/dashboard/DepotOverview.jsx
//
// Depo kartı: özet sayaçlar + bu ayki giriş/çıkış + kritik seviyedeki kalemler.
// Kaynak: GET /warehouse/summary + GET /warehouse/stock?low_stock=true
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Warehouse } from 'lucide-react';
import SectionCard from './SectionCard';
import WidgetList from './WidgetList';
import { tone as toneOf } from './dashboardColors';
import { formatNumber } from '../../utils/maintenance';

function MetricTile({ label, value, tone = 'gray' }) {
  const t = toneOf(tone);

  return (
    <div className={`min-w-0 flex-1 rounded-lg px-3 py-2  ${t.track}`}>
      <span className="block text-[10px] font-medium uppercase tracking-wide text-gray-500">
        {label}
      </span>
      <span className={`block truncate text-base font-semibold ${t.value}`}>
        {value}
      </span>
    </div>
  );
}

function FlowBar({ label, value, max, color }) {
  const width = max > 0 ? Math.max(4, Math.round((value / max) * 100)) : 0;

  return (
    <div className="flex items-center gap-2">
      <span className="w-10 shrink-0 text-[11px] font-medium text-gray-600">
        {label}
      </span>
      <span className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-gray-100">
        <span
          className="block h-full rounded-full transition-all duration-500"
          style={{ width: `${width}%`, backgroundColor: color }}
        />
      </span>
      <span className="w-14 shrink-0 text-right text-[11px] font-semibold text-gray-800">
        {formatNumber(value)}
      </span>
    </div>
  );
}

export default function DepotOverview() {
  const navigate = useNavigate();
  const { overview, overviewLoading } = useSelector((s) => s.dashboard);
  const { data, error } = overview.warehouse;
  const lowStock = overview.lowStock;

  const monthIn = Number(data?.month_in_quantity || 0);
  const monthOut = Number(data?.month_out_quantity || 0);
  const flowMax = Math.max(monthIn, monthOut);

  const rows = (lowStock.items || []).map((item) => ({
    key: item.id,
    icon: Warehouse,
    title: item.name,
    meta: `${item.part_number || 'Parça no yok'} · min ${formatNumber(
      item.min_quantity
    )} ${item.unit || ''}`.trim(),
    value: `${formatNumber(item.quantity)} ${item.unit || ''}`.trim(),
    tone: item.stock_status === 'tukendi' ? 'red' : 'amber',
    onClick: () => navigate('/warehouse_stock?low_stock=1'),
  }));

  return (
    <SectionCard
      title="Depo Durumu"
      subtitle="Stok seviyesi ve bu ayki hareket"
      icon={Warehouse}
      action={{ label: 'Tümü', onClick: () => navigate('/warehouse_stock') }}
      loading={overviewLoading}
      error={error}
      bodyClassName="overflow-y-auto"
    >
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex items-stretch gap-2 px-2">
          <MetricTile
            label="Stok Kalemi"
            value={data?.stock_items ?? 0}
            tone="blue"
          />
          <MetricTile
            label="Kritik"
            value={data?.critical_items ?? 0}
            tone="amber"
          />
          <MetricTile
            label="Bekleyen Giriş"
            value={data?.pending_receipts ?? 0}
            tone="sky"
          />
        </div>

        <div className="mt-3 space-y-1.5 px-2">
          <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
            Bu ay giriş / çıkış
          </p>
          <FlowBar label="Giriş" value={monthIn} max={flowMax} color="#10b981" />
          <FlowBar label="Çıkış" value={monthOut} max={flowMax} color="#f43f5e" />
        </div>

        <div className="mt-3 flex min-h-0 flex-1 flex-col">
          <p className="px-2 pb-1 text-[10px] font-medium uppercase tracking-wide text-gray-400">
            Kritik seviyedeki kalemler
          </p>

          {lowStock.error ? (
            <p className="px-2 py-3 text-[11px] text-gray-500">
              Kritik stok listesi yüklenemedi
            </p>
          ) : rows.length === 0 ? (
            <p className="px-2 py-3 text-[11px] text-gray-500">
              Kritik seviyede kalem yok
            </p>
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto">
              <WidgetList rows={rows} />
            </div>
          )}
        </div>
      </div>
    </SectionCard>
  );
}
