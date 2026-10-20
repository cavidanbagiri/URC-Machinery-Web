// src/components/repair/RepairCloseModal.jsx
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';

import StatusBadge from '../machines/StatusBadge';
import RepairModal, {
  ModalField,
  PrimaryButton,
  SecondaryButton,
  errorInputClass,
  inputClass,
} from './RepairModal';
import { closeRepair } from '../../stores/repair_slice';
import { formatDate, toNullableText, todayISO } from '../../utils/repair';

export default function RepairCloseModal({ open, onClose, record, onSaved }) {
  const dispatch = useDispatch();
  const mutating = useSelector((s) => s.repair.mutating);

  const [form, setForm] = useState({ exit_date: todayISO(), notes: '' });
  const [errors, setErrors] = useState({});

  const handleSubmit = async () => {
    if (!record) return;

    if (!form.exit_date) {
      setErrors({ exit_date: 'Çıkış tarihi zorunludur' });
      return;
    }
    if (form.exit_date < record.entry_date) {
      setErrors({
        exit_date: 'Çıkış tarihi giriş tarihinden önce olamaz',
      });
      return;
    }

    try {
      await dispatch(
        closeRepair({
          repairId: record.id,
          payload: {
            exit_date: form.exit_date,
            notes: toNullableText(form.notes),
          },
        })
      ).unwrap();
      toast.success('Tamir tamamlandı olarak kaydedildi');
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(String(err || 'Tamir tamamlanamadı'));
    }
  };

  return (
    <RepairModal
      open={open}
      onClose={onClose}
      title="Tamiri Tamamla"
      subtitle={
        record
          ? [record.identification_no, record.plate_no].filter(Boolean).join(' · ')
          : undefined
      }
      badge={
        record?.status_detail ? (
          <StatusBadge status={record.status_detail} />
        ) : null
      }
      footer={
        <>
          <SecondaryButton onClick={onClose} disabled={mutating}>
            Vazgeç
          </SecondaryButton>
          <PrimaryButton
            type="button"
            onClick={handleSubmit}
            disabled={mutating}
            tone="green"
          >
            {mutating ? 'Kaydediliyor...' : 'Tamiri Tamamla'}
          </PrimaryButton>
        </>
      }
    >
      <div className="space-y-5">
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
          Tamir tamamlandığında makinenin durumu önceki durumuna geri döner.
          Çıkış tarihi zorunludur.
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-xl bg-gray-50 p-4 text-sm sm:grid-cols-4">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-gray-500">
              Tamir Tipi
            </p>
            <p className="mt-0.5 font-medium text-gray-900">
              {record?.repair_type_name || '—'}
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-gray-500">
              Giriş
            </p>
            <p className="mt-0.5 font-medium text-gray-900">
              {formatDate(record?.entry_date)}
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-gray-500">
              Tahmini Çıkış
            </p>
            <p className="mt-0.5 font-medium text-gray-900">
              {formatDate(record?.estimated_exit_date)}
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-gray-500">
              Arıza Yeri
            </p>
            <p className="mt-0.5 truncate font-medium text-gray-900">
              {record?.fault_location || '—'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <ModalField label="Çıkış Tarihi *" error={errors.exit_date}>
            <input
              type="date"
              value={form.exit_date}
              min={record?.entry_date || undefined}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, exit_date: e.target.value }));
                if (errors.exit_date) setErrors({});
              }}
              className={errors.exit_date ? errorInputClass : inputClass}
            />
          </ModalField>

          <ModalField label="Kapanış Notu">
            <input
              type="text"
              value={form.notes}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="Yapılan işlem / değiştirilen parça"
              className={inputClass}
              maxLength={2000}
            />
          </ModalField>
        </div>

        {record?.notes && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
              Açılış Notu
            </p>
            <p className="mt-1 whitespace-pre-wrap text-xs text-gray-700">
              {record.notes}
            </p>
          </div>
        )}
      </div>
    </RepairModal>
  );
}
