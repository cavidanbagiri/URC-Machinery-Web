// src/pages/MeterLogs.jsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast, { Toaster } from 'react-hot-toast';
import {
  ArchiveBoxIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
  TableCellsIcon,
} from '@heroicons/react/24/outline';
import { IoSpeedometerOutline } from 'react-icons/io5';

import MeterLogEntryTable from '../components/meterlog/MeterLogEntryTable';
import MeterLogWeekTable from '../components/meterlog/MeterLogWeekTable';
import SegmentedTabs from '../components/ui/SegmentedTabs';
import { TABLE_CARD } from '../components/ui/tableStyles';
import {
  createMeterLog,
  fetchMeterLogOverview,
} from '../stores/meter_log_slice';
import { formatDate, formatNumber, todayISO } from '../utils/maintenance';
import { buildDateRange, latestEntryForDate } from '../utils/meterLog';

const SEARCH_FIELDS = [
  'identification_no',
  'plate_no',
  'vin_no',
  'type_name',
  'subtype_name',
  'car_mark_name',
  'car_model_name',
  'territory_name',
  'company_name',
];

export default function MeterLogs() {
  const dispatch = useDispatch();
  const { overview, loading, error, mutationError } = useSelector(
    (state) => state.meterLog
  );

  const [selectedDate, setSelectedDate] = useState(todayISO);
  const [search, setSearch] = useState('');
  const [onlyMissing, setOnlyMissing] = useState(false);
  // Tablolar tek kartta iki sekmede gösterilir: giriş ("Mevcut") ve geçmiş
  // kayıt matrisi ("Arşiv"). Varsayılan, günlük girişi yapılan sekmedir.
  const [activeTab, setActiveTab] = useState('current');

  useEffect(() => {
    dispatch(fetchMeterLogOverview({ days: 7, end_date: selectedDate }));
  }, [dispatch, selectedDate]);

  const refresh = useCallback(() => {
    dispatch(fetchMeterLogOverview({ days: 7, end_date: selectedDate }));
  }, [dispatch, selectedDate]);

  const dates = useMemo(() => {
    if (!overview.start_date) return [];
    return buildDateRange(overview.start_date, overview.days);
  }, [overview.start_date, overview.days]);

  const term = search.trim().toLocaleLowerCase('tr-TR');

  const machines = useMemo(() => {
    return overview.machines.filter((machine) => {
      if (onlyMissing && latestEntryForDate(machine, selectedDate)) return false;

      if (!term) return true;

      return SEARCH_FIELDS.some((field) => {
        const value = machine[field];
        return value && String(value).toLocaleLowerCase('tr-TR').includes(term);
      });
    });
  }, [overview.machines, onlyMissing, selectedDate, term]);

  const enteredCount = useMemo(
    () =>
      overview.machines.filter((machine) =>
        latestEntryForDate(machine, selectedDate)
      ).length,
    [overview.machines, selectedDate]
  );

  const missingCount = overview.machines.length - enteredCount;

  const handleSave = useCallback(
    async (machine, km, engineHours) => {
      if (selectedDate > todayISO()) {
        toast.error('Gelecek bir tarih için kayıt yapılamaz');
        throw new Error('Gelecek tarih');
      }

      try {
        await dispatch(
          createMeterLog({
            machine_id: machine.machine_id,
            log_date: selectedDate,
            km,
            engine_hours: engineHours,
          })
        ).unwrap();

        const label =
          machine.identification_no || machine.plate_no || `#${machine.machine_id}`;
        toast.success(
          `${label} · ${formatDate(selectedDate)}: ${formatNumber(
            km
          )} km / ${formatNumber(engineHours)} saat kaydedildi`
        );

        // "Son Gün/KM" ve "1 Aylık Toplam" farkları sunucuda hesaplanır;
        // yeni okuma sonrası tabloyu tazele ki sütunlar anında güncellensin.
        dispatch(fetchMeterLogOverview({ days: 7, end_date: selectedDate }));
      } catch (err) {
        toast.error(String(err || 'KM / motor saati kaydedilemedi'));
        throw err;
      }
    },
    [dispatch, selectedDate]
  );

  return (
    <div className="space-y-4 p-3">
      <Toaster position="top-right" />

      <div className="flex flex-wrap items-start justify-between gap-3 px-3 py-2">
        <div>
          <div style={{ fontFamily: 'Inter' }} className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <IoSpeedometerOutline className="h-4 w-4" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
              Güncel KM ve Motor Saatleri
            </h1>
          </div>
          <p className="mt-1.5 text-sm text-gray-500">
            {activeTab === 'current'
              ? `${overview.machines.length} makine · ${formatDate(
                  selectedDate
                )}: ${enteredCount} kayıt · ${missingCount} eksik`
              : `${overview.machines.length} makine · son ${
                  dates.length || overview.days || 7
                } gün · ${dates[0]?.label ?? formatDate(selectedDate)} – ${formatDate(
                  selectedDate
                )}`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700">
            <span className="text-xs font-medium text-gray-500">Kayıt tarihi</span>
            <input
              type="date"
              value={selectedDate}
              max={todayISO()}
              onChange={(event) => setSelectedDate(event.target.value || todayISO())}
              className="bg-transparent text-sm text-gray-800 outline-none"
              aria-label="Kayıt tarihi"
            />
          </label>

          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Yenile
          </button>
        </div>
      </div>

      <div className="mx-1 flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50/70 px-3 py-2 text-xs text-blue-800">
        <InformationCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Kayıtlar kalıcıdır: mevcut bir giriş güncellenmez veya silinmez. Aynı gün
          için yeni giriş yapılırsa son kayıt güncel değer sayılır; önceki girişler
          geçmişte korunur ve <b>Arşiv</b> sekmesindeki günlük matriste <b>+N</b>{' '}
          olarak görünür.
        </p>
      </div>

      {(error || mutationError) && (
        <div className="mx-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error || mutationError}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex flex-wrap items-center gap-2">
          {/* Tablolar tek kartta iki sekmede toplanır; ikisi de aynı arama ve
              "eksik" filtresini kullanır. */}
          <SegmentedTabs
            ariaLabel="Sayaç kayıtları"
            value={activeTab}
            onChange={setActiveTab}
            tabs={[
              {
                id: 'current',
                label: 'Mevcut',
                count: overview.machines.length,
                icon: TableCellsIcon,
              },
              {
                id: 'archive',
                label: 'Arşiv',
                count: dates.length || overview.days || 7,
                icon: ArchiveBoxIcon,
              },
            ]}
          />

          <div className="relative">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Makine, plaka, marka, bölge ara..."
              aria-label="Makine ara"
              className="w-72 rounded-lg border border-gray-200 bg-white py-2 pl-8 pr-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-gray-600">
            <input
              type="checkbox"
              checked={onlyMissing}
              onChange={(event) => setOnlyMissing(event.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Sadece seçili günde kaydı olmayanlar ({missingCount})
          </label>

          <span className="text-xs text-gray-400">
            {machines.length} / {overview.machines.length} makine
            {activeTab === 'archive' && ` · ${dates.length} gün`}
          </span>
        </div>
      </div>

      {activeTab === 'current' ? (
        <MeterLogEntryTable
          machines={machines}
          loading={loading}
          selectedDate={selectedDate}
          onSave={handleSave}
        />
      ) : dates.length ? (
        <MeterLogWeekTable
          machines={machines}
          dates={dates}
          selectedDate={selectedDate}
          loading={loading}
        />
      ) : (
        // Tarih penceresi (sunucudan `start_date`) gelmeden kart boş kalmasın.
        <div className={`${TABLE_CARD} px-6 py-16 text-center`}>
          <div className="flex flex-col items-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <ArchiveBoxIcon className="h-5 w-5" />
            </span>
            <p className="mt-3 text-sm font-semibold text-slate-900">
              {loading ? 'Kayıtlar yükleniyor…' : 'Gösterilecek kayıt yok'}
            </p>
            <p className="mt-1 max-w-md text-[12px] text-slate-500">
              {loading
                ? 'Seçili güne ait son günlerin matrisi hazırlanıyor.'
                : 'Arama veya filtre seçimini değiştirmeyi, ya da Yenile ile tekrar denemeyi deneyin.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
