// src/pages/FuelLogs.jsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast, { Toaster } from 'react-hot-toast';
import {
  ArrowPathIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  FireIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { FaGasPump } from 'react-icons/fa';

import FuelLogEntryTable from '../components/fuellog/FuelLogEntryTable';
import { createFuelLog, fetchFuelLogOverview } from '../stores/fuel_log_slice';
import { formatDate, formatNumber, todayISO } from '../utils/maintenance';

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

const SUMMARY_THEMES = {
  amber: {
    card: 'border-amber-200 bg-gradient-to-br from-amber-50 to-white',
    icon: 'bg-amber-100 text-amber-700',
    value: 'text-amber-900',
  },
  sky: {
    card: 'border-sky-200 bg-gradient-to-br from-sky-50 to-white',
    icon: 'bg-sky-100 text-sky-700',
    value: 'text-sky-900',
  },
  emerald: {
    card: 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-white',
    icon: 'bg-emerald-100 text-emerald-700',
    value: 'text-emerald-900',
  },
};

function SummaryCard({ label, value, hint, icon: Icon, theme }) {
  const styles = SUMMARY_THEMES[theme];

  return (
    <div className={`rounded-xl border p-4 shadow-sm ${styles.card}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            {label}
          </p>
          <p className="mt-1 flex items-baseline gap-1">
            <span className={`text-2xl font-bold tracking-tight ${styles.value}`}>
              {formatNumber(value)}
            </span>
            <span className="text-sm font-medium text-gray-500">L</span>
          </p>
          <p className="mt-1 truncate text-[11px] text-gray-500" title={hint}>
            {hint}
          </p>
        </div>
        <span className={`rounded-lg p-2 ${styles.icon}`} aria-hidden="true">
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}

export default function FuelLogs() {
  const dispatch = useDispatch();
  const { overview, loading, error, mutationError } = useSelector(
    (state) => state.fuelLog
  );

  const [selectedDate, setSelectedDate] = useState(todayISO);
  const [search, setSearch] = useState('');

  useEffect(() => {
    dispatch(fetchFuelLogOverview({ fuel_date: selectedDate }));
  }, [dispatch, selectedDate]);

  const refresh = useCallback(() => {
    dispatch(fetchFuelLogOverview({ fuel_date: selectedDate }));
  }, [dispatch, selectedDate]);

  const term = search.trim().toLocaleLowerCase('tr-TR');

  const machines = useMemo(() => {
    if (!term) return overview.machines;

    return overview.machines.filter((machine) =>
      SEARCH_FIELDS.some((field) => {
        const value = machine[field];
        return value && String(value).toLocaleLowerCase('tr-TR').includes(term);
      })
    );
  }, [overview.machines, term]);

  const { entryCount, fueledMachines } = useMemo(() => {
    return overview.machines.reduce(
      (totals, machine) => ({
        entryCount: totals.entryCount + (machine.day_entry_count || 0),
        fueledMachines:
          totals.fueledMachines + (machine.day_entry_count > 0 ? 1 : 0),
      }),
      { entryCount: 0, fueledMachines: 0 }
    );
  }, [overview.machines]);

  const handleSave = useCallback(
    async (machine, liters, givenBy, note) => {
      if (selectedDate > todayISO()) {
        toast.error('Gelecek bir tarih için kayıt yapılamaz');
        throw new Error('Gelecek tarih');
      }

      try {
        await dispatch(
          createFuelLog({
            machine_id: machine.machine_id,
            fuel_date: selectedDate,
            liters,
            given_by: givenBy,
            note: note || null,
          })
        ).unwrap();

        const label =
          machine.identification_no || machine.plate_no || `#${machine.machine_id}`;
        toast.success(
          `${label} · ${formatDate(selectedDate)}: ${formatNumber(liters)} L eklendi`
        );

        // Özet kutularını sunucudaki gerçek toplamlarla eşitle.  Kullanıcı bu
        // sırada başka bir güne geçerse yeni istek listRequestId ile eskisini
        // geçersiz kılar.
        dispatch(fetchFuelLogOverview({ fuel_date: selectedDate }));
      } catch (err) {
        toast.error(String(err || 'Mazot kaydı kaydedilemedi'));
        throw err;
      }
    },
    [dispatch, selectedDate]
  );

  const weekHint = overview.week_start
    ? `${formatDate(overview.week_start)} – ${formatDate(selectedDate)}`
    : 'Son 7 gün';
  const monthHint = overview.month_start
    ? `${formatDate(overview.month_start)} – ${formatDate(selectedDate)}`
    : 'Ay başından itibaren';

  return (
    <div className="space-y-4 p-3">
      <Toaster position="top-right" />

      <div className="flex flex-wrap items-start justify-between gap-3 px-3 py-2">
        <div>
          <div style={{ fontFamily: 'Inter' }} className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <FaGasPump className="h-4 w-4" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
              Mazot Dağılımı
            </h1>
          </div>
          <p className="mt-1.5 text-sm text-gray-500">
            {overview.machines.length} makine · {fueledMachines} makinede{' '}
            {entryCount} kayıt · {formatDate(selectedDate)}
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

      <div className="grid gap-3 px-1 sm:grid-cols-3">
        <SummaryCard
          label="Günlük Verilen"
          value={overview.daily_total}
          hint={formatDate(selectedDate)}
          icon={FireIcon}
          theme="amber"
        />
        <SummaryCard
          label="Haftalık Verilen"
          value={overview.weekly_total}
          hint={weekHint}
          icon={CalendarDaysIcon}
          theme="sky"
        />
        <SummaryCard
          label="Aylık Verilen"
          value={overview.monthly_total}
          hint={monthHint}
          icon={ChartBarIcon}
          theme="emerald"
        />
      </div>

      <div className="mx-1 flex items-start gap-2 rounded-lg border border-amber-100 bg-amber-50/70 px-3 py-2 text-xs text-amber-900">
        <InformationCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Kayıtlar kalıcıdır: mevcut bir giriş güncellenmez veya silinmez. Aynı
          makineye gün içinde birden fazla yakıt girişi yapılabilir; düzeltme için
          yeni kayıt ekleyin. Günlük toplam ve üstteki özet kutuları otomatik
          hesaplanır.
        </p>
      </div>

      {(error || mutationError) && (
        <div className="mx-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error || mutationError}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="relative">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Makine, plaka, marka, bölge ara..."
            className="w-72 rounded-lg border border-gray-200 bg-white py-2 pl-8 pr-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <span className="text-xs text-gray-400">
          {machines.length} / {overview.machines.length} makine
        </span>
      </div>

      <FuelLogEntryTable
        machines={machines}
        loading={loading}
        selectedDate={selectedDate}
        onSave={handleSave}
      />
    </div>
  );
}
