// src/components/stock/StockSummaryCards.jsx
import {
  ArrowUpTrayIcon,
  CubeIcon,
  ExclamationTriangleIcon,
  ScaleIcon,
} from '@heroicons/react/24/outline';

import { formatQuantity } from '../../utils/stock';

const CARD_CLASS =
  'rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition';

function Card({ icon: Icon, tone, label, value, hint }) {
  return (
    <div className={CARD_CLASS}>
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
    </div>
  );
}

export default function StockSummaryCards({ summary, loading }) {
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
        label="Malzeme Kartı"
        value={data.item_count ?? 0}
        hint="Elle tanımlanan stok kalemleri"
      />
      <Card
        icon={ScaleIcon}
        tone="bg-emerald-50 text-emerald-600"
        label="Toplam Miktar"
        value={formatQuantity(data.total_quantity ?? 0)}
        hint="Tüm kartlardaki kalan miktar"
      />
      <Card
        icon={ExclamationTriangleIcon}
        tone="bg-rose-50 text-rose-600"
        label="Stokta Yok"
        value={data.out_of_stock_items ?? 0}
        hint="Miktarı sıfır olan kartlar"
      />
      <Card
        icon={ArrowUpTrayIcon}
        tone="bg-indigo-50 text-indigo-600"
        label="Bu Ay Sahaya Çıkan"
        value={formatQuantity(data.month_issue_quantity ?? 0)}
        hint={`${data.month_issue_count ?? 0} çıkış kaydı`}
      />
    </div>
  );
}
