// src/components/dashboard/BarList.jsx
//
// Yatay bar listesi — bakım durumu ve arıza tipi dağılımları için. Uzun Türkçe
// etiketler eksen etiketi olarak kırpıldığı için Recharts yerine hafif bir
// div tabanlı bar kullanıyoruz.
import { chartColor } from './dashboardColors';

export default function BarList({ items = [], onSelect }) {
  const max = items.reduce((acc, item) => Math.max(acc, item.value), 0);

  return (
    <div className="flex flex-col">
      {items.map((item) => {
        const width = max > 0 ? Math.max(4, Math.round((item.value / max) * 100)) : 0;

        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onSelect?.(item)}
            title={`${item.label}: ${item.value}${item.secondary ? ` (${item.secondary})` : ''}`}
            className="group flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <span className="w-[42%] shrink-0 truncate text-[11px] font-medium text-gray-700">
              {item.label}
            </span>

            <span className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-gray-100">
              <span
                className="block h-full rounded-full transition-all duration-500"
                style={{
                  width: `${width}%`,
                  backgroundColor: chartColor(item.color),
                }}
              />
            </span>

            <span className="w-8 shrink-0 text-right text-[11px] font-semibold text-gray-800">
              {item.value}
            </span>
          </button>
        );
      })}
    </div>
  );
}
