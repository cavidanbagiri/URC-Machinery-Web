// src/components/maintenance/MaintenanceCompleteModal.jsx
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
import { completeMaintenance } from '../../stores/maintenance_slice';
import {
  formatCounter,
  formatDate,
  toNullableText,
  todayISO,
  unitLabel,
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
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open || !machine) return;
    setForm({
      counter_value: machine.current_counter ?? machine.last_counter ?? '',
      maintenance_date: todayISO(),
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
      nextErrors.counter_value = `Bakım sayacı güncel sayaçtan küçük olamaz (${formatCounter(
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
        completeMaintenance({
          machineId: machine.machine_id,
          payload: {
            counter_value: value,
            maintenance_date: toNullableText(form.maintenance_date),
            notes: toNullableText(form.notes),
          },
        })
      ).unwrap();
      toast.success('Bakım tamamlandı olarak kaydedildi');
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
          güncellenir; sonraki bakım sayacı yeniden hesaplanır.
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
      </form>
    </MaintenanceModal>
  );
}

