// src/components/dashboard/WidgetList.jsx
//
// Liste widget'larının (son arızalar, gecikmiş bakım/tamir, talepler, forum)
// ortak satır deseni. Satırlar tıklanabilir ve ilgili sayfaya yönlendirir.
import { ChevronRight } from 'lucide-react';
import { tone as toneOf } from './dashboardColors';

export function WidgetRow({
  icon: Icon,
  title,
  meta,
  value,
  tone = 'gray',
  onClick,
  titleAttr,
}) {
  const t = toneOf(tone);

  return (
    <button
      type="button"
      onClick={onClick}
      title={titleAttr || title}
      className="group flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${t.icon}`}
      >
        <Icon className="h-3.5 w-3.5" strokeWidth={2.1} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-medium text-gray-800">
          {title}
        </span>
        {meta && (
          <span className="block truncate text-[11px] text-gray-500">
            {meta}
          </span>
        )}
      </span>

      {value !== null && value !== undefined && value !== '' && (
        <span
          className={`shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${t.badge}`}
        >
          {value}
        </span>
      )}

      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-300 transition group-hover:text-gray-500" />
    </button>
  );
}

export default function WidgetList({ rows = [], className = '' }) {
  return (
    <div className={`flex flex-col ${className}`}>
      {rows.map((row) => (
        <WidgetRow key={row.key} {...row} />
      ))}
    </div>
  );
}
