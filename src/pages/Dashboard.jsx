// src/pages/DashboardPage.jsx
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { fetchStatusStatistics } from '../stores/dashboard_slice';
import KpiCards from '../components/dashboard/KpiCards';
import StatusChart from '../components/dashboard/StatusChart';

export default function DashboardPage() {
  const dispatch = useDispatch();
  const { error } = useSelector((s) => s.dashboard);

  useEffect(() => {
    dispatch(fetchStatusStatistics());
  }, [dispatch]);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Maşınların statusu üzrə ümumi mənzərə
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <KpiCards />

      {/* Status Chart */}
      <StatusChart />
    </div>
  );
}