// src/components/fuellog/RentalFuelLogTable.jsx
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  FireIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline';

import ResizableTable, {
  ResizableTh,
  TableFillerTd,
  TableFillerTh,
} from '../ui/ResizableTable';
import useColumnResize from '../ui/useColumnResize';
import {
  TABLE_BODY,
  TABLE_CARD,
  TABLE_CELL,
  TABLE_HEAD,
  TABLE_HEAD_CELL,
  TABLE_MUTED,
  TABLE_PRIMARY,
  TABLE_ROW,
  TABLE_TOOLBAR,
} from '../ui/tableStyles';
import { formatDate, formatNumber } from '../../utils/maintenance';
import { parseDecimalInput } from '../../utils/numberInput';

// Excel tarzı sütun genişlikleri; tercih `fuellog:rental` anahtarıyla
// localStorage'da saklanır (makine tablosundan bağımsız).
const RENTAL_FUEL_COLUMN_WIDTHS = {
  equipment: 240,
  site: 160,
  period: 150,
  status: 140,
  day_total: 160,
  meter: 170,
  liters: 110,
  km: 100,
  engine_hours: 100,
  total: 150,
  action: 140,
};

const COLUMN_IDS = Object.keys(RENTAL_FUEL_COLUMN_WIDTHS);

//: Başlık hücreleri; hizalama varyantları bu sabitten türetilir.
const HEAD_CLASS = `text-left ${TABLE_HEAD_CELL}`;
const HEAD_RIGHT = `text-right ${TABLE_HEAD_CELL}`;
const HEAD_CENTER = `text-center ${TABLE_HEAD_CELL}`;

const INPUT_CLASS =
  'w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50';

//: Kiralama durumu rozeti; kod sunucudan seçilen güne göre gelir.
const STATUS_BADGE = {
  aktif: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  planlandi: 'bg-blue-50 text-blue-700 ring-blue-200',
  suresi_doldu: 'bg-red-50 text-red-700 ring-red-200',
};

function rentalLabel(rental) {
  return rental.equipment_name || `#${rental.rental_id}`;
}

