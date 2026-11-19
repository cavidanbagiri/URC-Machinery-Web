// src/components/maintenance/MaintenanceCompleteModal.jsx
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  DocumentPlusIcon,
  DocumentTextIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

import StatusBadge from '../machines/StatusBadge';
import MaintenanceModal, {
  ModalField,
  PrimaryButton,
  SecondaryButton,
  errorInputClass,
  inputClass,
} from './MaintenanceModal';
import MaintenanceService from '../../services/MaintenanceService';
import { completeMaintenance } from '../../stores/maintenance_slice';
import {
  MAX_DOCUMENT_MB,
  MAINTENANCE_INTERVAL_HINTS,
  formatCounter,
  formatDate,
  formatFileSize,
  maintenanceIntervalOptions,
  toNullableText,
  todayISO,
  unitLabel,
  validateMaintenancePdf,
} from '../../utils/maintenance';
import {
  downloadDocument,
  errorText,
  viewDocument,
} from '../../utils/machineHistory';

function CompletionHistoryRow({ record }) {
  const hasPackage =
    record.interval_value !== null && record.interval_value !== undefined;

  return (
    <li className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <span className="font-medium text-gray-900">
            {formatDate(record.record_date)}
          </span>
          <span className="text-gray-300">·</span>
          <span className="text-gray-600">
            {formatCounter(record.counter_value, record.usage_unit)}
          </span>
        </div>
        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
          {hasPackage
            ? formatCounter(record.interval_value, record.usage_unit)
            : 'Paket belirtilmemiş'}
        </span>
      </div>

      {record.notes && (
        <p className="mt-1 whitespace-pre-wrap text-[11px] text-gray-600">
          {record.notes}
        </p>
      )}

      {record.documents?.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {record.documents.map((document) => (
            <span
              key={document.id}
              className="inline-flex max-w-full items-center gap-1 rounded-full border border-blue-100 bg-white py-0.5 pl-2 pr-1 text-[10px] text-blue-800"
            >
              <button
                type="button"
                onClick={() =>
                  viewDocument(
                    () => MaintenanceService.fetchDocument(document.id),
                    document
                  )
                }
                title={`${document.file_name} · Görüntüle`}
                className="inline-flex min-w-0 items-center gap-1 hover:underline"
              >
                <DocumentTextIcon className="h-3 w-3 flex-none" />
                <span className="max-w-[10rem] truncate">
                  {document.file_name}
                </span>
              </button>
              <button
                type="button"
                onClick={() =>
                  downloadDocument(
                    () => MaintenanceService.fetchDocument(document.id),
                    document
                  )
                }
                title="İndir"
                aria-label={`${document.file_name} indir`}
                className="flex-none rounded p-0.5 text-emerald-600 transition hover:bg-emerald-100"
              >
                <ArrowDownTrayIcon className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </li>
  );
}

export default function MaintenanceCompleteModal({
  open,
  onClose,
  machine,
  onSaved,
}) {
  const dispatch = useDispatch();
  const mutating = useSelector((s) => s.maintenance.mutating);

  const [form, setForm] = useState({
    counter_value: '',
    interval_value: '',
    maintenance_date: todayISO(),
    notes: '',
  });
  const [pdfFile, setPdfFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [history, setHistory] = useState({
    loading: false,
    error: null,
    items: [],
  });
  const [historyReloadKey, setHistoryReloadKey] = useState(0);

  const intervalOptions = maintenanceIntervalOptions(machine?.usage_unit);
  const intervalHints =
    MAINTENANCE_INTERVAL_HINTS[machine?.usage_unit] || {};
  const selectedPackage =
    form.interval_value === '' ? null : Number(form.interval_value);
  const selectedPackageHint =
    selectedPackage === null ? null : intervalHints[selectedPackage];

  useEffect(() => {
    if (!open || !machine) return;
    setForm({
      counter_value: machine.current_counter ?? machine.last_counter ?? '',
      interval_value: '',
      maintenance_date: todayISO(),
      notes: '',
    });
    setPdfFile(null);
    setErrors({});
    setHistory({ loading: false, error: null, items: [] });
  }, [open, machine]);

  // The completion dialog shows the newest maintenance-only records so the
  // operator can pick the right package without leaving the form.
  useEffect(() => {
    if (!open || !machine) return undefined;

    let active = true;
    setHistory({ loading: true, error: null, items: [] });

    (async () => {
      try {
        const items = await MaintenanceService.fetchHistory(machine.machine_id, {
          record_type: 'maintenance',
          limit: 8,
        });
        if (!active) return;
        setHistory({ loading: false, error: null, items: items || [] });
      } catch (err) {
        if (!active) return;
        setHistory({
          loading: false,
          error: errorText(err, 'Son bakım kayıtları yüklenemedi'),
          items: [],
        });
      }
    })();

    return () => {
      active = false;
    };
  }, [open, machine, historyReloadKey]);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    // Allow picking the same file again after a validation error.
    event.target.value = '';
    if (!file) return;

    const validationError = validateMaintenancePdf(file);
    if (validationError) {
      setPdfFile(null);
      setErrors((prev) => ({ ...prev, document: validationError }));
      return;
    }

    setPdfFile(file);
    setErrors((prev) => ({ ...prev, document: '' }));
  };

  const removeFile = () => {
    setPdfFile(null);
    setErrors((prev) => ({ ...prev, document: '' }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!machine) return;

    const value = Number(form.counter_value);
    const nextErrors = {};

    if (form.counter_value === '' || Number.isNaN(value) || value < 0) {
      nextErrors.counter_value = 'Geçerli bir sayaç değeri girin';
    } else if (
      machine.current_counter !== null &&
      machine.current_counter !== undefined &&
      value < Number(machine.current_counter)
    ) {
      nextErrors.counter_value = `Bakım sayacı güncel sayaçtan küçük olamaz (${formatCounter(
        machine.current_counter,
        machine.usage_unit
      )})`;
    }

    const selectedInterval = Number(form.interval_value);
    if (
      form.interval_value === '' ||
      Number.isNaN(selectedInterval) ||
      !intervalOptions.includes(selectedInterval)
    ) {
      nextErrors.interval_value = 'Yapılan bakım paketini seçin';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    if (!pdfFile) {
      setErrors({ document: 'Bakımı tamamlamak için PDF evrak eklemelisiniz' });
      return;
    }

    try {
      await dispatch(
        completeMaintenance({
          machineId: machine.machine_id,
          payload: {
            counter_value: value,
            interval_value: selectedInterval,
            maintenance_date: toNullableText(form.maintenance_date),
            notes: toNullableText(form.notes),
          },
          file: pdfFile,
        })
      ).unwrap();
      toast.success('Bakım tamamlandı ve PDF evrak kaydedildi');
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(String(err || 'Bakım tamamlanamadı'));
    }
  };

  const unit = unitLabel(machine?.usage_unit);

  return (
    <MaintenanceModal
      open={open}
      onClose={onClose}
      title="Bakımı Tamamla"
      subtitle={
        machine
          ? `${machine.identification_no || `Makine #${machine.machine_id}`}${
              machine.plate_no ? ` · ${machine.plate_no}` : ''
            }`
          : undefined
      }
      badge={machine?.status ? <StatusBadge status={machine.status} /> : null}
      footer={
        <>
          <SecondaryButton onClick={onClose} disabled={mutating}>
            İptal
          </SecondaryButton>
          <PrimaryButton type="button" onClick={handleSubmit} disabled={mutating}>
            {mutating ? 'Kaydediliyor...' : 'Bakımı Tamamla'}
          </PrimaryButton>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
          Bakım tamamlandığında son bakım sayacı ve tarihi bu kayıtla
          güncellenir; sonraki bakım sayacı yeniden hesaplanır. Her bakım
          kaydı için <strong>PDF evrak zorunludur</strong>.
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-xl bg-gray-50 p-4 text-sm sm:grid-cols-4">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-gray-500">
              Güncel Sayaç
            </p>
            <p className="mt-0.5 font-medium text-gray-900">
              {formatCounter(machine?.current_counter, machine?.usage_unit)}
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-gray-500">
              Sonraki Bakım
            </p>
            <p className="mt-0.5 font-medium text-gray-900">
              {formatCounter(machine?.next_counter, machine?.usage_unit)}
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-gray-500">
              Son Bakım
            </p>
            <p className="mt-0.5 font-medium text-gray-900">
              {formatDate(machine?.last_maintenance_date)}
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-gray-500">
              Plan Aralığı
            </p>
            <p className="mt-0.5 font-medium text-gray-900">
              {formatCounter(machine?.interval_value, machine?.usage_unit)}
            </p>
          </div>
        </div>

        <ModalField
          label={`Yapılan Bakım Paketi${unit ? ` (${unit})` : ''} *`}
          hint="Bu bakımda yapılan iş paketini seçin. Seçim bakım geçmişine işlenir."
          error={errors.interval_value}
        >
          {intervalOptions.length === 0 ? (
            <p className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-xs text-gray-500">
              Bu makinenin bakım birimi tanımlı olmadığı için paket seçilemiyor.
            </p>
          ) : (
            <div className="space-y-2">
              <select
                value={form.interval_value}
                onChange={(event) =>
                  handleChange(
                    'interval_value',
                    event.target.value === ''
                      ? ''
                      : Number(event.target.value)
                  )
                }
                disabled={mutating}
                aria-label="Yapılan bakım paketi"
                className={errors.interval_value ? errorInputClass : inputClass}
              >
                <option value="">Bakım paketi seçin...</option>
                {intervalOptions.map((option) => (
                  <option key={option} value={option}>
                    {formatCounter(option, machine?.usage_unit)}
                  </option>
                ))}
              </select>

              {selectedPackageHint && (
                <p className="rounded-lg bg-blue-50 px-3 py-2 text-[11px] text-blue-700">
                  {selectedPackageHint}
                </p>
              )}
            </div>
          )}
        </ModalField>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <ModalField
            label={`Bakım Sayaç Değeri${unit ? ` (${unit})` : ''}`}
            hint="Bakımın yapıldığı andaki sayaç değeri"
            error={errors.counter_value}
          >
            <input
              type="number"
              min="0"
              step="any"
              value={form.counter_value}
              onChange={(e) => handleChange('counter_value', e.target.value)}
              placeholder="0"
              className={errors.counter_value ? errorInputClass : inputClass}
            />
          </ModalField>

          <ModalField label="Bakım Tarihi">
            <input
              type="date"
              value={form.maintenance_date}
              onChange={(e) => handleChange('maintenance_date', e.target.value)}
              className={inputClass}
            />
          </ModalField>
        </div>

        <ModalField label="Notlar">
          <textarea
            rows={3}
            value={form.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Yapılan bakım ile ilgili not..."
            className={inputClass}
          />
        </ModalField>

        <ModalField
          label="Bakım Evrakı (PDF) *"
          hint={`Tamamlanan bakımın iş emri/faturası. Sadece PDF · en fazla ${MAX_DOCUMENT_MB} MB`}
          error={errors.document}
        >
          <div
            className={`rounded-xl border border-dashed p-3 ${
              errors.document
                ? 'border-red-300 bg-red-50'
                : 'border-gray-300 bg-gray-50'
            }`}
          >
            {pdfFile && (
              <div className="mb-2 flex items-center justify-between gap-2 rounded-lg border border-blue-100 bg-white px-3 py-2">
                <div className="flex min-w-0 items-center gap-2">
                  <DocumentTextIcon className="h-4 w-4 flex-none text-blue-600" />
                  <span
                    className="max-w-[18rem] truncate text-sm text-gray-700"
                    title={pdfFile.name}
                  >
                    {pdfFile.name}
                  </span>
                  <span className="flex-none text-[11px] text-gray-400">
                    {formatFileSize(pdfFile.size)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  disabled={mutating}
                  title="Seçilen evrakı kaldır"
                  aria-label="Seçilen evrakı kaldır"
                  className="flex-none rounded p-1 text-red-600 transition hover:bg-red-50 disabled:opacity-40"
                >
                  <XMarkIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            <label
              htmlFor="maintenance-complete-document"
              className={`flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition ${
                mutating
                  ? 'pointer-events-none opacity-60'
                  : 'cursor-pointer text-blue-700 hover:text-blue-800'
              }`}
            >
              <DocumentPlusIcon className="h-5 w-5" />
              {pdfFile ? 'Başka PDF seç' : 'PDF evrak seç (zorunlu)'}
            </label>
            <input
              id="maintenance-complete-document"
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              disabled={mutating}
              onChange={handleFileChange}
            />
          </div>
        </ModalField>

        <div className="border-t border-gray-200 pt-4">
          <div className="mb-2 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Son 8 Bakım Kaydı
              </p>
              <p className="mt-0.5 text-[11px] text-gray-400">
                En yeni bakım en üstte · paket seçmeden önce geçmişi kontrol
                edin
              </p>
            </div>
            <button
              type="button"
              onClick={() => setHistoryReloadKey((value) => value + 1)}
              disabled={history.loading || mutating}
              className="flex flex-none items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-[11px] font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ArrowPathIcon
                className={`h-3.5 w-3.5 ${
                  history.loading ? 'animate-spin' : ''
                }`}
              />
              Yenile
            </button>
          </div>

          {history.loading && (
            <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-3 text-xs text-gray-500">
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
              Bakım geçmişi yükleniyor...
            </div>
          )}

          {!history.loading && history.error && (
            <div className="flex items-center justify-between gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
              <span>{history.error}</span>
              <button
                type="button"
                onClick={() => setHistoryReloadKey((value) => value + 1)}
                className="flex-none font-medium underline"
              >
                Tekrar dene
              </button>
            </div>
          )}

          {!history.loading &&
            !history.error &&
            history.items.length === 0 && (
              <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-5 text-center text-xs text-gray-500">
                Bu makine için tamamlanmış bakım kaydı bulunmuyor.
              </div>
            )}

          {!history.loading &&
            !history.error &&
            history.items.length > 0 && (
              <ul className="max-h-64 space-y-2 overflow-y-auto pr-1">
                {history.items.map((record) => (
                  <CompletionHistoryRow key={record.id} record={record} />
                ))}
              </ul>
            )}
        </div>
      </form>
    </MaintenanceModal>
  );
}

