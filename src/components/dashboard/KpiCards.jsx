
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
    bg: 'bg-emerald-50/70',
    ring: 'ring-emerald-100',
    hoverBg: 'group-hover:bg-emerald-50',
    dot: 'bg-emerald-500',
    iconBg: 'bg-white text-emerald-600 ring-1 ring-emerald-100',
    value: 'text-emerald-700',
    bar: 'bg-emerald-500',
    barTrack: 'bg-emerald-100',
  },
  yellow: {
    bg: 'bg-amber-50/70',
    ring: 'ring-amber-100',
    hoverBg: 'group-hover:bg-amber-50',
    dot: 'bg-amber-500',
    iconBg: 'bg-white text-amber-600 ring-1 ring-amber-100',
    value: 'text-amber-700',
    bar: 'bg-amber-500',
    barTrack: 'bg-amber-100',
  },
  blue: {
    bg: 'bg-blue-50/70',
    ring: 'ring-blue-100',
    hoverBg: 'group-hover:bg-blue-50',
    dot: 'bg-blue-500',
    iconBg: 'bg-white text-blue-600 ring-1 ring-blue-100',
    value: 'text-blue-700',
    bar: 'bg-blue-500',
    barTrack: 'bg-blue-100',
  },
  red: {
    bg: 'bg-rose-50/70',
    ring: 'ring-rose-100',
    hoverBg: 'group-hover:bg-rose-50',
    dot: 'bg-rose-500',
    iconBg: 'bg-white text-rose-600 ring-1 ring-rose-100',
    value: 'text-rose-700',
    bar: 'bg-rose-500',
    barTrack: 'bg-rose-100',
  },
  gray: {
    bg: 'bg-gray-50/70',
    ring: 'ring-gray-100',
    hoverBg: 'group-hover:bg-gray-50',
    dot: 'bg-gray-500',
    iconBg: 'bg-white text-gray-600 ring-1 ring-gray-100',
    value: 'text-gray-700',
    bar: 'bg-gray-500',
    barTrack: 'bg-gray-100',
  },
};

// Durum adına göre ikon seçimi
const pickIcon = (name = '') => {
  const n = name.toLowerCase();
  if (n.includes('aktif') || n.includes('active')) return CheckCircle2;
  if (n.includes('bekle') || n.includes('gözlə') || n.includes('pending')) return Clock;
  if (n.includes('tamir') || n.includes('təmir') || n.includes('repair') || n.includes('bakım') || n.includes('bakim')) return Wrench;
  if (n.includes('problem') || n.includes('arıza') || n.includes('xəta')) return AlertTriangle;
  if (n.includes('hurda')) return AlertTriangle;
  return Car;
};

function SkeletonCard() {
  return (
    <div className="h-[132px] animate-pulse rounded-2xl bg-gray-100 ring-1 ring-gray-200/60" />
  );
}

function KpiCard({ label, value, suffix, icon: Icon, color = 'gray', percent, onClick, isTotal = false }) {
  const c = colorTokens[color] || colorTokens.gray;

  return (
    <button
      onClick={onClick}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl p-5 text-left ring-1 transition-all duration-200 ${c.bg} ${c.ring} ${c.hoverBg} hover:-translate-y-0.5 hover:shadow-lg hover:shadow-gray-200/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500`}
    >
      {/* Yumşaq gradient — dərinlik üçün */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/60 to-transparent" />

      {/* Top row: icon + arrow */}
      <div className="relative flex items-start justify-between">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${c.iconBg}`}>
          <Icon className="h-4.5 w-4.5" strokeWidth={2.2} />
        </div>
        <ArrowUpRight className="h-4 w-4 text-gray-400 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-gray-600" />
      </div>

      {/* Middle: label + value */}
      <div className="relative mt-4 flex justify-between items-center">
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className={`text-3xl font-bold leading-none tracking-tight ${isTotal ? 'text-gray-900' : c.value}`}>
            {value}
          </span>
          {suffix && <span className="text-xs font-medium text-gray-500">{suffix}</span>}
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-600">
          {label}
        </p>
      </div>

      {/* Bottom: percent or progress bar */}
      {percent !== undefined && (
        <div className="relative mt-3">
          <div className="flex items-center justify-between text-[11px] text-gray-600">
            <span>Oranı</span>
            <span className="font-semibold text-gray-800">{percent}%</span>
          </div>
          <div className={`mt-1.5 h-1 w-full overflow-hidden rounded-full ${c.barTrack}`}>
            <div
              className={`h-full rounded-full ${c.bar} transition-all duration-500`}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      )}

      {isTotal && (
        <div className="relative mt-3 flex items-center gap-1 text-[11px] font-medium text-gray-600">
          <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
          Tüm makineler
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
    <div style={{ fontFamily: 'Inter' }}
    className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
      <KpiCard
        label="Genel"
        value={total}
        suffix=""
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