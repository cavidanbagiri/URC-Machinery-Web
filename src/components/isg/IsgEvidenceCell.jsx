// src/components/isg/IsgEvidenceCell.jsx
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  DocumentPlusIcon,
  PhotoIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

import { formatFileSize } from '../../utils/dailyFault';
import { evidenceTypeLabel } from '../../utils/isg';

/** One chip per attachment: view, download and remove. */
function AttachmentChip({ item, attachment, busy, onView, onDownload, onDelete }) {
  const deleting =
    busy?.action === 'delete' && busy?.attachmentId === attachment.id;
  const isImage = attachment.is_image;

  return (
    <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-blue-100 bg-blue-50 py-0.5 pl-2 pr-1 text-[11px] text-blue-800">
      {isImage ? (
        <PhotoIcon className="h-3 w-3 shrink-0" />
      ) : (
        <DocumentPlusIcon className="h-3 w-3 shrink-0" />
      )}

      <button
        type="button"
        onClick={() => onView(item, attachment)}
        title={`${attachment.file_name} · ${evidenceTypeLabel(
          attachment.content_type
        )} · ${formatFileSize(attachment.file_size)} · Görüntüle`}
        className="max-w-[9rem] truncate hover:underline"
      >
        {attachment.file_name}
      </button>

      <button
        type="button"
        onClick={() => onDownload(item, attachment)}
        title="Kanıtı indir"
        aria-label={`${attachment.file_name} indir`}
        className="rounded p-0.5 hover:bg-blue-100"
      >
        <ArrowDownTrayIcon className="h-3 w-3" />
      </button>

      <button
        type="button"
        onClick={() => onDelete(item, attachment)}
        disabled={deleting}
        title="Kanıtı sil"
        aria-label={`${attachment.file_name} sil`}
        className="rounded p-0.5 text-red-600 hover:bg-red-100 disabled:opacity-40"
      >
        {deleting ? (
          <ArrowPathIcon className="h-3 w-3 animate-spin" />
        ) : (
          <XMarkIcon className="h-3 w-3" />
        )}
      </button>
    </span>
  );
}

/**
 * "Kanıt" column of the table (11.3).
 *
 * A closed nonconformity without evidence shows a highlighted
 * "Kapanış kanıtı ekle" label so the missing PDF/photo is impossible to miss;
 * an open one gets the quieter "Kanıt ekle". The file picker accepts a PDF or
 * a photo and the page validates it before uploading.
 */
export default function IsgEvidenceCell({
  item,
  busy,
  onUpload,
  onView,
  onDownload,
  onDelete,
}) {
  const uploading = busy?.action === 'upload' && busy?.itemId === item.id;
  const attachments = item.attachments || [];
  const missingForClosure =
    item.status === 'kapali' && attachments.length === 0;
  const inputId = `isg-evidence-${item.id}`;

  return (
    <div className="flex min-w-[13rem] flex-wrap items-center gap-1.5">
      {attachments.map((attachment) => (
        <AttachmentChip
          key={attachment.id}
          item={item}
          attachment={attachment}
          busy={busy}
          onView={onView}
          onDownload={onDownload}
          onDelete={onDelete}
        />
      ))}

      <label
        htmlFor={inputId}
        className={`inline-flex cursor-pointer items-center gap-1 rounded-full border border-dashed px-2 py-0.5 text-[11px] font-medium transition ${
          missingForClosure
            ? 'border-amber-400 bg-amber-50 text-amber-800 hover:border-amber-500 hover:bg-amber-100'
            : 'border-slate-300 text-slate-600 hover:border-blue-400 hover:text-blue-700'
        } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
      >
        {uploading ? (
          <ArrowPathIcon className="h-3 w-3 animate-spin" />
        ) : (
          <DocumentPlusIcon className="h-3.5 w-3.5" />
        )}
        {uploading
          ? 'Yükleniyor...'
          : missingForClosure
            ? 'Kapanış kanıtı ekle'
            : 'Kanıt ekle'}
      </label>

      <input
        id={inputId}
        type="file"
        accept=".pdf,application/pdf,image/jpeg,image/png,image/webp"
        className="hidden"
        disabled={uploading}
        onChange={(event) => {
          const file = event.target.files?.[0];
          // Reset so picking the same file twice still fires onChange.
          event.target.value = '';
          if (file) onUpload(item, file);
        }}
      />
    </div>
  );
}
