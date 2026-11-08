// src/components/dashboard/OpsKpiStrip.jsx
//
// Makine envanteri şeridinin (KpiCards) altındaki operasyon şeridi. Mevcut
// /repair, /maintenance, /warehouse ve /purchase-requests endpointlerinin
// özetlerini kullanır; her kart ilgili sayfaya filtreyle gider.
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  AlertTriangle,
  CalendarDays,
  ShoppingCart,
  Warehouse,
  Wrench,
} from 'lucide-react';
import { tone as toneOf } from './dashboardColors';
import { monthStartISO } from '../../stores/dashboard_slice';

const CARD_GRID =
  'grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5';

function OpsCard({ label, value, hint, icon: Icon, tone = 'gray', onClick }) {
  const t = toneOf(tone);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition hover:-translate-y-0.5 hover:shadow-sm hover:shadow-gray-200/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${t.wrap}`}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${t.icon}`}
      >
        <Icon className="h-5 w-5" strokeWidth={2.1} />
      </span>
      <span className="min-w-0">
        <span className="block text-[11px] font-medium uppercase tracking-wide text-gray-500">
          {label}
        </span>
        <span className={`block text-2xl font-semibold leading-tight ${t.value}`}>
          {value}
        </span>
        {hint && (
          <span className="block truncate text-[11px] text-gray-500">{hint}</span>
        )}
      </span>
    </button>
  );
}

export default function OpsKpiStrip() {
  const navigate = useNavigate();
  const { overview, overviewLoading } = useSelector((s) => s.dashboard);

  const repair = overview.repair;
  const maintenance = overview.maintenance;
  const warehouse = overview.warehouse;
  const { spareParts, dailyFaults } = overview;

  if (overviewLoading) {
    return (
      <div className={CARD_GRID}>
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-[86px] animate-pulse rounded-xl bg-gray-100 ring-1 ring-gray-200/60"
          />
        ))}
      </div>
    );
  }

  const averageDays = repair.data?.average_repair_days;

  return (
    <div style={{ fontFamily: 'Inter' }} className={CARD_GRID}>
      <OpsCard
        label="Tamirde"
        value={repair.error ? '—' : repair.data?.active ?? 0}
        hint={
          repair.error
            ? 'Tamir özeti yüklenemedi'
            : `${repair.data?.overdue ?? 0} gecikmiş tamir`
        }
        icon={Wrench}
        tone="blue"
        onClick={() => navigate('/repair?status=tamirde')}
      />

      <OpsCard
        label="Gecikmiş Bakım"
        value={maintenance.error ? '—' : maintenance.data?.overdue ?? 0}
        hint={
          maintenance.error
            ? 'Bakım özeti yüklenemedi'
            : `${maintenance.data?.due_soon ?? 0} yaklaşıyor`
        }
        icon={AlertTriangle}
        tone="red"
        onClick={() => navigate('/maintenance?status=gecikmis')}
      />

      <OpsCard
        label="Kritik Stok"
        value={warehouse.error ? '—' : warehouse.data?.critical_items ?? 0}
        hint={
          warehouse.error
            ? 'Depo özeti yüklenemedi'
            : `${warehouse.data?.pending_receipts ?? 0} bekleyen giriş`
        }
        icon={Warehouse}
        tone="amber"
        onClick={() => navigate('/warehouse_stock?low_stock=1')}
      />

      <OpsCard
        label="Bekleyen Talep"
        value={spareParts.error ? '—' : spareParts.total}
        hint={
          spareParts.error ? 'Talep verisi yüklenemedi' : 'yedek parça talebi'
        }
        icon={ShoppingCart}
        tone="sky"
        onClick={() => navigate('/purchase_requests?status=bekleniyor')}
      />

      <OpsCard
        label="Bu Ay Arıza"
        value={dailyFaults.error ? '—' : dailyFaults.monthCount}
        hint={
          dailyFaults.error
            ? 'Arıza verisi yüklenemedi'
            : averageDays === null || averageDays === undefined
              ? 'günlük arıza kaydı'
              : `ort. ${averageDays} gün tamirde`
        }
        icon={CalendarDays}
        tone="indigo"
        onClick={() => navigate(`/daily_faults?date_from=${monthStartISO()}`)}
      />
    </div>
  );
}
