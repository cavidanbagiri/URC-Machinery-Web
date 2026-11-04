// src/components/warehouse/WarehouseSummaryCards.jsx
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  CubeIcon,
  ExclamationTriangleIcon,
  InboxArrowDownIcon,
} from '@heroicons/react/24/outline';

import { formatQuantity } from '../../utils/warehouse';

const CARD_CLASS =
  'rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition';

function Card({ icon: Icon, tone, label, value, hint, onClick }) {
  const Tag = onClick ? 'button' : 'div';

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`${CARD_CLASS} ${
        onClick ? 'text-left hover:border-blue-200 hover:bg-blue-50/40' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            {label}
          </p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
          {hint && <p className="mt-0.5 text-[11px] text-gray-500">{hint}</p>}
        </div>
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tone}`}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </Tag>
  );
}

export default function WarehouseSummaryCards({ summary, loading, onOpenReceipts }) {
  const data = summary || {};

  return (
    <div
      className={`grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 ${
        loading ? 'opacity-70' : ''
      }`}
    >
      <Card
        icon={CubeIcon}
        tone="bg-blue-50 text-blue-600"
        label="Stok Kalemi"
        value={data.stock_items ?? 0}
        hint={`Toplam ${formatQuantity(data.total_quantity ?? 0)} birim`}
      />
      <Card
        icon={ExclamationTriangleIcon}
        tone="bg-amber-50 text-amber-600"
        label="Kritik Stok"
        value={data.critical_items ?? 0}
        hint="Kritik seviyede veya tükenmiş"
      />
      <Card
        icon={InboxArrowDownIcon}
        tone="bg-indigo-50 text-indigo-600"
        label="Depoya Alınacak"
        value={data.pending_receipts ?? 0}
        hint="'Geldi' işaretli yedek parça kalemleri"
        onClick={onOpenReceipts}
      />
      <div className={`${CARD_CLASS} flex flex-col justify-between gap-2`}>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Bu Ay Hareket
        </p>
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
            <ArrowDownTrayIcon className="h-4 w-4" />
            {formatQuantity(data.month_in_quantity ?? 0)}
          </span>
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-rose-600">
            <ArrowUpTrayIcon className="h-4 w-4" />
            {formatQuantity(data.month_out_quantity ?? 0)}
          </span>
        </div>
        <p className="text-[11px] text-gray-500">Giriş / Çıkış miktarları</p>
      </div>
    </div>
  );
}
