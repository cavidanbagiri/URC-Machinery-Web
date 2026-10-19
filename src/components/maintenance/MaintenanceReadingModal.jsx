// src/components/maintenance/MaintenanceReadingModal.jsx
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';

import StatusBadge from '../machines/StatusBadge';
import MaintenanceModal, {
  ModalField,
  PrimaryButton,
  SecondaryButton,
  errorInputClass,
  inputClass,
} from './MaintenanceModal';
import { recordMaintenanceReading } from '../../stores/maintenance_slice';
import {
  formatCounter,
  formatDate,
  toNullableText,
  todayISO,
  unitLabel,
} from '../../utils/maintenance';

export default function MaintenanceReadingModal({
  open,
  onClose,
  machine,
  onSaved,
}) {
  const dispatch = useDispatch();
  const mutating = useSelector((s) => s.maintenance.mutating);

  const [form, setForm] = useState({
    counter_value: '',
    reading_date: todayISO(),
    notes: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open || !machine) return;
    setForm({
      counter_value: machine.current_counter ?? machine.last_counter ?? '',
      reading_date: todayISO(),
      notes: '',
    });
    setErrors({});
  }, [open, machine]);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
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
      nextErrors.counter_value = `Sayaç değeri mevcut değerden küçük olamaz (${formatCounter(
        machine.current_counter,
        machine.usage_unit
      )})`;
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    try {
      await dispatch(
        recordMaintenanceReading({
          machineId: machine.machine_id,
          payload: {
            counter_value: value,
            reading_date: toNullableText(form.reading_date),
            notes: toNullableText(form.notes),
          },
        })
      ).unwrap();
      toast.success('Sayaç kaydı eklendi');
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(String(err || 'Sayaç kaydı eklenemedi'));
    }
  };

  const unit = unitLabel(machine?.usage_unit);

  return (
    <MaintenanceModal
      open={open}
      onClose={onClose}
      title="Sayaç Kaydı Ekle"
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
            {mutating ? 'Kaydediliyor...' : 'Kaydet'}
          </PrimaryButton>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
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
              Sayaç Tarihi
            </p>
            <p className="mt-0.5 font-medium text-gray-900">
              {formatDate(machine?.current_counter_date)}
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
              Kalan
            </p>
            <p className="mt-0.5 font-medium text-gray-900">
              {formatCounter(machine?.remaining, machine?.usage_unit)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <ModalField
            label={`Yeni Sayaç Değeri${unit ? ` (${unit})` : ''}`}
            hint="Değer mevcut sayaçtan küçük olamaz"
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

          <ModalField label="Kayıt Tarihi">
            <input
              type="date"
              value={form.reading_date}
              onChange={(e) => handleChange('reading_date', e.target.value)}
              className={inputClass}
            />
          </ModalField>
        </div>

        <ModalField label="Notlar">
          <textarea
            rows={3}
            value={form.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Sayaç kaydı ile ilgili not..."
            className={inputClass}
          />
        </ModalField>
      </form>
    </MaintenanceModal>
  );
}
