// src/components/repair/RepairArchiveNoteModal.jsx
// Arşivde yanlış girilmiş "Güncel Durum" notunu düzeltir. Uç nokta yalnızca
// yetkili hesaba açıktır (fyildiz@ustay.com + status_id = 2); diğer
// kullanıcılarda düğme hiç görünmez ve API 403 döner.
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
import { updateRepairArchiveNote } from '../../stores/repair_slice';

const MAX_NOTE_LENGTH = 4000;

export default function RepairArchiveNoteModal({
  open,
  onClose,
  record,
  onSaved,
}) {
  const dispatch = useDispatch();
  const mutating = useSelector((s) => s.repair.mutating);
  const [note, setNote] = useState(record?.notes || '');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!record) return;

    const value = note.trim();
    if (value.length > MAX_NOTE_LENGTH) {
      setError(`Not en fazla ${MAX_NOTE_LENGTH} karakter olabilir`);
      return;
    }

    try {
      await dispatch(
        updateRepairArchiveNote({
          repairId: record.id,
          payload: { note: value },
        })
      ).unwrap();
      toast.success(value ? 'Arşiv notu güncellendi' : 'Arşiv notu silindi');
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(String(err || 'Arşiv notu güncellenemedi'));
    }
  };

  return (
    <RepairModal
      open={open}
      onClose={onClose}
      title="Arşiv Notunu Düzenle"
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
            {mutating ? 'Kaydediliyor...' : 'Notu Kaydet'}
          </PrimaryButton>
        </>
      }
    >
      <ModalField
        label="Not"
        error={error}
        hint="Boş bırakırsanız not silinir. Kayıt tamir geçmişine işlenir."
      >
        <textarea
          rows={6}
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
            if (error) setError('');
          }}
          placeholder="Arşiv kaydının düzeltilmiş notu..."
          className={error ? errorInputClass : inputClass}
          maxLength={MAX_NOTE_LENGTH}
        />
      </ModalField>

      <p className="mt-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-[11px] text-gray-500">
        Yalnızca yetkili hesap (fyildiz@ustay.com) arşiv notlarını
        düzeltebilir. Değişiklik tamir geçmişine &quot;Arşiv notu
        düzeltildi.&quot; olarak yazılır.
      </p>
    </RepairModal>
  );
}
