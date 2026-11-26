// src/pages/FuelLogs.jsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast, { Toaster } from 'react-hot-toast';
import {
  ArrowPathIcon,
  BuildingOffice2Icon,
  BuildingStorefrontIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  TruckIcon,
} from '@heroicons/react/24/outline';
import { FaGasPump } from 'react-icons/fa';

import FuelLogEntriesModal from '../components/fuellog/FuelLogEntriesModal';
import FuelLogEntryTable from '../components/fuellog/FuelLogEntryTable';
import RentalFuelLogTable from '../components/fuellog/RentalFuelLogTable';
import {
  createFuelLog,
  createRentalFuelLog,
  fetchFuelLogEntries,
  fetchFuelLogOverview,
  resetFuelLogEntries,
  updateFuelLogEntry,
} from '../stores/fuel_log_slice';
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

// Kiralık ekipmanın elle girilen üç alanı + seçilen güne göre durum etiketi.
const RENTAL_SEARCH_FIELDS = [
  'equipment_name',
  'company_name',
  'site_name',
  'status_label',
];

const SUMMARY_THEMES = {
  slate: {
    card: 'border-slate-200 bg-gradient-to-br from-slate-50 to-white',
    icon: 'bg-slate-100 text-slate-700',
    value: 'text-slate-900',
  },
  sky: {
    card: 'border-sky-200 bg-gradient-to-br from-sky-50 to-white',
    icon: 'bg-sky-100 text-sky-700',
    value: 'text-sky-900',
  },
  violet: {
    card: 'border-violet-200 bg-gradient-to-br from-violet-50 to-white',
    icon: 'bg-violet-100 text-violet-700',
    value: 'text-violet-900',
  },
  emerald: {
    card: 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-white',
    icon: 'bg-emerald-100 text-emerald-700',
    value: 'text-emerald-900',
  },
  amber: {
    card: 'border-amber-200 bg-gradient-to-br from-amber-50 to-white',
    icon: 'bg-amber-100 text-amber-700',
    value: 'text-amber-900',
  },
  teal: {
    card: 'border-teal-200 bg-gradient-to-br from-teal-50 to-white',
    icon: 'bg-teal-100 text-teal-700',
    value: 'text-teal-900',
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

const TABS = [
  { id: 'own', label: 'Kendi Makineler', icon: TruckIcon },
  { id: 'rental', label: 'Kiralık Makineler', icon: BuildingStorefrontIcon },
];

/** Tablo üstündeki sekme: hangi defterin düzenlendiğini belirler. */
function TabButton({ tab, active, count, onClick }) {
  const Icon = tab.icon;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold transition ${
        active
          ? 'bg-blue-600 text-white shadow-sm'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      <Icon className="h-4 w-4" />
      {tab.label}
      <span
        className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
          active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
        }`}
      >
        {count}
      </span>
    </button>
  );
}

export default function FuelLogs() {
  const dispatch = useDispatch();
  const { overview, loading, error, mutationError, editing } = useSelector(
    (state) => state.fuelLog
  );

  const [selectedDate, setSelectedDate] = useState(todayISO);
  const [search, setSearch] = useState('');
  // Tablo üstündeki sekmeler: varsayılan kendi makinelerimiz.
  const [activeTab, setActiveTab] = useState('own');
  // "İşlemler → Düzenle": hangi makinenin / kiralamanın satırları açık.
  // `{ kind: 'machine' | 'rental', ownerId, label }`
  const [editTarget, setEditTarget] = useState(null);

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

  // Kiralık sekme: arama, ekipman / firma / şantiye / durum alanlarında çalışır.
  const rentals = useMemo(() => {
    const list = overview.rental_machines || [];
    if (!term) return list;

    return list.filter((rental) =>
      RENTAL_SEARCH_FIELDS.some((field) => {
        const value = rental[field];
        return value && String(value).toLocaleLowerCase('tr-TR').includes(term);
      })
    );
  }, [overview.rental_machines, term]);

  const { rentalEntryCount, fueledRentals } = useMemo(() => {
    return (overview.rental_machines || []).reduce(
      (totals, rental) => ({
        rentalEntryCount: totals.rentalEntryCount + (rental.day_entry_count || 0),
        fueledRentals:
          totals.fueledRentals + (rental.day_entry_count > 0 ? 1 : 0),
      }),
      { rentalEntryCount: 0, fueledRentals: 0 }
    );
  }, [overview.rental_machines]);

  const handleSave = useCallback(
    async (machine, liters) => {
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
            // "Yakıtı veren" artık sorulmuyor: sunucu oturumdaki kullanıcının
            // adını yazar.
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

  const handleSaveRental = useCallback(
    async (rental, { liters, km, engine_hours }) => {
      if (selectedDate > todayISO()) {
        toast.error('Gelecek bir tarih için kayıt yapılamaz');
        throw new Error('Gelecek tarih');
      }

      try {
        await dispatch(
          createRentalFuelLog({
            rental_id: rental.rental_id,
            fuel_date: selectedDate,
            liters,
            // Mazotla aynı gün girilen sayaç okumaları; boş alanlar gönderilmez
            // ve sunucuda NULL kalır.
            km: km ?? undefined,
            engine_hours: engine_hours ?? undefined,
            // Kiralık satırda da "Yakıtı veren" sorulmaz; sunucu oturumdaki
            // kullanıcının adını yazar.
          })
        ).unwrap();

        const label = rental.equipment_name || `#${rental.rental_id}`;
        const meterNotes = [];
        if (km !== null && km !== undefined) {
          meterNotes.push(`KM ${formatNumber(km)}`);
        }
        if (engine_hours !== null && engine_hours !== undefined) {
          meterNotes.push(`${formatNumber(engine_hours)} saat`);
        }
        const meterText = meterNotes.length
          ? ` · ${meterNotes.join(' · ')}`
          : '';

        toast.success(
          `${label} · ${formatDate(selectedDate)}: ${formatNumber(liters)} L eklendi${meterText}`
        );

        dispatch(fetchFuelLogOverview({ fuel_date: selectedDate }));
      } catch (err) {
        toast.error(String(err || 'Kiralık makine mazot kaydı kaydedilemedi'));
        throw err;
      }
    },
    [dispatch, selectedDate]
  );

  // Düzenleme penceresi açılınca (veya seçilen gün değişince) o makinenin /
  // kiralamanın son satırları sunucudan istenir.
  useEffect(() => {
    if (!editTarget) return;

    dispatch(
      fetchFuelLogEntries({
        kind: editTarget.kind,
        ownerId: editTarget.ownerId,
        end_date: selectedDate,
      })
    );
  }, [dispatch, editTarget, selectedDate]);

  const openMachineEntries = useCallback((machine) => {
    setEditTarget({
      kind: 'machine',
      ownerId: machine.machine_id,
      label:
        machine.identification_no ||
        machine.plate_no ||
        `#${machine.machine_id}`,
    });
  }, []);

  const openRentalEntries = useCallback((rental) => {
    setEditTarget({
      kind: 'rental',
      ownerId: rental.rental_id,
      label: rental.equipment_name || `#${rental.rental_id}`,
    });
  }, []);

  const closeEntries = useCallback(() => {
    setEditTarget(null);
    dispatch(resetFuelLogEntries());
  }, [dispatch]);

  const handleUpdateEntry = useCallback(
    async (entry, changes) => {
      if (!editTarget) return;

      try {
        await dispatch(
          updateFuelLogEntry({
            kind: editTarget.kind,
            entryId: entry.id,
            changes,
          })
        ).unwrap();

        toast.success(
          `${editTarget.label} · ${formatDate(
            changes.fuel_date || entry.fuel_date
          )}: ${formatNumber(changes.liters ?? entry.liters)} L güncellendi`
        );

        // Satır listesi (yeni tarih sıralamayı değiştirir) ve özet kartları
        // sunucudaki gerçek değerlerle tazelenir.
        dispatch(
          fetchFuelLogEntries({
            kind: editTarget.kind,
            ownerId: editTarget.ownerId,
            end_date: selectedDate,
          })
        );
        dispatch(fetchFuelLogOverview({ fuel_date: selectedDate }));
      } catch (err) {
        toast.error(String(err || 'Mazot kaydı güncellenemedi'));
        throw err;
      }
    },
    [dispatch, editTarget, selectedDate]
  );

  const monthHint = overview.month_start
    ? `${formatDate(overview.month_start)} – ${formatDate(selectedDate)}`
    : 'Ay başından itibaren';
  const previousMonthHint =
    overview.previous_month_start && overview.previous_month_end
      ? `${formatDate(overview.previous_month_start)} – ${formatDate(
          overview.previous_month_end
        )}`
      : 'Geçen ayın tamamı';

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
            {activeTab === 'own'
              ? `${overview.machines.length} makine · ${fueledMachines} makinede ${entryCount} kayıt`
              : `${(overview.rental_machines || []).length} kiralık makine · ${fueledRentals} makinede ${rentalEntryCount} kayıt`}{' '}
            · {formatDate(selectedDate)}
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

      <div className="space-y-3">
        <div className="grid gap-3 px-1 sm:grid-cols-3 xl:grid-cols-6">
          <SummaryCard
            label="Geçen Ay Toplam"
            value={overview.previous_month_total}
            hint={previousMonthHint}
            icon={CalendarDaysIcon}
            theme="slate"
          />
          <SummaryCard
            label="SRU · Güncel Ay"
            value={overview.sru_monthly_total}
            hint={`SRU şantiyesi · ${monthHint}`}
            icon={BuildingOffice2Icon}
            theme="sky"
          />
          <SummaryCard
            label="DCU · Güncel Ay"
            value={overview.dcu_monthly_total}
            hint={`DCU şantiyesi · ${monthHint}`}
            icon={MapPinIcon}
            theme="violet"
          />
          <SummaryCard
            label="Güncel Ay Verilen"
            value={overview.monthly_total}
            hint={monthHint}
            icon={ChartBarIcon}
            theme="emerald"
          />
          <SummaryCard
            label="Kiralık · Toplam Verilen"
            value={overview.rental_total ?? 0}
            hint={`${formatDate(selectedDate)} dahil tüm kiralık ekipman`}
            icon={TruckIcon}
            theme="amber"
          />
          <SummaryCard
            label="Kiralık · Güncel Ay"
            value={overview.rental_monthly_total ?? 0}
            hint={`Kiralık ekipman · ${monthHint}`}
            icon={CalendarDaysIcon}
            theme="teal"
          />
        </div>

        <div className="grid gap-3 px-1 sm:grid-cols-2">
          {/* <SummaryCard
            label="Kiralık · Toplam Verilen"
            value={overview.rental_total ?? 0}
            hint={`${formatDate(selectedDate)} dahil tüm kiralık ekipman`}
            icon={TruckIcon}
            theme="amber"
          />
          <SummaryCard
            label="Kiralık · Güncel Ay"
            value={overview.rental_monthly_total ?? 0}
            hint={`Kiralık ekipman · ${monthHint}`}
            icon={CalendarDaysIcon}
            theme="teal"
          /> */}
        </div>
      </div>

      {/* <div className="mx-1 flex items-start gap-2 rounded-lg border border-amber-100 bg-amber-50/70 px-3 py-2 text-xs text-amber-900">
        <InformationCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Aynı makineye gün içinde birden fazla yakıt girişi yapılabilir. Yanlış
          güne (ör. 24'ü yerine 25'ine) yazılan bir kaydı düzeltmek için
          satırdaki <strong>Düzenle</strong> düğmesini kullanın: kayıt silinmez,
          tarihi ve litresi yerinde güncellenir; günlük, haftalık ve aylık
          toplamlar yeni tarihe göre yeniden hesaplanır. Kendi makinelerimizde
          güncel KM / saat bilgisi sayaç kayıtlarından, ortalama yakıt tüketimi
          ise sayaç farkına göre sunucuda otomatik hesaplanır. Tablonun
          üstündeki <strong>Kiralık Makineler</strong> sekmesi dışarıdan
          kiralanan ekipmanın mazotunu ayrı defterde tutar; kiralık ekipmanın
          filo numarası yoktur, mazotla birlikte o günkü KM / motor saati de
          girilebilir ve son girilen sayaç satırda gösterilir.
        </p>
      </div> */}

      {(error || mutationError) && (
        <div className="mx-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error || mutationError}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        {/* Tablo üstündeki sekmeler: varsayılan "Kendi Makineler". */}
        <div
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1 shadow-sm"
          role="tablist"
          aria-label="Mazot defteri"
        >
          {TABS.map((tab) => (
            <TabButton
              key={tab.id}
              tab={tab}
              active={activeTab === tab.id}
              count={
                tab.id === 'own'
                  ? overview.machines.length
                  : (overview.rental_machines || []).length
              }
              onClick={() => setActiveTab(tab.id)}
            />
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={
                activeTab === 'own'
                  ? 'Makine, plaka, marka, bölge ara...'
                  : 'Ekipman, firma, şantiye ara...'
              }
              aria-label={
                activeTab === 'own' ? 'Makine ara' : 'Kiralık makine ara'
              }
              className="w-72 rounded-lg border border-gray-200 bg-white py-2 pl-8 pr-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <span className="text-xs text-gray-400">
            {activeTab === 'own'
              ? `${machines.length} / ${overview.machines.length} makine`
              : `${rentals.length} / ${
                  (overview.rental_machines || []).length
                } kiralık makine`}
          </span>
        </div>
      </div>

      {activeTab === 'own' ? (
        <FuelLogEntryTable
          machines={machines}
          loading={loading}
          selectedDate={selectedDate}
          onSave={handleSave}
          onEdit={openMachineEntries}
        />
      ) : (
        <RentalFuelLogTable
          rentals={rentals}
          loading={loading}
          selectedDate={selectedDate}
          onSave={handleSaveRental}
          onEdit={openRentalEntries}
          dailyTotal={overview.rental_daily_total ?? 0}
        />
      )}

      {/* İşlemler → Düzenle: yanlış güne girilen satırı yerinde düzeltir. */}
      <FuelLogEntriesModal
        open={Boolean(editTarget)}
        onClose={closeEntries}
        kind={editTarget?.kind ?? 'machine'}
        label={editTarget?.label}
        selectedDate={selectedDate}
        entries={editing.entries}
        loading={editing.loading}
        error={editing.error}
        savingEntryId={editing.savingEntryId}
        onUpdate={handleUpdateEntry}
      />
    </div>
  );
}