function StatusBadge({ rental }) {
  const className =
    STATUS_BADGE[rental.status] || 'bg-slate-50 text-slate-600 ring-slate-200';

  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${className}`}
    >
      {rental.status_label || rental.status || '—'}
    </span>
  );
}

/**
 * Seçilen güne kadarki **en yeni** sayaç okuması. KM ve motor saati bağımsız
 * tutulur: kiralık ekipmanda genelde yalnızca biri vardır, bu yüzden sıfır
 * olan sayaç yalnızca diğer sayaç da boşsa gösterilir.
 */
function MeterCell({ rental }) {
  const km =
    rental.last_km === null || rental.last_km === undefined
      ? null
      : Number(rental.last_km);
  const hours =
    rental.last_engine_hours === null || rental.last_engine_hours === undefined
      ? null
      : Number(rental.last_engine_hours);

  if (km === null && hours === null) {
    return <p className={TABLE_MUTED}>Sayaç kaydı yok</p>;
  }

  const showKm = km !== null && (km > 0 || hours === null);
  const showHours = hours !== null && (hours > 0 || km === null);

  return (
    <>
      <div className="flex flex-col gap-0.5 text-[12px] text-slate-600 tabular-nums">
        {showKm && (
          <span>
            KM:{' '}
            <strong className="font-semibold text-slate-900">
              {formatNumber(km)}
            </strong>
          </span>
        )}
        {showHours && (
          <span>
            Saat:{' '}
            <strong className="font-semibold text-slate-900">
              {formatNumber(hours)}
            </strong>
          </span>
        )}
      </div>
      {rental.last_meter_date && (
        <p className="mt-0.5 text-[10px] text-slate-400">
          {formatDate(rental.last_meter_date)}
        </p>
      )}
    </>
  );
}

function Skeleton() {
  return (
    <div>
      <div className="flex items-center gap-4 border-b border-slate-100 bg-slate-50/90 px-4 py-3">
        <div className="h-2.5 w-32 animate-pulse rounded bg-slate-200/80" />
        <div className="h-2.5 w-24 animate-pulse rounded bg-slate-200/80" />
        <div className="h-2.5 w-20 animate-pulse rounded bg-slate-200/80" />
        <div className="h-2.5 flex-1 animate-pulse rounded bg-slate-200/80" />
        <div className="h-2.5 w-16 animate-pulse rounded bg-slate-200/80" />
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex items-center gap-4 px-4 py-3">
            <div className="h-3 w-40 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-28 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
            <div className="h-3 flex-1 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}


function EntryRow({ rental, selectedDate, onSave, onEdit }) {
  const [liters, setLiters] = useState('');
  const [km, setKm] = useState('');
  const [engineHours, setEngineHours] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const litersRef = useRef(null);
  const kmRef = useRef(null);
  const engineRef = useRef(null);

  const label = rentalLabel(rental);
  const litersValue = parseDecimalInput(liters);
  const canSubmit = litersValue !== null && litersValue > 0;

  const handleSubmit = async () => {
    if (saving) return;

    if (litersValue === null || litersValue <= 0) {
      toast.error(`${label}: 0'dan büyük bir litre değeri girin`);
      litersRef.current?.focus();
      return;
    }

    // Sayaç alanları isteğe bağlıdır; boş bırakılabilir ama doldurulduysa
    // geçerli, negatif olmayan bir sayı olmalıdır.
    const kmValue = parseDecimalInput(km);
    if (km.trim() && kmValue === null) {
      toast.error(`${label}: geçerli bir KM değeri girin`);
      kmRef.current?.focus();
      return;
    }

    const engineValue = parseDecimalInput(engineHours);
    if (engineHours.trim() && engineValue === null) {
      toast.error(`${label}: geçerli bir motor saati girin`);
      engineRef.current?.focus();
      return;
    }

    setSaving(true);
    setSaved(false);

    try {
      // Litre ve sayaç aynı satıra yazılır: okuma, mazotun verildiği günle
      // eşit zamanlıdır.
      await onSave(rental, {
        liters: litersValue,
        km: kmValue,
        engine_hours: engineValue,
      });
      setLiters('');
      setKm('');
      setEngineHours('');
      setSaved(true);
    } catch {
      // Hata sayfadaki toast ile gösterilir; girilen değerler korunur.
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();

    // Alanlar soldan sağa dolar: litre → KM → saat → kaydet.
    if (event.currentTarget === litersRef.current) {
      kmRef.current?.focus();
      return;
    }
    if (event.currentTarget === kmRef.current) {
      engineRef.current?.focus();
      return;
    }
    handleSubmit();
  };

  const handleChange = (setter) => (event) => {
    setter(event.target.value);
    setSaved(false);
  };

  // Son okuma, giriş alanında soluk ipucu olarak görünür; böylece sayaç
  // ilerlemesi klavyeden çıkmadan kontrol edilebilir.
  const kmHint =
    rental.last_km === null || rental.last_km === undefined
      ? 'KM'
      : formatNumber(rental.last_km);
  const engineHint =
    rental.last_engine_hours === null || rental.last_engine_hours === undefined
      ? 'Saat'
      : formatNumber(rental.last_engine_hours);

  return (
    <tr className={`${TABLE_ROW} align-top`}>
      <td className={TABLE_CELL}>
        <p className={`truncate ${TABLE_PRIMARY}`} title={label}>
          {label}
        </p>
        <p className={`truncate ${TABLE_MUTED}`}>
          {rental.company_name || '—'}
        </p>
        {rental.day_entry_count > 0 ? (
          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
            <CheckCircleIcon className="h-3 w-3" />
            {formatDate(selectedDate)} kaydı var
          </span>
        ) : (
          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 ring-1 ring-inset ring-amber-200">
            <PencilSquareIcon className="h-3 w-3" />
            Kayıt bekliyor
          </span>
        )}
      </td>

      <td className={TABLE_CELL}>
        <p
          className="truncate text-[12px] text-slate-600"
          title={rental.site_name || ''}
        >
          {rental.site_name || '—'}
        </p>
      </td>

      <td className={TABLE_CELL}>
        <p className="text-[12px] text-slate-600 tabular-nums">
          {formatDate(rental.start_date)} – {formatDate(rental.end_date)}
        </p>
      </td>

      <td className={TABLE_CELL}>
        <StatusBadge rental={rental} />
      </td>

      <td className={`${TABLE_CELL} text-right`}>
        {rental.day_entry_count > 0 ? (
          <>
            <p className="text-[13px] font-semibold text-slate-900 tabular-nums">
              {formatNumber(rental.day_liters)} L
            </p>
            <p className={TABLE_MUTED}>{rental.day_entry_count} kayıt</p>
            {rental.last_given_by && (
              <p
                className="truncate text-[10px] text-slate-400"
                title={[rental.last_given_by, rental.last_note]
                  .filter(Boolean)
                  .join(' · ')}
              >
                Son: {rental.last_given_by}
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-slate-300">—</p>
        )}
      </td>

      <td className={TABLE_CELL}>
        <MeterCell rental={rental} />
      </td>

      <td className="whitespace-nowrap px-2 py-3">
        <input
          ref={litersRef}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          aria-label={`${label} litre`}
          placeholder="Litre"
          value={liters}
          disabled={saving}
          onChange={handleChange(setLiters)}
          onKeyDown={handleKeyDown}
          onFocus={(event) => event.target.select()}
          className={`${INPUT_CLASS} text-right`}
        />
      </td>

      <td className="whitespace-nowrap px-2 py-3">
        <input
          ref={kmRef}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          aria-label={`${label} KM`}
          placeholder={kmHint}
          value={km}
          disabled={saving}
          onChange={handleChange(setKm)}
          onKeyDown={handleKeyDown}
          onFocus={(event) => event.target.select()}
          className={`${INPUT_CLASS} text-right`}
          title="Mazotla birlikte güncel KM (isteğe bağlı)"
        />
      </td>

      <td className="whitespace-nowrap px-2 py-3">
        <input
          ref={engineRef}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          aria-label={`${label} motor saati`}
          placeholder={engineHint}
          value={engineHours}
          disabled={saving}
          onChange={handleChange(setEngineHours)}
          onKeyDown={handleKeyDown}
          onFocus={(event) => event.target.select()}
          className={`${INPUT_CLASS} text-right`}
          title="Mazotla birlikte güncel motor saati (isteğe bağlı)"
        />
      </td>

      <td className={`${TABLE_CELL} text-right`}>
        <p className="text-[13px] font-semibold text-slate-900 tabular-nums">
          {formatNumber(rental.total_liters)} L
        </p>
        <p className={`${TABLE_MUTED} tabular-nums`}>
          Bu ay: {formatNumber(rental.monthly_liters)} L
        </p>
        <p className="text-[10px] text-slate-400 tabular-nums">
          {rental.total_entry_count} kayıt
        </p>
      </td>

      <td className="whitespace-nowrap px-2 py-3">
        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || !canSubmit}
            className={`flex w-full items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${
              saved
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            } disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500`}
            title="Litre zorunlu; KM / motor saati isteğe bağlıdır. Enter ile kaydedin"
          >
            {saving ? (
              <>
                <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
                Kaydediliyor
              </>
            ) : saved ? (
              <>
                <CheckCircleIcon className="h-3.5 w-3.5" />
                Eklendi
              </>
            ) : (
              'Kaydet'
            )}
          </button>

          {/* Yanlış güne girilen kiralık mazot satırını düzeltir. */}
          <button
            type="button"
            onClick={() => onEdit(rental)}
            className="flex w-full items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:bg-slate-50"
            title="Girilmiş kayıtları düzenle (tarih / litre)"
          >
            <PencilSquareIcon className="h-3.5 w-3.5" />
            Düzenle
          </button>
        </div>
      </td>

      <TableFillerTd />
    </tr>
  );
}

