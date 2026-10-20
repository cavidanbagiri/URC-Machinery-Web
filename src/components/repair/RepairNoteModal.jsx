// src/components/repair/RepairNoteModal.jsx
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
import { addRepairNote } from '../../stores/repair_slice';

export default function RepairNoteModal({ open, onClose, record, onSaved }) {
  const dispatch = useDispatch();
  const mutating = useSelector((s) => s.repair.mutating);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!record) return;
    if (!note.trim()) {
      setError('Not metni zorunludur');
      return;
    }

    try {
      await dispatch(
        addRepairNote({
          repairId: record.id,
          payload: { note: note.trim() },
        })
      ).unwrap();
      toast.success('Not eklendi');
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(String(err || 'Not eklenemedi'));
    }
  };

  return (
    <RepairModal
      open={open}
      onClose={onClose}
      title="Tamir Notu Ekle"
      subtitle={
        record
          ? `${record.repair_type_name || 'Tamir'} · ${
              record.identification_no || `Makine #${record.machine_id}`
            }`
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
          <PrimaryButton type="button" onClick={handleSubmit} disabled={mutating}>
            {mutating ? 'Ekleniyor...' : 'Notu Ekle'}
          </PrimaryButton>
        </>
      }
    >
      <ModalField label="Not *" error={error}>
        <textarea
          rows={5}
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
            if (error) setError('');
          }}
          placeholder="Tamir süreciyle ilgili gelişme, parça durumu veya yapılan işlem..."
          className={error ? errorInputClass : inputClass}
          maxLength={2000}
        />
      </ModalField>
    </RepairModal>
  );
}
