
// src/pages/DashboardPage.jsx
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { RxDashboard } from "react-icons/rx";


import {
  fetchStatusStatistics,
  fetchPivotStatistics,
} from '../stores/dashboard_slice';
import { fetchCurrentUser } from '../stores/user_slice';
import KpiCards from '../components/dashboard/KpiCards';
import StatusChart from '../components/dashboard/StatusChart';
import PivotTable from '../components/dashboard/PivotTable';
import UserSummary from '../components/dashboard/UserSummary';

export default function DashboardPage() {
  const dispatch = useDispatch();
  const { error } = useSelector((s) => s.dashboard);
  const { user } = useSelector((s) => s.auth);

  useEffect(() => {
    dispatch(fetchStatusStatistics());
    dispatch(fetchPivotStatistics());   // ← YENİ
    // Keep the header badge (photo, name, position) in sync with the database.
    dispatch(fetchCurrentUser());
  }, [dispatch]);

  return (
    <div className="space-y-6 p-6">
      {/* Header: title on the left, signed-in user on the right */}
      <div
        style={{ fontFamily: 'Inter' }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >

        <div className="min-w-0">
          <div className='flex items-center'>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <RxDashboard className="h-4 w-4" />
            </div>
            <h1
              className="ml-2 text-3xl font-semibold tracking-tight text-gray-900">
              Dashboard
            </h1>
          </div>
          <p className="mt-1 text-sm text-gray-500 font-light tracking-tight">
            Makinelerin Durumu ve Dağılımına İlişkin Genel Görünüm
          </p>
        </div>

        <UserSummary user={user} />
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <KpiCards />

      {/* Status Chart + Pivot Table */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Sol 33% — Status Chart */}
        <div className="lg:col-span-1">
          <StatusChart />
        </div>

        {/* Sağ 66% — Pivot */}
        <div className="lg:col-span-2">
          <PivotTable />
        </div>
      </div>
    </div>
  );
}

