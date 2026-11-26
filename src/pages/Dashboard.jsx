
// src/pages/Dashboard.jsx
import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
  fetchStatusStatistics,
  fetchPivotStatistics,
  fetchDashboardOverview,
} from '../stores/dashboard_slice';
import { fetchCurrentUser, fetchTeamMembers } from '../stores/user_slice';
import { fetchIsgProjectSummary } from '../stores/isg_slice';
import KpiCards from '../components/dashboard/KpiCards';
import FuelDistributionChart from '../components/dashboard/FuelDistributionChart';
import TeamDirectoryCard from '../components/dashboard/TeamDirectoryCard';
import IsgProjectSummaryCard from '../components/dashboard/IsgProjectSummaryCard';
import StatusChart from '../components/dashboard/StatusChart';
import UserSummary from '../components/dashboard/UserSummary';
import MaintenanceStatusChart from '../components/dashboard/MaintenanceStatusChart';
import RepairTypeChart from '../components/dashboard/RepairTypeChart';
import GarageLoadCard from '../components/dashboard/GarageLoadCard';
import RecentDailyFaults from '../components/dashboard/RecentDailyFaults';
import UpcomingMaintenance from '../components/dashboard/UpcomingMaintenance';
import OverdueRepairs from '../components/dashboard/OverdueRepairs';
// import DepotOverview from '../components/dashboard/DepotOverview';
import PendingSpareParts from '../components/dashboard/PendingSpareParts';
import LastUpdatedBadge from '../components/dashboard/LastUpdatedBadge';

export default function DashboardPage() {
  const dispatch = useDispatch();
  const {
    error,
    overviewError,
    loading,
    pivotLoading,
    overviewLoading,
    overviewUpdatedAt,
  } = useSelector((s) => s.dashboard);
  const { user } = useSelector((s) => s.auth);

  const refresh = useCallback(() => {
    dispatch(fetchStatusStatistics());
    dispatch(fetchPivotStatistics());
    dispatch(fetchDashboardOverview());
    dispatch(fetchTeamMembers());
    dispatch(fetchIsgProjectSummary());
  }, [dispatch]);

  useEffect(() => {
    refresh();
    dispatch(fetchCurrentUser());
  }, [refresh, dispatch]);

  const refreshing = loading || pivotLoading || overviewLoading;
  const errorMessage = error || overviewError;

  return (
    <div className="space-y-4 p-6">

      {/* <div className='flex justify-between w-full '>
        <LastUpdatedBadge
          updatedAt={overviewUpdatedAt}
          refreshing={refreshing}
          onRefresh={refresh}
        />
      </div> */}

      <div style={{ fontFamily: 'Inter' }} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 ">
          <div className='flex items-center'>
            <h1 className="ml-2 text-4xl font-semibold tracking-tight text-black">Güncel Durum Raporu</h1>
          </div>
        </div>

        <div className="flex flex-col items-start gap-2 sm:items-end">
          <UserSummary user={user} />
           <LastUpdatedBadge
            updatedAt={overviewUpdatedAt}
            refreshing={refreshing}
            onRefresh={refresh}
            />
        </div>
      </div>



      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {/* Makine envanteri KPI'ları: tam genişlik, tek satır (toplam, URC, aktif, kiralık, projeler). */}
      <KpiCards />

      
      {/* Mazot dağılımı (%65) + kullanıcı tablosu (%35) aynı satırda. */}
      <div className="flex flex-col gap-4 xl:h-[400px] xl:flex-row">
        <div className="h-[380px] w-full xl:h-full xl:w-[65%]">
          <FuelDistributionChart />
        </div>
        <div className="h-[360px] w-full xl:h-full xl:min-w-0 xl:flex-1">
          <TeamDirectoryCard />
        </div>
      </div>

      {/* Arıza tipi (%32) + durum grafikleri: masaüstünde tek satır. */}
      <div className="flex flex-col gap-6 xl:h-[400px] xl:flex-row">
        <div className="h-[320px] w-full xl:h-full xl:w-[32%] xl:shrink-0">
          <RepairTypeChart />
        </div>
        <div className="h-[360px] w-full xl:h-full xl:min-w-0 xl:flex-1 xl:basis-0">
          <StatusChart />
        </div>
        <div className="h-[360px] w-full xl:h-full xl:min-w-0 xl:flex-1 xl:basis-0">
          <MaintenanceStatusChart />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Sol kolon: iki kart dikeyde eşit paylaşır (xl'de 480px'in yarısı). */}
        <div className="flex flex-col gap-4 xl:h-full">
          <div className="h-[300px] w-full xl:h-auto xl:min-h-0 xl:flex-1">
            <PendingSpareParts />
          </div>
          <div className="h-[300px] w-full xl:h-auto xl:min-h-0 xl:flex-1">
            <GarageLoadCard />
          </div>
        </div>
        <div className="min-h-[320px] xl:h-[480px]">
          <IsgProjectSummaryCard />
        </div>
        <div className="min-h-[320px] xl:h-[480px]">
          <OverdueRepairs />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="min-h-[300px] xl:h-[320px]">
          <RecentDailyFaults />
        </div>
        <div className="min-h-[300px] xl:h-[320px]">
          <UpcomingMaintenance />
        </div>
      </div>


    </div>
  );
}

