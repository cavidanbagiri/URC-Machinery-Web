// src/components/dashboard/AlertStrip.jsx
//
// Sadece dikkat gerektiren bir durum varsa görünen ince uyarı şeridi.
// Her rozet ilgili sayfayı filtresiyle açar; hiçbir uyarı yoksa bileşen
// hiçbir şey render etmez.
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { AlertTriangle, ChevronRight } from 'lucide-react';

export default function AlertStrip() {
  const navigate = useNavigate();
  const { overview, overviewLoading } = useSelector((s) => s.dashboard);

  if (overviewLoading) return null;

  const maintenance = overview.maintenance.data;
  const warehouse = overview.warehouse.data;
  const repair = overview.repair.data;

  const alerts = [];

  if ((maintenance?.overdue ?? 0) > 0) {
    alerts.push({
      key: 'maintenance',
      text: `${maintenance.overdue} ekipmanın planlı bakımı gecikmiş`,
      to: '/maintenance?status=gecikmis',
    });
  }

  if ((warehouse?.critical_items ?? 0) > 0) {
    alerts.push({
      key: 'stock',
      text: `${warehouse.critical_items} depo kalemi kritik seviyede`,
      to: '/warehouse_stock?low_stock=1',
    });
  }

  if ((repair?.overdue ?? 0) > 0) {
    alerts.push({
      key: 'repair',
      text: `${repair.overdue} tamirin tahmini çıkış tarihi geçti`,
      to: '/repair?status=tamirde',
    });
  }

  if (alerts.length === 0) return null;

  return (
    <div
      style={{ fontFamily: 'Inter' }}
      className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-2.5"
    >
      <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-amber-800">
        <AlertTriangle className="h-3.5 w-3.5" />
        Dikkat
      </span>

      {alerts.map((alert) => (
        <button
          key={alert.key}
          type="button"
          onClick={() => navigate(alert.to)}
          className="group flex items-center gap-0.5 rounded-md bg-white/70 px-2 py-1 text-[11px] font-medium text-amber-900 ring-1 ring-amber-200/80 transition hover:bg-white"
        >
          {alert.text}
          <ChevronRight className="h-3 w-3 text-amber-600 transition group-hover:translate-x-0.5" />
        </button>
      ))}
    </div>
  );
}
