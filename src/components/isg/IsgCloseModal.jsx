// src/components/isg/IsgCloseModal.jsx
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { ArrowPathIcon, XMarkIcon } from '@heroicons/react/24/outline';

import RepairModal, {
  PrimaryButton,
  SecondaryButton,
} from '../repair/RepairModal';
import {
  changeIsgStatus,
  uploadIsgAttachment,
} from '../../stores/isg_slice';
import { formatDate } from '../../utils/repair';
import { formatFileSize } from '../../utils/dailyFault';
import {
  ISG_MAX_EVIDENCE_MB,
  evidenceTypeLabel,
  validateEvidenceFile,
} from '../../utils/isg';

/**
 * "Kapalı" seçildiğinde açılan kapanış penceresi (11.3).
 *
 * The PDF/photo field is part of the dialog, so the evidence place appears
 * automatically the moment the status is switched to Kapalı. The file is
 * optional: closing is still possible and the evidence can be added from the
 * table's Kanıt column later.
 */
export default function IsgCloseModal({ open, item, onClose, onSaved }) {
  const dispatch = useDispatch();

  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleFile = (event) => {
    const picked = event.target.files?.[0];
    event.target.value = '';
    if (!picked) return;

    const validationError = validateEvidenceFile(picked);
    if (validationError) {
      setFile(null);
      setError(validationError);
      return;
    }

    setFile(picked);
    setError('');
  };

  const handleSubmit = async () => {
    if (!item || busy) return;

    if (file) {
      const validationError = validateEvidenceFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    setBusy(true);
    try {
      if (file) {
        await dispatch(
          uploadIsgAttachment({ itemId: item.id, file })
        ).unwrap();
      }
      await dispatch(
        changeIsgStatus({ itemId: item.id, status: 'kapali' })
      ).unwrap();

      toast.success(
        file ? 'Uygunsuzluk kanıtla kapatıldı' : 'Uygunsuzluk kapatıldı'
      );
      onSaved?.();
      onClose();
    } catch (err) {
      toast.error(String(err || 'Uygunsuzluk kapatılamadı'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <RepairModal
      open={open}
      onClose={busy ? () => {} : onClose}
      title="Uygunsuzluğu Kapat"
      subtitle={
        item
          ? `${formatDate(item.record_date)} · ${item.territory_name || '—'} · ${
              item.responsible_name || '—'
            }`
          : undefined
      }
      footer={
        <>
          <SecondaryButton onClick={onClose} disabled={busy}>
            Vazgeç
          </SecondaryButton>
          <PrimaryButton
            type="button"
            tone="green"
            onClick={handleSubmit}
            disabled={busy}
          >
            {busy ? 'Kaydediliyor...' : 'Kapat ve Kaydet'}
          </PrimaryButton>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            Açıklama
          </p>
          <p className="mt-1 whitespace-pre-line text-sm text-gray-800">
            {item?.description || '—'}
          </p>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Kapanış Kanıtı (PDF veya Fotoğraf)
          </label>

          {file ? (
            <div className="flex items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
              <span className="min-w-0">
                <span className="block truncate font-medium" title={file.name}>
                  {file.name}
                </span>
                <span className="text-[11px] text-emerald-700">
                  {evidenceTypeLabel(file.type)} · {formatFileSize(file.size)}
                </span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setError('');
                }}
                disabled={busy}
                aria-label="Seçilen kanıtı kaldır"
                className="shrink-0 rounded p-1 text-emerald-800 hover:bg-emerald-100 disabled:opacity-40"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label
              className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 bg-white px-4 py-6 text-xs font-medium text-gray-600 transition hover:border-blue-400 hover:text-blue-700 ${
                busy ? 'pointer-events-none opacity-60' : ''
              }`}
            >
              {busy ? (
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
              ) : null}
              PDF veya fotoğraf seçmek için tıklayın
              <input
                type="file"
                accept=".pdf,application/pdf,image/jpeg,image/png,image/webp"
                className="hidden"
                disabled={busy}
                onChange={handleFile}
              />
            </label>
          )}

          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}

          <p className="mt-1 text-[11px] text-gray-400">
            En fazla {ISG_MAX_EVIDENCE_MB} MB. Kanıt eklemeden de
            kapatabilirsiniz; kanıtı sonra tablodaki Kanıt sütunundan
            ekleyebilirsiniz.
          </p>
        </div>
      </div>
    </RepairModal>
  );
}
