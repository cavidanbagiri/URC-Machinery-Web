// src/components/repair/RepairReopenModal.jsx
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';

import StatusBadge from '../machines/StatusBadge';
import RepairModal, {
  ModalField,
  PrimaryButton,
  SecondaryButton,
  inputClass,
} from './RepairModal';
import { reopenRepair } from '../../stores/repair_slice';
import { formatDate, toNullableText } from '../../utils/repair';

export default function RepairReopenModal({ open, onClose, record, onSaved }) {
  const dispatch = useDispatch();
  const mutating = useSelector((s) => s.repair.mutating);
  const [notes, setNotes] = useState('');

  const handleSubmit = async () => {
    if (!record) return;
    try {
      await dispatch(
        reopenRepair({
          repairId: record.id,
          payload: { notes: toNullableText(notes) },
        })
      ).unwrap();
      toast.success('Tamir kaydı yeniden açıldı');
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(String(err || 'Tamir yeniden açılamadı'));
    }
  };

  return (
    <RepairModal
      open={open}
      onClose={onClose}
      title="Tamiri Yeniden Aç"
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
            {mutating ? 'Açılıyor...' : 'Yeniden Aç'}
          </PrimaryButton>
        </>
      }
    >
      <div className="space-y-5">
        <div className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-xs text-amber-900">
          Kayıt yeniden açılacak ve makine <strong>Tamirde</strong> durumuna
          alınacak. Aynı makinede başka açık tamir kaydı varsa işlem engellenir.
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
              Kapanış
            </p>
            <p className="mt-0.5 font-medium text-gray-900">
              {formatDate(record?.exit_date)}
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-gray-500">
              Durum
            </p>
            <p className="mt-0.5 font-medium text-gray-900">
              {record?.status_detail?.name || '—'}
            </p>
          </div>
        </div>

        <ModalField label="Yeniden Açma Notu">
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Örn. Arıza tekrar etti"
            className={inputClass}
            maxLength={2000}
          />
        </ModalField>
      </div>
    </RepairModal>
  );
}
