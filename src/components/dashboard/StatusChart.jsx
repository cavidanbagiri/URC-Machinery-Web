// src/components/dashboard/StatusChart.jsx
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = {
  green: '#10b981',
  yellow: '#f59e0b',
  blue: '#3b82f6',
  red: '#ef4444',
  gray: '#6b7280',
};

export default function StatusChart() {
  const navigate = useNavigate();
  const { byStatus, total, loading } = useSelector((s) => s.dashboard);

  const chartData = byStatus
    .filter((s) => s.count > 0)
    .map((s) => ({
      ...s,
      fill: COLORS[s.color] || COLORS.gray,
    }));

  const handleClick = (entry) => {
    if (entry?.id) {
      navigate(`/common-cars?status_id=${entry.id}`);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-gray-900">
          Status bölgüsü
        </h2>
        <div className="h-80 animate-pulse rounded-lg bg-gray-100" />
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-gray-900">
          Status bölgüsü
        </h2>
        <div className="flex h-80 items-center justify-center text-sm text-gray-500">
          Hələ heç bir maşın yoxdur
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">
          Status bölgüsü
        </h2>
        <span className="text-xs text-gray-500">
          Chart-a klik → filter
        </span>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="count"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={110}
            paddingAngle={2}
            onClick={handleClick}
            style={{ cursor: 'pointer' }}
            label={({ name, count }) => `${name}: ${count}`}
            labelLine={false}
          >
            {chartData.map((entry, idx) => (
              <Cell key={idx} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [`${value} maşın`, name]}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => (
              <span className="text-sm text-gray-700">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}