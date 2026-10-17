
// src/components/dashboard/KpiCards.jsx
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Car,
  CheckCircle2,
  Clock,
  Wrench,
  AlertTriangle,
  ArrowUpRight,
} from 'lucide-react';

const colorTokens = {
  green: {
    ring: 'ring-emerald-200/70',
    hoverRing: 'hover:ring-emerald-300',
    dot: 'bg-emerald-500',
    iconBg: 'bg-emerald-50 text-emerald-600',
    value: 'text-emerald-700',
    bar: 'bg-emerald-500',
  },
  yellow: {
    ring: 'ring-amber-200/70',
    hoverRing: 'hover:ring-amber-300',
    dot: 'bg-amber-500',
    iconBg: 'bg-amber-50 text-amber-600',
    value: 'text-amber-700',
    bar: 'bg-amber-500',
  },
  blue: {
    ring: 'ring-blue-200/70',
    hoverRing: 'hover:ring-blue-300',
    dot: 'bg-blue-500',
    iconBg: 'bg-blue-50 text-blue-600',
    value: 'text-blue-700',
    bar: 'bg-blue-500',
  },
  red: {
    ring: 'ring-rose-200/70',
    hoverRing: 'hover:ring-rose-300',
    dot: 'bg-rose-500',
    iconBg: 'bg-rose-50 text-rose-600',
    value: 'text-rose-700',
    bar: 'bg-rose-500',
  },
  gray: {
    ring: 'ring-gray-200/70',
    hoverRing: 'hover:ring-gray-300',
    dot: 'bg-gray-500',
    iconBg: 'bg-gray-50 text-gray-600',
    value: 'text-gray-700',
    bar: 'bg-gray-500',
  },
};

// status adına görə ikon seçimi (istəyə görə uyğunlaşdır)
const pickIcon = (name = '') => {
  const n = name.toLowerCase();
  if (n.includes('aktiv') || n.includes('active')) return CheckCircle2;
  if (n.includes('gözlə') || n.includes('pending')) return Clock;
  if (n.includes('təmir') || n.includes('repair')) return Wrench;
  if (n.includes('problem') || n.includes('xəta')) return AlertTriangle;
  return Car;
};

function SkeletonCard() {
  return (
    <div className="h-[132px] animate-pulse rounded-2xl bg-gray-100 ring-1 ring-gray-200/60" />
  );
}

function KpiCard({
  label,
  value,
  suffix,
  icon: Icon,
  color = 'gray',
  percent,
  onClick,
  isTotal = false,
}) {
  const c = colorTokens[color] || colorTokens.gray;

  return (
    <button
      onClick={onClick}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-white p-5 text-left ring-1 transition-all duration-200 ${c.ring} ${c.hoverRing} hover:-translate-y-0.5 hover:shadow-lg hover:shadow-gray-200/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500`}
    >
      {/* subtle gradient wash on hover */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {/* Top row: icon + arrow */}
      <div className="relative flex items-start justify-between">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${c.iconBg}`}>
          <Icon className="h-4.5 w-4.5" strokeWidth={2.2} />
        </div>
        <ArrowUpRight className="h-4 w-4 text-gray-300 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-gray-500" />
      </div>

      {/* Middle: label + value */}
      <div className="relative mt-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
          {label}
        </p>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className={`text-3xl font-bold leading-none tracking-tight ${isTotal ? 'text-gray-900' : c.value}`}>
            {value}
          </span>
          {suffix && (
            <span className="text-xs font-medium text-gray-400">{suffix}</span>
          )}
        </div>
      </div>

      {/* Bottom: percent or progress bar */}
      {percent !== undefined && (
        <div className="relative mt-3">
          <div className="flex items-center justify-between text-[11px] text-gray-500">
            <span>Payı</span>
            <span className="font-semibold text-gray-700">{percent}%</span>
          </div>
          <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className={`h-full rounded-full ${c.bar} transition-all duration-500`}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      )}

      {isTotal && (
        <div className="relative mt-3 flex items-center gap-1 text-[11px] font-medium text-gray-500">
          <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
          bütün maşınlar
        </div>
      )}
    </button>
  );
}

