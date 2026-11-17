// src/components/repair/RepairCloseModal.jsx
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import {
  ArrowPathIcon,
  DocumentPlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

import StatusBadge from '../machines/StatusBadge';
import RepairModal, {
  ModalField,
  PrimaryButton,
  SecondaryButton,
  errorInputClass,
  inputClass,
} from './RepairModal';
import {
  closeRepair,
  uploadRepairDocument,
} from '../../stores/repair_slice';
import {
  MAX_DOCUMENT_MB,
  formatDate,
  formatFileSize,
  toNullableText,
  todayISO,
  validateRepairPdf,
} from '../../utils/repair';

export default function RepairCloseModal({ open, onClose, record, onSaved }) {
  const dispatch = useDispatch();
  const mutating = useSelector((s) => s.repair.mutating);

  const [form, setForm] = useState({ exit_date: todayISO(), notes: '' });
  const [errors, setErrors] = useState({});
  // PDFs chosen in this dialog; uploaded right after the repair is closed
  // because ``POST /close`` only accepts dates/notes.
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);

  const busy = mutating || uploading;
  const existingDocuments = record?.documents || [];

  const addDocuments = (fileList) => {
    const picked = Array.from(fileList || []);
    if (!picked.length) return;

    const rejected = [];
    const accepted = [];

    picked.forEach((file) => {
      const validationError = validateRepairPdf(file);
      if (validationError) rejected.push(`${file.name}: ${validationError}`);
      else accepted.push(file);
    });

    if (accepted.length) setDocuments((prev) => [...prev, ...accepted]);
    if (rejected.length) {
      toast.error(
        rejected.length === 1
          ? rejected[0]
          : `${rejected.length} dosya eklenemedi. ${rejected[0]}`
      );
    }
  };

  const removeDocument = (index) => {
    setDocuments((prev) => prev.filter((_, position) => position !== index));
  };

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
    } catch (err) {
      toast.error(String(err || 'Tamir tamamlanamadı'));
      return;
    }

    // The repair is closed now; a failed PDF must not look like a failed close.
    const failed = [];
    if (documents.length) {
      setUploading(true);
      for (const file of documents) {
        try {
          await dispatch(
            uploadRepairDocument({ repairId: record.id, file })
          ).unwrap();
        } catch (err) {
          failed.push(`${file.name}: ${String(err || 'Evrak yüklenemedi')}`);
        }
      }
      setUploading(false);
    }

    if (failed.length) {
      toast.error(
        `Tamir kapatıldı ancak ${failed.length} evrak yüklenemedi. ${failed[0]}`
      );
    } else if (documents.length) {
      toast.success(`Tamir tamamlandı · ${documents.length} evrak eklendi`);
    } else {
      toast.success('Tamir tamamlandı olarak kaydedildi');
    }

    onSaved?.();
    onClose();
  };

  const fileInputId = `repair-close-document-${record?.id ?? 'new'}`;

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
          <SecondaryButton onClick={onClose} disabled={busy}>
            Vazgeç
          </SecondaryButton>
          <PrimaryButton
            type="button"
            onClick={handleSubmit}
            disabled={busy}
            tone="green"
          >
            {uploading
              ? 'Evraklar yükleniyor...'
              : mutating
                ? 'Kaydediliyor...'
                : 'Tamiri Tamamla'}
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

        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              PDF Evrak
            </h3>
            <span className="text-[11px] text-gray-400">
              Sadece PDF · en fazla {MAX_DOCUMENT_MB} MB
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {documents.map((file, index) => (
              <span
                key={`${file.name}-${file.size}-${index}`}
                className="inline-flex max-w-full items-center gap-1 rounded-full border border-blue-100 bg-blue-50 py-0.5 pl-2 pr-1 text-[11px] text-blue-800"
              >
                <span className="max-w-[14rem] truncate" title={file.name}>
                  {file.name}
                </span>
                <span className="text-[10px] text-blue-500">
                  {formatFileSize(file.size)}
                </span>
                <button
                  type="button"
                  onClick={() => removeDocument(index)}
                  disabled={busy}
                  title="Listeden çıkar"
                  aria-label={`${file.name} çıkar`}
                  className="rounded p-0.5 text-red-600 hover:bg-red-100 disabled:opacity-40"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            ))}

            <label
              htmlFor={fileInputId}
              className={`inline-flex cursor-pointer items-center gap-1 rounded-full border border-dashed border-gray-300 px-2 py-0.5 text-[11px] font-medium text-gray-600 transition hover:border-blue-400 hover:text-blue-700 ${
                busy ? 'pointer-events-none opacity-60' : ''
              }`}
            >
              {uploading ? (
                <ArrowPathIcon className="h-3 w-3 animate-spin" />
              ) : (
                <DocumentPlusIcon className="h-3.5 w-3.5" />
              )}
              {uploading ? 'Yükleniyor...' : 'PDF ekle'}
            </label>
            <input
              id={fileInputId}
              type="file"
              accept="application/pdf,.pdf"
              multiple
              className="hidden"
              disabled={busy}
              onChange={(event) => {
                const files = event.target.files;
                event.target.value = '';
                addDocuments(files);
              }}
            />
          </div>

          <p className="mt-1 text-[11px] text-gray-400">
            {documents.length === 0
              ? 'Fatura, iş emri gibi evrakları PDF olarak ekleyebilirsiniz; tamir kapatıldıktan sonra yüklenir.'
              : `${documents.length} evrak tamir kapatıldığında yüklenecek.`}
          </p>

          {existingDocuments.length > 0 && (
            <p className="mt-1 text-[11px] text-gray-400">
              Bu tamirde zaten {existingDocuments.length} kayıtlı evrak var:
              evrak simgesinden görüntüleyebilirsiniz.
            </p>
          )}
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
