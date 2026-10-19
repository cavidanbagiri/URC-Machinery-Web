// src/components/maintenance/MaintenancePlanModal.jsx
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
import { upsertMaintenanceSettings } from '../../stores/maintenance_slice';
import { toNullableNumber, toNullableText } from '../../utils/maintenance';

const emptyForm = {
  usage_unit: 'km',
  interval_value: '',
  last_counter: '',
  last_maintenance_date: '',
  current_counter: '',
  current_counter_date: '',
  warning_threshold: '',
  is_active: true,
  notes: '',
};

export default function MaintenancePlanModal({ open, onClose, machine, onSaved }) {
  const dispatch = useDispatch();
  const mutating = useSelector((s) => s.maintenance.mutating);

  const [form, setForm] = useState({ ...emptyForm });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open || !machine) return;

    setForm({
      usage_unit: machine.usage_unit || 'km',
      interval_value: machine.interval_value ?? '',
      last_counter: machine.last_counter ?? '',
      last_maintenance_date: machine.last_maintenance_date || '',
      current_counter: machine.current_counter ?? '',
      current_counter_date: machine.current_counter_date || '',
      warning_threshold: machine.warning_threshold ?? '',
      is_active: machine.has_plan ? machine.is_active !== false : true,
      notes: machine.notes || '',
    });
    setErrors({});
  }, [open, machine]);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: '' }));
    }
  };

  const validate = () => {
    const nextErrors = {};

    if (!['km', 'hour'].includes(form.usage_unit)) {
      nextErrors.usage_unit = 'Kullanım birimi seçin';
    }

    const interval = Number(form.interval_value);
    if (!form.interval_value || Number.isNaN(interval) || interval <= 0) {
      nextErrors.interval_value = 'Aralık 0’dan büyük olmalıdır';
    }

    for (const key of ['last_counter', 'current_counter', 'warning_threshold']) {
      if (
        form[key] !== '' &&
        (Number.isNaN(Number(form[key])) || Number(form[key]) < 0)
      ) {
        nextErrors[key] = 'Negatif olmayan bir sayı girin';
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!machine || !validate()) return;

    const payload = {
      usage_unit: form.usage_unit,
      interval_value: Number(form.interval_value),
      last_counter: toNullableNumber(form.last_counter),
      last_maintenance_date: toNullableText(form.last_maintenance_date),
      current_counter: toNullableNumber(form.current_counter),
      current_counter_date: toNullableText(form.current_counter_date),
      warning_threshold: toNullableNumber(form.warning_threshold),
      is_active: form.is_active === true,
      notes: toNullableText(form.notes),
    };

    try {
      await dispatch(
        upsertMaintenanceSettings({ machineId: machine.machine_id, payload })
      ).unwrap();
      toast.success(
        machine.has_plan ? 'Bakım planı güncellendi' : 'Bakım planı oluşturuldu'
      );
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(String(err || 'Bakım planı kaydedilemedi'));
    }
  };

  return (
    <MaintenanceModal
      open={open}
      onClose={onClose}
      title={machine?.has_plan ? 'Bakım Planını Düzenle' : 'Bakım Planı Oluştur'}
      subtitle={
        machine
          ? `${machine.identification_no || `Makine #${machine.machine_id}`}${
              machine.plate_no ? ` · ${machine.plate_no}` : ''
            }`
          : undefined
      }
      badge={machine?.has_plan ? <StatusBadge status={machine.status} /> : null}
      footer={
        <>
          <SecondaryButton onClick={onClose} disabled={mutating}>
            İptal
          </SecondaryButton>
          <PrimaryButton
            type="submit"
            form="maintenance-plan-form"
            disabled={mutating}
          >
            {mutating ? 'Kaydediliyor...' : 'Kaydet'}
          </PrimaryButton>
        </>
      }
    >
      <form id="maintenance-plan-form" onSubmit={handleSubmit} className="space-y-6">
        <section>
          <h3 className="mb-3 border-b border-gray-100 pb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Plan Ayarları
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <ModalField label="Kullanım Birimi" error={errors.usage_unit}>
              <select
                value={form.usage_unit}
                onChange={(e) => handleChange('usage_unit', e.target.value)}
                className={errors.usage_unit ? errorInputClass : inputClass}
              >
                <option value="km">Kilometre (km)</option>
                <option value="hour">Saat (hour)</option>
              </select>
            </ModalField>

            <ModalField
              label="Bakım Aralığı"
              hint={`Örn. 10000 → her 10.000 ${
                form.usage_unit === 'hour' ? 'saat' : 'km'
              }`}
              error={errors.interval_value}
            >
              <input
                type="number"
                min="0"
                step="any"
                value={form.interval_value}
                onChange={(e) => handleChange('interval_value', e.target.value)}
                placeholder="10000"
                className={errors.interval_value ? errorInputClass : inputClass}
              />
            </ModalField>

            <ModalField
              label="Uyarı Eşiği"
              hint="Boş bırakılırsa aralığın %10’u kullanılır"
              error={errors.warning_threshold}
            >
              <input
                type="number"
                min="0"
                step="any"
                value={form.warning_threshold}
                onChange={(e) =>
                  handleChange('warning_threshold', e.target.value)
                }
                placeholder="1000"
                className={errors.warning_threshold ? errorInputClass : inputClass}
              />
            </ModalField>
          </div>
        </section>

        <section>
          <h3 className="mb-3 border-b border-gray-100 pb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Son Bakım
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ModalField label="Son Bakım Sayacı" error={errors.last_counter}>
              <input
                type="number"
                min="0"
                step="any"
                value={form.last_counter}
                onChange={(e) => handleChange('last_counter', e.target.value)}
                placeholder="0"
                className={errors.last_counter ? errorInputClass : inputClass}
              />
            </ModalField>

            <ModalField label="Son Bakım Tarihi">
              <input
                type="date"
                value={form.last_maintenance_date}
                onChange={(e) =>
                  handleChange('last_maintenance_date', e.target.value)
                }
                className={inputClass}
              />
            </ModalField>
          </div>
        </section>

        <section>
          <h3 className="mb-3 border-b border-gray-100 pb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Güncel Sayaç
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ModalField label="Güncel Sayaç Değeri" error={errors.current_counter}>
              <input
                type="number"
                min="0"
                step="any"
                value={form.current_counter}
                onChange={(e) => handleChange('current_counter', e.target.value)}
                placeholder="0"
                className={errors.current_counter ? errorInputClass : inputClass}
              />
            </ModalField>

            <ModalField label="Sayaç Tarihi">
              <input
                type="date"
                value={form.current_counter_date}
                onChange={(e) =>
                  handleChange('current_counter_date', e.target.value)
                }
                className={inputClass}
              />
            </ModalField>
          </div>
        </section>

        <section className="space-y-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => handleChange('is_active', e.target.checked)}
              className="h-4 w-4 rounded accent-blue-600"
            />
            Plan aktif (pasif planlar bakım takibine dahil edilmez)
          </label>

          <ModalField label="Notlar">
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Plan ile ilgili notlar..."
              className={inputClass}
            />
          </ModalField>
        </section>
      </form>
    </MaintenanceModal>
  );
}

