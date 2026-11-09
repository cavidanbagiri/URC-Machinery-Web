// src/components/dashboard/ChartTooltip.jsx
//
// Dashboard grafiklerinin ortak Recharts tooltip'i. Recharts unutulmuş
// `<Tooltip content={<ChartTooltip ... />} />` şeklinde kullanılıyor; kendisi
// `active` / `payload` / `label` prop'larını Recharts'tan alır.
//
// Veri satırındaki `name`, `value` ve `fill` alanları beklenir. `secondaryKey`
// verilirse (ör. arıza tipinde `active`) ikinci satırda "... tamirde" gösterilir.
export default function ChartTooltip({
  active,
  payload,
  label,
  unit = '',
  total = 0,
  secondaryKey,
  secondaryLabel,
}) {
  if (!active || !payload?.length) return null;

  const entry = payload[0];
  const row = entry?.payload || {};
  const name = row.name || row.label || label || '';
  const value = Number(row.value ?? row.count ?? entry?.value ?? 0);
  const color = row.fill || entry?.fill || entry?.color || '#6b7280';
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;
  const secondary = secondaryKey ? row[secondaryKey] : null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="max-w-[170px] truncate text-xs font-medium text-gray-700">
          {name}
        </span>
      </div>

      <p className="mt-1 flex items-baseline gap-1.5">
        <span className="text-sm font-bold text-gray-900">{value}</span>
        {unit && (
          <span className="text-[11px] font-normal text-gray-500">{unit}</span>
        )}
        {percent > 0 && (
          <span className="text-[10px] font-medium text-gray-400">
            %{percent}
          </span>
        )}
      </p>

      {secondary !== null && secondary !== undefined && secondaryLabel && (
        <p className="mt-0.5 text-[10px] text-gray-500">
          {secondary} {secondaryLabel}
        </p>
      )}
    </div>
  );
}
