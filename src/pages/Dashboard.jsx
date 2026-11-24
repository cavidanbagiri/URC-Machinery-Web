
// src/pages/Dashboard.jsx
import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { RefreshCw } from 'lucide-react';


import {
  fetchStatusStatistics,
  fetchPivotStatistics,
  fetchDashboardOverview,
} from '../stores/dashboard_slice';
import { fetchCurrentUser, fetchTeamMembers } from '../stores/user_slice';
import KpiCards from '../components/dashboard/KpiCards';
import FuelDistributionChart from '../components/dashboard/FuelDistributionChart';
import TeamAvatarStack from '../components/dashboard/TeamAvatarStack';
import StatusChart from '../components/dashboard/StatusChart';
import PivotTable from '../components/dashboard/PivotTable';
import UserSummary from '../components/dashboard/UserSummary';
import MaintenanceStatusChart from '../components/dashboard/MaintenanceStatusChart';
import RepairTypeChart from '../components/dashboard/RepairTypeChart';
import GarageLoadCard from '../components/dashboard/GarageLoadCard';
import RecentDailyFaults from '../components/dashboard/RecentDailyFaults';
import UpcomingMaintenance from '../components/dashboard/UpcomingMaintenance';
import OverdueRepairs from '../components/dashboard/OverdueRepairs';
// import DepotOverview from '../components/dashboard/DepotOverview';
import PendingSpareParts from '../components/dashboard/PendingSpareParts';
import OpenForumTopics from '../components/dashboard/OpenForumTopics';

export default function DashboardPage() {
  const dispatch = useDispatch();
  const {
    error,
    overviewError,
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

      <div style={{ fontFamily: 'Inter' }} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 ">
          <div className='flex items-center'>
            <h1 className="ml-2 text-4xl font-semibold tracking-tight text-black">Güncel Durum Raporu</h1>
          </div>
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

      <div className="grid grid-cols-1 gap-6  lg:grid-cols-2">
        {/* <PivotTable /> */}
          <KpiCards columns={2} />
        <div className="flex min-h-0 flex-col gap-6">
          <div className=" flex-1">
            <FuelDistributionChart />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 ">
        <div className="min-h-[360px] xl:h-[400px]">
          <StatusChart />
        </div>
        <div className="min-h-[360px] xl:h-[400px]">
          <MaintenanceStatusChart />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3 ">
        <div className="min-h-[320px] xl:h-[400px]">
          <PendingSpareParts />
        </div>
        <div className="min-h-[320px] xl:h-[400px]">
          <RepairTypeChart />
        </div>
        <div className="min-h-[320px] xl:h-[400px]">
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

