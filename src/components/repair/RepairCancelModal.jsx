// src/components/repair/RepairCancelModal.jsx
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
import { cancelRepair } from '../../stores/repair_slice';

export default function RepairCancelModal({ open, onClose, record, onSaved }) {
  const dispatch = useDispatch();
  const mutating = useSelector((s) => s.repair.mutating);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!record) return;
    if (!reason.trim()) {
      setError('İptal nedeni zorunludur');
      return;
    }

    try {
      await dispatch(
        cancelRepair({
          repairId: record.id,
          payload: { reason: reason.trim() },
        })
      ).unwrap();
      toast.success('Tamir kaydı iptal edildi');
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(String(err || 'Tamir iptal edilemedi'));
    }
  };

  return (
    <RepairModal
      open={open}
      onClose={onClose}
      title="Tamiri İptal Et"
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
            tone="red"
          >
            {mutating ? 'Kaydediliyor...' : 'Tamiri İptal Et'}
          </PrimaryButton>
        </>
      }
    >
      <div className="space-y-5">
        <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-800">
          Kayıt silinmez; iptal olarak saklanır ve geçmişte görünmeye devam eder.
          Makinenin durumu önceki durumuna geri döner.
        </div>

        <div className="rounded-xl bg-gray-50 p-4 text-sm">
          <p className="text-[11px] uppercase tracking-wide text-gray-500">
            Tamir
          </p>
          <p className="mt-0.5 font-medium text-gray-900">
            {record?.repair_type_name || '—'}
            {record?.fault_location ? ` · ${record.fault_location}` : ''}
          </p>
        </div>

        <ModalField label="İptal Nedeni *" error={error}>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError('');
            }}
            placeholder="Örn. Makine başka bir servise gönderildi"
            className={error ? errorInputClass : inputClass}
            maxLength={500}
          />
        </ModalField>
      </div>
    </RepairModal>
  );
}
