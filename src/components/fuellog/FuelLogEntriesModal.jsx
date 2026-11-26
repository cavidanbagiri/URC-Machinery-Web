// src/components/fuellog/FuelLogEntriesModal.jsx
//
// **İşlemler → Düzenle** penceresi: bir makinenin (veya kiralık ekipmanın) son
// mazot satırlarını listeler ve satırın tarihini / litresini yerinde düzeltmeye
// izin verir. Klasik hata, 24'ünün mazotunun 25'inde girilmesidir; bu yüzden
// satır silinmez, doğru güne taşınır. Toplamlar kayıttan hesaplandığı için
// günlük / haftalık / aylık özetler kaydettikten sonra sunucudan yenilenir.
import { useState } from 'react';
import {
  ArrowPathIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

import MaintenanceModal, {
  PrimaryButton,
  SecondaryButton,
  inputClass,
} from '../maintenance/MaintenanceModal';
import {
  formatDate,
  formatDateTime,
  formatNumber,
  todayISO,
} from '../../utils/maintenance';
import { parseDecimalInput } from '../../utils/numberInput';

/** Satırdaki iki okuma birbirinden bağımsızdır; yalnızca dolu olan gösterilir. */
function meterText(entry) {
  const parts = [];
  if (entry.km !== null && entry.km !== undefined) {
    parts.push(`KM ${formatNumber(entry.km)}`);
  }
  if (entry.engine_hours !== null && entry.engine_hours !== undefined) {
    parts.push(`${formatNumber(entry.engine_hours)} saat`);
  }
  return parts.join(' · ');
}

/**
 * Tek bir mazot satırı. Alanlar sunucudan gelen değerlerle başlar; kayıt
 * düzeltildikten sonra liste tazelendiğinde üst bileşen satırı yeni değerlerle
 * yeniden kurar (bkz. `key`), böylece form sunucu değerlerine döner.
 */
function EntryRow({ entry, isRental, saving, disabled, onUpdate }) {
  const [fuelDate, setFuelDate] = useState(entry.fuel_date || '');
  const [liters, setLiters] = useState(
    entry.liters === null || entry.liters === undefined
      ? ''
      : String(entry.liters)
  );
  const [error, setError] = useState(null);

  const litersValue = parseDecimalInput(liters);
  const dateChanged = Boolean(fuelDate) && fuelDate !== entry.fuel_date;
  const litersChanged =
    litersValue !== null && Math.abs(litersValue - Number(entry.liters)) > 1e-9;
  const dirty = dateChanged || litersChanged;

  const handleSave = async () => {
    setError(null);

    if (!fuelDate) {
      setError('Tarih gerekli');
      return;
    }
    if (fuelDate > todayISO()) {
      setError('Gelecek bir tarih seçilemez');
      return;
    }
    if (litersValue === null || litersValue <= 0) {
      setError("0'dan büyük bir litre değeri girin");
      return;
    }
    if (!dirty) {
      setError('Değişiklik yok');
      return;
    }

    const changes = {};
    if (dateChanged) changes.fuel_date = fuelDate;
    if (litersChanged) changes.liters = litersValue;

    try {
      await onUpdate(entry, changes);
    } catch {
      // Hata mesajı sayfadaki toast ile gösterilir; girilen değerler korunur.
    }
  };

  const meter = isRental ? meterText(entry) : '';

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-40">
          <label className="mb-1 block text-[11px] font-medium text-gray-600">
            Tarih
          </label>
          <input
            type="date"
            value={fuelDate}
            max={todayISO()}
            disabled={saving || disabled}
            onChange={(event) => {
              setFuelDate(event.target.value);
              setError(null);
            }}
            aria-label="Kayıt tarihi"
            className={inputClass}
          />
        </div>

        <div className="w-32">
          <label className="mb-1 block text-[11px] font-medium text-gray-600">
            Litre
          </label>
          <input
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={liters}
            disabled={saving || disabled}
            onChange={(event) => {
              setLiters(event.target.value);
              setError(null);
            }}
            onFocus={(event) => event.target.select()}
            aria-label="Kayıt litresi"
            className={`${inputClass} text-right`}
          />
        </div>

        <div className="min-w-0 flex-1 text-[11px] leading-5 text-gray-500">
          <p className="truncate" title={entry.given_by || ''}>
            Giren: {entry.given_by || '—'}
          </p>
          <p className="truncate tabular-nums">
            {formatDateTime(entry.created_at)}
          </p>
          {meter && <p className="truncate tabular-nums">{meter}</p>}
        </div>

        <div className="shrink-0">
          <PrimaryButton
            onClick={handleSave}
            disabled={saving || disabled || !dirty}
          >
            {saving ? (
              <span className="flex items-center gap-1.5">
                <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
                Kaydediliyor
              </span>
            ) : (
              'Kaydet'
            )}
          </PrimaryButton>
        </div>
      </div>

      {error && <p className="mt-2 text-[11px] text-red-600">{error}</p>}
    </div>
  );
}

