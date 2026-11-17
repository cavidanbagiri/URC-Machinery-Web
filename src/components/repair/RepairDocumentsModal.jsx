// src/components/repair/RepairDocumentsModal.jsx
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  DocumentPlusIcon,
  DocumentTextIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

import RepairModal, { SecondaryButton } from './RepairModal';
import {
  MAX_DOCUMENT_MB,
  formatDateTime,
  formatFileSize,
  machineLabel,
  validateRepairPdf,
} from '../../utils/repair';

/**
 * PDF papers of one repair. The same dialog is used before and after the
 * repair is closed, so an operator can always attach the invoice later.
 */
export default function RepairDocumentsModal({
  open,
  record,
  busy,
  onClose,
  onUploadDocument,
  onViewDocument,
  onDownloadDocument,
  onDeleteDocument,
}) {
  const documents = record?.documents || [];
  const uploading =
    Boolean(record) &&
    busy?.repairId === record?.id &&
    busy?.action === 'upload';
  const inputId = `repair-document-${record?.id ?? 'new'}`;

  const handlePick = (fileList) => {
    const file = fileList?.[0];
    if (!file) return;
    onUploadDocument?.(record, file, validateRepairPdf(file));
  };

  return (
    <RepairModal
      open={open}
      onClose={onClose}
      title="Tamir Evrakları"
      subtitle={
        record
          ? [machineLabel(record), record.repair_type_name]
              .filter(Boolean)
              .join(' · ')
          : undefined
      }
      footer={<SecondaryButton onClick={onClose}>Kapat</SecondaryButton>}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            PDF Evrak ({documents.length})
          </h3>

          <label
            htmlFor={inputId}
            className={`inline-flex cursor-pointer items-center gap-1 rounded-full border border-dashed border-gray-300 px-2 py-0.5 text-[11px] font-medium text-gray-600 transition hover:border-blue-400 hover:text-blue-700 ${
              uploading ? 'pointer-events-none opacity-60' : ''
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
            id={inputId}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            disabled={uploading}
            onChange={(event) => {
              const files = event.target.files;
              event.target.value = '';
              handlePick(files);
            }}
          />
        </div>

        {documents.length === 0 ? (
          <p className="text-[12px] text-gray-400">
            Bu tamire henüz PDF eklenmemiş. Sadece PDF · en fazla{' '}
            {MAX_DOCUMENT_MB} MB.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {documents.map((document) => {
              const deleting =
                busy?.repairId === record?.id &&
                busy?.action === 'delete' &&
                busy?.documentId === document.id;

              return (
                <li
                  key={document.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2"
                >
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => onViewDocument?.(record, document)}
                      title={`${document.file_name} · Görüntüle`}
                      className="block max-w-[22rem] truncate text-left text-sm font-medium text-blue-700 hover:underline"
                    >
                      {document.file_name}
                    </button>
                    <p className="mt-0.5 text-[11px] text-gray-400">
                      {formatFileSize(document.file_size)}
                      {document.uploaded_by_name
                        ? ` · ${document.uploaded_by_name}`
                        : ''}
                      {document.created_at
                        ? ` · ${formatDateTime(document.created_at)}`
                        : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onViewDocument?.(record, document)}
                      title="Görüntüle"
                      aria-label={`${document.file_name} görüntüle`}
                      className="rounded-lg p-1.5 text-blue-600 transition hover:bg-blue-50"
                    >
                      <DocumentTextIcon className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDownloadDocument?.(record, document)}
                      title="İndir"
                      aria-label={`${document.file_name} indir`}
                      className="rounded-lg p-1.5 text-emerald-600 transition hover:bg-emerald-50"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteDocument?.(record, document)}
                      disabled={deleting}
                      title="Sil"
                      aria-label={`${document.file_name} sil`}
                      className="rounded-lg p-1.5 text-red-600 transition hover:bg-red-50 disabled:opacity-40"
                    >
                      {deleting ? (
                        <ArrowPathIcon className="h-4 w-4 animate-spin" />
                      ) : (
                        <XMarkIcon className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </RepairModal>
  );
}
