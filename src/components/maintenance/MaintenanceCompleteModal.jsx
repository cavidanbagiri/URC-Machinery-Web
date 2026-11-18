// src/components/maintenance/MaintenanceCompleteModal.jsx
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import {
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
import { completeMaintenance } from '../../stores/maintenance_slice';
import {
  MAX_DOCUMENT_MB,
  formatCounter,
  formatDate,
  formatFileSize,
  toNullableText,
  todayISO,
  unitLabel,
  validateMaintenancePdf,
} from '../../utils/maintenance';

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
    maintenance_date: todayISO(),
    notes: '',
  });
  const [pdfFile, setPdfFile] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open || !machine) return;
    setForm({
      counter_value: machine.current_counter ?? machine.last_counter ?? '',
      maintenance_date: todayISO(),
      notes: '',
    });
    setPdfFile(null);
    setErrors({});
  }, [open, machine]);

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
              Aralık
            </p>
            <p className="mt-0.5 font-medium text-gray-900">
              {formatCounter(machine?.interval_value, machine?.usage_unit)}
            </p>
          </div>
        </div>

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
      </form>
    </MaintenanceModal>
  );
}

