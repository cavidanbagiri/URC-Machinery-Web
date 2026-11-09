
// src/pages/Dashboard.jsx
import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { RefreshCw } from 'lucide-react';
import { RxDashboard } from "react-icons/rx";


import {
  fetchStatusStatistics,
  fetchPivotStatistics,
  fetchDashboardOverview,
} from '../stores/dashboard_slice';
import { fetchCurrentUser, fetchTeamMembers } from '../stores/user_slice';
import { formatDateTime } from '../utils/maintenance';
import KpiCards from '../components/dashboard/KpiCards';
import TeamAvatarStack from '../components/dashboard/TeamAvatarStack';
import OpsKpiStrip from '../components/dashboard/OpsKpiStrip';
import AlertStrip from '../components/dashboard/AlertStrip';
import StatusChart from '../components/dashboard/StatusChart';
import PivotTable from '../components/dashboard/PivotTable';
import UserSummary from '../components/dashboard/UserSummary';
import MaintenanceStatusChart from '../components/dashboard/MaintenanceStatusChart';
import RepairTypeChart from '../components/dashboard/RepairTypeChart';
import GarageLoadCard from '../components/dashboard/GarageLoadCard';
import RecentDailyFaults from '../components/dashboard/RecentDailyFaults';
import UpcomingMaintenance from '../components/dashboard/UpcomingMaintenance';
import OverdueRepairs from '../components/dashboard/OverdueRepairs';
import DepotOverview from '../components/dashboard/DepotOverview';
import PendingSpareParts from '../components/dashboard/PendingSpareParts';
import OpenForumTopics from '../components/dashboard/OpenForumTopics';

export default function DashboardPage() {
  const dispatch = useDispatch();
  const {
    error,
    overviewError,
    overviewUpdatedAt,
    loading,
    pivotLoading,
    overviewLoading,
  } = useSelector((s) => s.dashboard);
  const { user } = useSelector((s) => s.auth);

  const refresh = useCallback(() => {
    dispatch(fetchStatusStatistics());
    dispatch(fetchPivotStatistics());
    dispatch(fetchDashboardOverview());
    // The header shows the team's photos, so a refresh reloads them too.
    dispatch(fetchTeamMembers());
  }, [dispatch]);

  useEffect(() => {
    refresh();
    // Keep the header badge (photo, name, position) in sync with the database.
    dispatch(fetchCurrentUser());
  }, [refresh, dispatch]);

  const refreshing = loading || pivotLoading || overviewLoading;
  const errorMessage = error || overviewError;

  return (
    <div className="space-y-6 p-6">

      {/* Üst şerit: solda ekip fotoğrafları, sağda son güncelleme + Yenile */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TeamAvatarStack />

        <div className="flex items-center gap-3">
          {overviewUpdatedAt && (
            <span className="text-[11px] text-gray-400">
              Son güncelleme: {formatDateTime(overviewUpdatedAt)}
            </span>
          )}

          <button
            type="button"
            onClick={refresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`}
            />
            {refreshing ? 'Yükleniyor' : 'Yenile'}
          </button>
        </div>
      </div>

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
              className="ml-2 text-4xl font-semibold tracking-tight text-gray-900">
              Dashboard
            </h1>
          </div>
          <p className="mt-1 text-sm text-gray-500 font-light tracking-tight">
            Makinelerin Durumu ve Dağılımına İlişkin Genel Görünüm
          </p>
        </div>

        <div className="flex flex-col items-start gap-2 sm:items-end">
          <UserSummary user={user} />



        </div>
      </div>



      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMessage}
        </div>
      )}



      {/* <AlertStrip /> */}



      <KpiCards />

      {/* <OpsKpiStrip /> */}



      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <StatusChart />
        </div>

        {/* Sağ 66% — Pivot */}
        <div className="lg:col-span-2">
          <PivotTable />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="min-h-[320px] xl:col-span-2 xl:h-[440px]">
          <DepotOverview />
        </div>

        <div className="flex flex-col gap-6 xl:h-[440px]">
          <div className="min-h-[200px] xl:h-auto xl:min-h-0 xl:flex-1">
            <PendingSpareParts />
          </div>
          <div className="min-h-[200px] xl:h-auto xl:min-h-0 xl:flex-1">
            <OpenForumTopics />
          </div>
        </div>
      </div>



      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="min-h-[300px] xl:h-[360px]">
          <MaintenanceStatusChart />
        </div>
        <div className="min-h-[300px] xl:h-[360px]">
          <RepairTypeChart />
        </div>
        <div className="min-h-[300px] xl:h-[360px]">
          <GarageLoadCard />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="min-h-[300px] xl:h-[320px]">
          <RecentDailyFaults />
        </div>
        <div className="min-h-[300px] xl:h-[320px]">
          <OverdueRepairs />
        </div>
        <div className="min-h-[300px] xl:h-[320px]">
          <UpcomingMaintenance />
        </div>
      </div>


    </div>
  );
}