export default function KpiCards() {
  const navigate = useNavigate();
  const { total, byStatus, loading } = useSelector((s) => s.dashboard);

  const goToMachines = (statusId = null) => {
    navigate(statusId ? `/common_cars?status_id=${statusId}` : '/common_cars');
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
      <KpiCard
        label="Ümumi"
        value={total}
        suffix="maşın"
        icon={Car}
        color="blue"
        isTotal
        onClick={() => goToMachines()}
      />

      {byStatus.map((status) => {
        const percent =
          total > 0 ? Math.round((status.count / total) * 100) : 0;
        const Icon = pickIcon(status.name);

        return (
          <KpiCard
            key={status.id}
            label={status.name}
            value={status.count}
            icon={Icon}
            color={status.color}
            percent={percent}
            onClick={() => goToMachines(status.id)}
          />
        );
      })}
    </div>
  );
}


















// // src/components/dashboard/KpiCards.jsx
// import { useNavigate } from 'react-router-dom';
// import { useSelector } from 'react-redux';

// const colorClasses = {
//   green: {
//     bg: 'bg-green-50',
//     text: 'text-green-700',
//     hover: 'hover:bg-green-100 hover:border-green-300',
//     dot: 'bg-green-500',
//   },
//   yellow: {
//     bg: 'bg-yellow-50',
//     text: 'text-yellow-700',
//     hover: 'hover:bg-yellow-100 hover:border-yellow-300',
//     dot: 'bg-yellow-500',
//   },
//   blue: {
//     bg: 'bg-blue-50',
//     text: 'text-blue-700',
//     hover: 'hover:bg-blue-100 hover:border-blue-300',
//     dot: 'bg-blue-500',
//   },
//   red: {
//     bg: 'bg-red-50',
//     text: 'text-red-700',
//     hover: 'hover:bg-red-100 hover:border-red-300',
//     dot: 'bg-red-500',
//   },
//   gray: {
//     bg: 'bg-gray-50',
//     text: 'text-gray-700',
//     hover: 'hover:bg-gray-100 hover:border-gray-300',
//     dot: 'bg-gray-500',
//   },
// };

// export default function KpiCards() {
//   const navigate = useNavigate();
//   const { total, byStatus, loading } = useSelector((s) => s.dashboard);

//   const goToMachines = (statusId = null) => {
//     if (statusId) {
//       navigate(`/common_cars?status_id=${statusId}`);
//     } else {
//       navigate('/common_cars');
//     }
//   };

//   if (loading) {
//     return (
//       <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
//         {[...Array(5)].map((_, i) => (
//           <div
//             key={i}
//             className="h-24 animate-pulse rounded-xl border border-gray-200 bg-gray-100"
//           />
//         ))}
//       </div>
//     );
//   }

//   return (
//     <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
//       {/* Total */}
//       <button
//         onClick={() => goToMachines()}
//         className="flex flex-col items-start rounded-xl border border-gray-200 bg-white p-5 text-left transition hover:border-blue-300 hover:bg-blue-50"
//       >
//         <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
//           Ümumi
//         </span>
//         <span className="mt-2 text-3xl font-bold text-gray-900">{total}</span>
//         <span className="mt-1 text-xs text-gray-500">bütün maşınlar</span>
//       </button>

//       {/* Statuslar */}
//       {byStatus.map((status) => {
//         const c = colorClasses[status.color] || colorClasses.gray;
//         return (
//           <button
//             key={status.id}
//             onClick={() => goToMachines(status.id)}
//             className={`flex flex-col items-start rounded-xl border border-gray-200 bg-white p-5 text-left transition ${c.hover}`}
//           >
//             <div className="flex items-center gap-2">
//               <span className={`h-2.5 w-2.5 rounded-full ${c.dot}`} />
//               <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
//                 {status.name}
//               </span>
//             </div>
//             <span className={`mt-2 text-3xl font-bold ${c.text}`}>
//               {status.count}
//             </span>
//             <span className="mt-1 text-xs text-gray-500">
//               {total > 0
//                 ? `${Math.round((status.count / total) * 100)}%`
//                 : '0%'}
//             </span>
//           </button>
//         );
//       })}
//     </div>
//   );
// }