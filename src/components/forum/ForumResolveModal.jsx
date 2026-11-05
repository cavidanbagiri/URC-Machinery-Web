// src/components/forum/ForumResolveModal.jsx
import { useState } from 'react';

import RepairModal, {
  ModalField,
  PrimaryButton,
  SecondaryButton,
  inputClass,
} from '../repair/RepairModal';
import { MAX_RESOLUTION_LENGTH } from '../../utils/forum';

/**
 * "Çözüldü olarak işaretle" — captures how the problem was solved. The page
 * remounts this modal per topic (``key``), so the note starts empty.
 */
export default function ForumResolveModal({
  open,
  topic,
  busy = false,
  onClose,
  onConfirm,
}) {
  const [note, setNote] = useState('');

  return (
    <RepairModal
      open={open}
      onClose={onClose}
      title="Konuyu çözüldü olarak kapat"
      subtitle={topic?.title}
      footer={
        <>
          <SecondaryButton onClick={onClose} disabled={busy}>
            Vazgeç
          </SecondaryButton>
          <PrimaryButton
            type="button"
            tone="green"
            onClick={() => onConfirm?.(note.trim() || null)}
            disabled={busy}
          >
            {busy ? 'Kapatılıyor...' : 'Konuyu Kapat'}
          </PrimaryButton>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
          Konu kapatıldığında yeni yorum ve fotoğraf eklenemez. Gerekirse daha
          sonra yeniden açabilirsiniz.
        </div>

        <ModalField
          label="Çözüm notu"
          hint="Nasıl çözüldü? Örn. yedek lastik takıldı, araç sahaya döndü."
        >
          <textarea
            rows={4}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Yapılan işlem, kullanılan parça veya sonuç..."
            className={inputClass}
            maxLength={MAX_RESOLUTION_LENGTH}
          />
        </ModalField>
      </div>
    </RepairModal>
  );
}
