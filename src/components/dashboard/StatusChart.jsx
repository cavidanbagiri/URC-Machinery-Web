


// src/components/dashboard/StatusChart.jsx
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { PieChart as PieIcon, ExternalLink } from 'lucide-react';

const COLORS = {
  green: '#10b981',
  yellow: '#f59e0b',
  blue: '#3b82f6',
  red: '#ef4444',
  gray: '#6b7280',
};

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-lg">
      <div className="flex items-center gap-2">
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: d.fill }}
        />
        <span className="text-xs font-medium text-gray-700">{d.name}</span>
      </div>
      <p className="mt-1 text-sm font-bold text-gray-900">
        {d.count} <span className="text-xs font-normal text-gray-500">maşın</span>
      </p>
    </div>
  );
}

function Legend({ data, total, onSelect }) {
  return (
    <div className="mt-5 space-y-2">
      {data.map((d) => {
        const pct = total > 0 ? Math.round((d.count / total) * 100) : 0;
        return (
          <button
            key={d.id}
            onClick={() => onSelect(d)}
            className="group flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition hover:bg-gray-50"
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: d.fill }}
            />
            <span className="flex-1 truncate text-xs font-medium text-gray-700">
              {d.name}
            </span>
            <span className="text-xs font-semibold text-gray-900">
              {d.count}
            </span>
            <span className="w-9 text-right text-[11px] text-gray-400">
              {pct}%
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default function StatusChart() {
  const navigate = useNavigate();
  const { byStatus, total, loading } = useSelector((s) => s.dashboard);

  const chartData = byStatus
    .filter((s) => s.count > 0)
    .map((s) => ({ ...s, fill: COLORS[s.color] || COLORS.gray }));

  const handleClick = (entry) => {
    if (entry?.id) navigate(`/common-cars?status_id=${entry.id}`);
  };

  // Skeleton
  if (loading) {
    return (
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 h-5 w-32 animate-pulse rounded bg-gray-100" />
        <div className="mx-auto h-52 w-52 animate-pulse rounded-full bg-gray-100" />
        <div className="mt-6 space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-8 animate-pulse rounded bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (total === 0) {
    return (
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900">
          Status bölgüsü
        </h2>
        <div className="mt-4 flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/60 py-14">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
            <PieIcon className="h-5 w-5" />
          </div>
          <p className="mt-3 text-sm font-medium text-gray-600">
            Hələ heç bir maşın yoxdur
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Maşın əlavə etdikdə burada status bölgüsü görünəcək
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="mb-2 flex items-start justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            Status bölgüsü
          </h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Chart-a klik → filter
          </p>
        </div>
        <button
          onClick={() => navigate('/common-cars')}
          className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-medium text-gray-500 transition hover:bg-gray-50 hover:text-gray-800"
        >
          Hamısı
          <ExternalLink className="h-3 w-3" />
        </button>
      </div>

      {/* Donut */}
      <div className="relative">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={64}
              outerRadius={100}
              paddingAngle={2}
              stroke="#fff"
              strokeWidth={2}
              onClick={handleClick}
              style={{ cursor: 'pointer' }}
            >
              {chartData.map((entry, idx) => (
                <Cell key={idx} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Center total */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold tracking-tight text-gray-900">
            {total}
          </span>
          <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
            maşın
          </span>
        </div>
      </div>

      {/* Interactive legend (öz custom) */}
      <Legend data={chartData} total={total} onSelect={handleClick} />
    </div>
  );
}














// // src/components/dashboard/StatusChart.jsx
// import { useNavigate } from 'react-router-dom';
// import { useSelector } from 'react-redux';
// import {
//   PieChart,
//   Pie,
//   Cell,
//   Tooltip,
//   Legend,
//   ResponsiveContainer,
// } from 'recharts';

// const COLORS = {
//   green: '#10b981',
//   yellow: '#f59e0b',
//   blue: '#3b82f6',
//   red: '#ef4444',
//   gray: '#6b7280',
// };

// export default function StatusChart() {
//   const navigate = useNavigate();
//   const { byStatus, total, loading } = useSelector((s) => s.dashboard);

//   const chartData = byStatus
//     .filter((s) => s.count > 0)
//     .map((s) => ({
//       ...s,
//       fill: COLORS[s.color] || COLORS.gray,
//     }));

//   const handleClick = (entry) => {
//     if (entry?.id) {
//       navigate(`/common-cars?status_id=${entry.id}`);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
//         <h2 className="mb-4 text-base font-semibold text-gray-900">
//           Status bölgüsü
//         </h2>
//         <div className="h-80 animate-pulse rounded-lg bg-gray-100" />
//       </div>
//     );
//   }

//   if (total === 0) {
//     return (
//       <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
//         <h2 className="mb-4 text-base font-semibold text-gray-900">
//           Status bölgüsü
//         </h2>
//         <div className="flex h-80 items-center justify-center text-sm text-gray-500">
//           Hələ heç bir maşın yoxdur
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
//       <div className="mb-4 flex items-center justify-between">
//         <h2 className="text-base font-semibold text-gray-900">
//           Status bölgüsü
//         </h2>
//         <span className="text-xs text-gray-500">
//           Chart-a klik → filter
//         </span>
//       </div>

//       <ResponsiveContainer width="100%" height={320}>
//         <PieChart>
//           <Pie
//             data={chartData}
//             dataKey="count"
//             nameKey="name"
//             cx="50%"
//             cy="50%"
//             innerRadius={70}
//             outerRadius={110}
//             paddingAngle={2}
//             onClick={handleClick}
//             style={{ cursor: 'pointer' }}
//             label={({ name, count }) => `${name}: ${count}`}
//             labelLine={false}
//           >
//             {chartData.map((entry, idx) => (
//               <Cell key={idx} fill={entry.fill} />
//             ))}
//           </Pie>
//           <Tooltip
//             formatter={(value, name) => [`${value} maşın`, name]}
//           />
//           <Legend
//             verticalAlign="bottom"
//             height={36}
//             formatter={(value) => (
//               <span className="text-sm text-gray-700">{value}</span>
//             )}
//           />
//         </PieChart>
//       </ResponsiveContainer>
//     </div>
//   );
// }