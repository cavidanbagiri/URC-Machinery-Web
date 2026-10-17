// src/components/dashboard/KpiCards.jsx
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const colorClasses = {
  green: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    hover: 'hover:bg-green-100 hover:border-green-300',
    dot: 'bg-green-500',
  },
  yellow: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
    hover: 'hover:bg-yellow-100 hover:border-yellow-300',
    dot: 'bg-yellow-500',
  },
  blue: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    hover: 'hover:bg-blue-100 hover:border-blue-300',
    dot: 'bg-blue-500',
  },
  red: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    hover: 'hover:bg-red-100 hover:border-red-300',
    dot: 'bg-red-500',
  },
  gray: {
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    hover: 'hover:bg-gray-100 hover:border-gray-300',
    dot: 'bg-gray-500',
  },
};

export default function KpiCards() {
  const navigate = useNavigate();
  const { total, byStatus, loading } = useSelector((s) => s.dashboard);

  const goToMachines = (statusId = null) => {
    if (statusId) {
      navigate(`/common_cars?status_id=${statusId}`);
    } else {
      navigate('/common_cars');
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-xl border border-gray-200 bg-gray-100"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
      {/* Total */}
      <button
        onClick={() => goToMachines()}
        className="flex flex-col items-start rounded-xl border border-gray-200 bg-white p-5 text-left transition hover:border-blue-300 hover:bg-blue-50"
      >
        <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Ümumi
        </span>
        <span className="mt-2 text-3xl font-bold text-gray-900">{total}</span>
        <span className="mt-1 text-xs text-gray-500">bütün maşınlar</span>
      </button>

      {/* Statuslar */}
      {byStatus.map((status) => {
        const c = colorClasses[status.color] || colorClasses.gray;
        return (
          <button
            key={status.id}
            onClick={() => goToMachines(status.id)}
            className={`flex flex-col items-start rounded-xl border border-gray-200 bg-white p-5 text-left transition ${c.hover}`}
          >
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${c.dot}`} />
              <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                {status.name}
              </span>
            </div>
            <span className={`mt-2 text-3xl font-bold ${c.text}`}>
              {status.count}
            </span>
            <span className="mt-1 text-xs text-gray-500">
              {total > 0
                ? `${Math.round((status.count / total) * 100)}%`
                : '0%'}
            </span>
          </button>
        );
      })}
    </div>
  );
}