export default function FuelLogEntriesModal({
  open,
  onClose,
  kind = 'machine',
  label,
  selectedDate,
  entries = [],
  loading = false,
  error = null,
  savingEntryId = null,
  onUpdate,
}) {
  const isRental = kind === 'rental';
  const busy = savingEntryId !== null && savingEntryId !== undefined;

  return (
    <MaintenanceModal
      open={open}
      onClose={onClose}
      title="Mazot Kayıtları"
      subtitle={
        label
          ? `${label} · ${formatDate(selectedDate)} ve öncesi (son 30 gün)`
          : 'Son 30 günün kayıtları'
      }
      maxWidth="max-w-3xl"
      footer={<SecondaryButton onClick={onClose}>Kapat</SecondaryButton>}
    >
      <div className="space-y-3">
        <div className="flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50/70 px-3 py-2 text-[11px] leading-5 text-blue-900">
          <InformationCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Yanlış güne yazılan kaydı buradan düzeltin: tarihini ve litresini
            değiştirip <strong>Kaydet</strong>'e basın. Kayıt silinmez, aynı
            satırda güncellenir; günlük, haftalık ve aylık toplamlar yeni
            tarihe göre yeniden hesaplanır. Seçilen günden 30 günden daha geriye
            taşınan satır bu listeden çıkar.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">
            {error}
          </div>
        )}

        {loading && (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50/70 p-3"
              >
                <div className="h-8 w-40 animate-pulse rounded bg-gray-200/70" />
                <div className="h-8 w-28 animate-pulse rounded bg-gray-200/70" />
                <div className="h-3 flex-1 animate-pulse rounded bg-gray-200/70" />
              </div>
            ))}
          </div>
        )}

        {!loading && entries.length === 0 && (
          <div className="rounded-lg border border-dashed border-gray-200 px-4 py-10 text-center">
            <p className="text-sm font-semibold text-gray-900">
              Kayıt bulunamadı
            </p>
            <p className="mt-1 text-[12px] text-gray-500">
              Bu {isRental ? 'kiralık ekipman' : 'makine'} için son 30 günde
              girilmiş mazot kaydı yok. Yeni kayıt için tablodaki{' '}
              <strong>Litre</strong> alanını kullanın.
            </p>
          </div>
        )}

        {!loading && entries.length > 0 && (
          <div className="space-y-2">
            {entries.map((entry) => (
              <EntryRow
                // Sunucu değerleri değişince satır yeniden kurulur; form
                // kaydedilen tarih / litre ile başlar.
                key={`${entry.id}:${entry.fuel_date}:${entry.liters}`}
                entry={entry}
                isRental={isRental}
                saving={savingEntryId === entry.id}
                // Aynı anda tek satır kaydedilir; diğerleri kilitli kalır.
                disabled={busy && savingEntryId !== entry.id}
                onUpdate={onUpdate}
              />
            ))}
          </div>
        )}
      </div>
    </MaintenanceModal>
  );
}
