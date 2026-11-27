// src/components/meterlog/MeterLogEntriesModal.jsx
//
// **İşlemler → Düzenle** penceresi: bir makinenin son KM / motor saati
// okumalarını listeler ve satırı yerinde düzeltmeye izin verir. Klasik hata,
// sayacın yanlış güne ya da yanlış değerle girilmesidir; bu yüzden satır
// silinmez, aynı satır güncellenir. Matris ve "en yeni okuma" sütunları
// kayıttan hesaplandığı için özet kaydettikten sonra sunucudan yenilenir.
import { useState } from 'react';
import {
  ArrowPathIcon,
  InformationCircleIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline';

import MaintenanceModal, {
  PrimaryButton,
  SecondaryButton,
  inputClass,
} from '../maintenance/MaintenanceModal';
import { formatDate, formatDateTime, todayISO } from '../../utils/maintenance';
import { parseDecimalInput } from '../../utils/numberInput';

/** Sunucudan gelen sayıyı giriş alanına yazılacak metne çevirir. */
function initialValue(value) {
  return value === null || value === undefined ? '' : String(value);
}

/**
 * Tek bir okuma satırı. Alanlar sunucudan gelen değerlerle başlar; kayıt
 * düzeltildikten sonra liste tazelendiğinde üst bileşen satırı yeni değerlerle
 * yeniden kurar (bkz. `key`), böylece form sunucu değerlerine döner.
 */
function EntryRow({ entry, saving, disabled, onUpdate }) {
  const [logDate, setLogDate] = useState(entry.log_date || '');
  const [km, setKm] = useState(initialValue(entry.km));
  const [engineHours, setEngineHours] = useState(
    initialValue(entry.engine_hours)
  );
  const [error, setError] = useState(null);

  const kmValue = parseDecimalInput(km);
  const engineValue = parseDecimalInput(engineHours);

  const dateChanged = Boolean(logDate) && logDate !== entry.log_date;
  const kmChanged =
    kmValue !== null && Math.abs(kmValue - Number(entry.km)) > 1e-9;
  const engineChanged =
    engineValue !== null &&
    Math.abs(engineValue - Number(entry.engine_hours)) > 1e-9;
  const dirty = dateChanged || kmChanged || engineChanged;

  const handleSave = async () => {
    setError(null);

    if (!logDate) {
      setError('Tarih gerekli');
      return;
    }
    if (logDate > todayISO()) {
      setError('Gelecek bir tarih seçilemez');
      return;
    }
    if (kmValue === null || kmValue < 0) {
      setError('0 veya daha büyük bir KM değeri girin');
      return;
    }
    if (engineValue === null || engineValue < 0) {
      setError('0 veya daha büyük bir motor saati girin');
      return;
    }
    if (!dirty) {
      setError('Değişiklik yok');
      return;
    }

    const changes = {};
    if (dateChanged) changes.log_date = logDate;
    if (kmChanged) changes.km = kmValue;
    if (engineChanged) changes.engine_hours = engineValue;

    try {
      await onUpdate(entry, changes);
    } catch {
      // Hata mesajı penceredeki uyarı alanında gösterilir; girilen değerler
      // korunur.
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-40">
          <label className="mb-1 block text-[11px] font-medium text-gray-600">
            Tarih
          </label>
          <input
            type="date"
            value={logDate}
            max={todayISO()}
            disabled={saving || disabled}
            onChange={(event) => {
              setLogDate(event.target.value);
              setError(null);
            }}
            aria-label="Kayıt tarihi"
            className={inputClass}
          />
        </div>

        <div className="w-32">
          <label className="mb-1 block text-[11px] font-medium text-gray-600">
            KM
          </label>
          <input
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={km}
            disabled={saving || disabled}
            onChange={(event) => {
              setKm(event.target.value);
              setError(null);
            }}
            onFocus={(event) => event.target.select()}
            aria-label="Kayıt KM değeri"
            className={`${inputClass} text-right`}
          />
        </div>

        <div className="w-32">
          <label className="mb-1 block text-[11px] font-medium text-gray-600">
            Motor saati
          </label>
          <input
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={engineHours}
            disabled={saving || disabled}
            onChange={(event) => {
              setEngineHours(event.target.value);
              setError(null);
            }}
            onFocus={(event) => event.target.select()}
            aria-label="Kayıt motor saati değeri"
            className={`${inputClass} text-right`}
          />
        </div>

        <div className="min-w-0 flex-1 text-[11px] leading-5 text-gray-500">
          <p className="truncate" title={entry.entered_by_name || ''}>
            Giren: {entry.entered_by_name || '—'}
          </p>
          <p className="truncate tabular-nums">
            {formatDateTime(entry.created_at)}
          </p>
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

export default function MeterLogEntriesModal({
  open,
  onClose,
  label,
  selectedDate,
  entries = [],
  loading = false,
  error = null,
  savingEntryId = null,
  onUpdate,
}) {
  const busy = savingEntryId !== null && savingEntryId !== undefined;

  return (
    <MaintenanceModal
      open={open}
      onClose={onClose}
      title="KM / Motor Saati Kayıtları"
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
            Yanlış güne veya yanlış değerle girilen okumayı buradan düzeltin:
            tarihi, KM'yi ya da motor saatini değiştirip <strong>Kaydet</strong>'e
            basın. Kayıt silinmez, aynı satırda güncellenir; matris ve{' '}
            <strong>Son KM / Son Motor Saati</strong> sütunları yeni değere göre
            yeniden hesaplanır. Seçilen günden 30 günden daha geriye taşınan
            satır bu listeden çıkar.
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
                <div className="h-8 w-28 animate-pulse rounded bg-gray-200/70" />
                <div className="h-3 flex-1 animate-pulse rounded bg-gray-200/70" />
              </div>
            ))}
          </div>
        )}

        {!loading && entries.length === 0 && (
          <div className="rounded-lg border border-dashed border-gray-200 px-4 py-10 text-center">
            <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <PencilSquareIcon className="h-5 w-5" />
            </span>
            <p className="mt-3 text-sm font-semibold text-gray-900">
              Kayıt bulunamadı
            </p>
            <p className="mt-1 text-[12px] text-gray-500">
              Bu makine için son 30 günde girilmiş KM / motor saati kaydı yok.
              Yeni kayıt için tablodaki <strong>Yeni KM</strong> ve{' '}
              <strong>Yeni Motor Saati</strong> alanlarını kullanın.
            </p>
          </div>
        )}

        {!loading && entries.length > 0 && (
          <div className="space-y-2">
            {entries.map((entry) => (
              <EntryRow
                // Sunucu değerleri değişince satır yeniden kurulur; form
                // kaydedilen tarih / sayaçlarla başlar.
                key={`${entry.id}:${entry.log_date}:${entry.km}:${entry.engine_hours}`}
                entry={entry}
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

