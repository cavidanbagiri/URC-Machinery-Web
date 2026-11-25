// src/components/dashboard/LastUpdatedBadge.jsx
//
// Dashboard başlığındaki "Son güncelleme" etiketi + Yenile düğmesi. Zaman
// damgası `dashboard_slice` içindeki `overviewUpdatedAt`'ten gelir: sayfanın
// kendi `refresh()` fonksiyonu durum + pivot + operasyon verilerini yeniden
// çeker, operasyon katmanı tamamlandığında store damgayı tazeler. Düğme de aynı
// `refresh()` fonksiyonunu çağırır, bu yüzden etiket her zaman en son yüklenen
// veriyi gösterir.
import { Clock, RefreshCw } from 'lucide-react';

import { formatDateTime } from '../../utils/maintenance';

export default function LastUpdatedBadge({ updatedAt, refreshing, onRefresh }) {
  const label = updatedAt
    ? formatDateTime(updatedAt)
    : refreshing
      ? 'Yükleniyor…'
      : '—';

  return (
    <div className="flex flex-wrap items-center gap-2 text-[11px] w-full justify-end">
      <span
        aria-live="polite"
        className="inline-flex ml-1 items-center gap-1.5 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-gray-500"
      >
        <Clock className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
        Son güncelleme:
        <span
          className="font-semibold tabular-nums text-gray-700"
          title={updatedAt ? new Date(updatedAt).toLocaleString('tr-TR') : undefined}
        >
          {label}
        </span>
      </span>

      <button
        type="button"
        onClick={onRefresh}
        disabled={refreshing}
        title="Verileri yenile"
        className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 font-semibold text-blue-600 ring-1 ring-blue-100 transition hover:bg-blue-50 disabled:cursor-wait disabled:text-gray-400 disabled:ring-gray-200"
      >
        <RefreshCw
          className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`}
          aria-hidden="true"
        />
        {refreshing ? 'Yenileniyor…' : 'Yenile'}
      </button>
    </div>
  );
}