export default function RentalFuelLogTable({
  rentals,
  loading,
  selectedDate,
  onSave,
  onEdit,
  dailyTotal = 0,
}) {
  // Makine tablosundan ayrı bir anahtar: iki tablonun sütunları bağımsız.
  const resize = useColumnResize('fuellog:rental', RENTAL_FUEL_COLUMN_WIDTHS);

  if (loading && rentals.length === 0) {
    return (
      <div className={TABLE_CARD}>
        <Skeleton />
      </div>
    );
  }

  return (
    <div className={TABLE_CARD}>
      {loading && (
        <div className="h-0.5 w-full overflow-hidden bg-blue-100">
          <div className="h-full w-1/3 animate-pulse bg-blue-500" />
        </div>
      )}

      <div className={TABLE_TOOLBAR}>
        <div className="flex items-center gap-2">
          <FireIcon className="h-4 w-4 text-slate-400" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Kiralık Yakıt Girişi
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 tabular-nums">
            {rentals.length}
          </span>
        </div>
        <span className="text-[11px] text-slate-400">
          Litre zorunlu · KM / saat isteğe bağlı · Enter kaydeder · Düzenle
          geçmişi düzeltir
        </span>
      </div>

      <div className="max-h-[60vh] overflow-auto">
        <ResizableTable
          resize={resize}
          columnIds={COLUMN_IDS}
          filler
          style={{ fontFamily: 'Inter' }}
        >
          <thead className={`sticky top-0 z-20 backdrop-blur ${TABLE_HEAD}`}>
            <tr>
              <ResizableTh
                resize={resize}
                columnId="equipment"
                label="Ekipman / Firma"
                className={HEAD_CLASS}
              >
                Ekipman / Firma
              </ResizableTh>
              <ResizableTh
                resize={resize}
                columnId="site"
                label="Şantiye"
                className={HEAD_CLASS}
              >
                Şantiye
              </ResizableTh>
              <ResizableTh
                resize={resize}
                columnId="period"
                label="Tarih Aralığı"
                className={HEAD_CLASS}
              >
                Tarih Aralığı
              </ResizableTh>
              <ResizableTh
                resize={resize}
                columnId="status"
                label="Durum"
                className={HEAD_CLASS}
              >
                Durum
              </ResizableTh>
              <ResizableTh
                resize={resize}
                columnId="day_total"
                label="Günlük Verilen"
                className={HEAD_RIGHT}
              >
                Günlük Verilen
              </ResizableTh>
              <ResizableTh
                resize={resize}
                columnId="meter"
                label="Güncel KM / Saat"
                className={HEAD_CLASS}
              >
                Güncel KM / Saat
              </ResizableTh>
              <ResizableTh
                resize={resize}
                columnId="liters"
                label="Litre"
                className={HEAD_RIGHT}
              >
                Litre
              </ResizableTh>
              <ResizableTh
                resize={resize}
                columnId="km"
                label="KM"
                className={HEAD_RIGHT}
              >
                KM
              </ResizableTh>
              <ResizableTh
                resize={resize}
                columnId="engine_hours"
                label="Saat"
                className={HEAD_RIGHT}
              >
                Saat
              </ResizableTh>
              <ResizableTh
                resize={resize}
                columnId="total"
                label="Toplam Verilen"
                className={HEAD_RIGHT}
              >
                Toplam Verilen
              </ResizableTh>
              <ResizableTh
                resize={resize}
                columnId="action"
                label="İşlemler"
                className={HEAD_CENTER}
              >
                İşlemler
              </ResizableTh>
              <TableFillerTh />
            </tr>
          </thead>

          <tbody className={`divide-y divide-slate-100 ${TABLE_BODY}`}>
            {rentals.length === 0 && (
              <tr>
                <td
                  colSpan={COLUMN_IDS.length + 1}
                  className="px-6 py-16 text-center"
                >
                  <div className="flex flex-col items-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <FireIcon className="h-5 w-5" />
                    </span>
                    <p className="mt-3 text-sm font-semibold text-slate-900">
                      Gösterilecek kiralık makine yok
                    </p>
                    <p className="mt-1 max-w-md text-[12px] text-slate-500">
                      Kiralık ekipman <strong>Kiralık Makineler</strong> sayfasından
                      eklenir; arama veya tarih seçimini de değiştirebilirsiniz.
                    </p>
                    <Link
                      to="/rental_machines"
                      className="mt-3 rounded-md bg-blue-50 px-3 py-1.5 text-[12px] font-medium text-blue-600 transition hover:bg-blue-100"
                    >
                      Kiralık Makineler
                    </Link>
                  </div>
                </td>
              </tr>
            )}

            {rentals.map((rental) => (
              <EntryRow
                // Tarih değişince satır yeniden kurulur; yarım kalan girişler
                // başka güne yazılmaz.
                key={`${rental.rental_id}:${selectedDate}`}
                rental={rental}
                selectedDate={selectedDate}
                onSave={onSave}
                onEdit={onEdit}
              />
            ))}
          </tbody>
        </ResizableTable>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/60 px-4 py-2 text-[11px] text-slate-500">
        <span>
          Litre zorunlu, KM / motor saati isteğe bağlıdır; girilen son sayaç
          satırda görünür. Kiralık ekipmanda ortalama yakıt hesaplanmaz, toplam
          litre tutulur.
        </span>
        <span className="font-semibold text-slate-700 tabular-nums">
          {formatDate(selectedDate)} kiralık toplam: {formatNumber(dailyTotal)} L
        </span>
      </div>
    </div>
  );
}

