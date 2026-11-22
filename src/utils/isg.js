// src/utils/isg.js

/** Must match MAX_EVIDENCE_BYTES in server/models/isg_model.py. */
export const ISG_MAX_EVIDENCE_MB = 10;

/** Stored status codes — the backend check constraint allows exactly these. */
export const ISG_STATUS_OPTIONS = [
  { code: 'acik', label: 'Açık', color: 'amber' },
  { code: 'kapali', label: 'Kapalı', color: 'emerald' },
];

export const ISG_STATUS_LABELS = {
  acik: 'Açık',
  kapali: 'Kapalı',
};

const PDF_TYPES = new Set(['application/pdf', 'application/x-pdf']);
const IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/pjpeg',
  'image/png',
  'image/webp',
]);

const PDF_EXTENSIONS = ['.pdf'];
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

/**
 * ``'pdf'``, ``'image'`` or ``null``.
 *
 * The extension decides first because Windows often reports an empty MIME type
 * for a local file; an explicit type that contradicts the extension is refused
 * (a ``.pdf`` named ``image/png`` would be rejected by the backend anyway).
 */
export function evidenceKind(file) {
  if (!file) return null;

  const name = (file.name || '').toLowerCase();
  const type = (file.type || '').toLowerCase();

  if (PDF_EXTENSIONS.some((ext) => name.endsWith(ext))) {
    if (!type || PDF_TYPES.has(type) || type === 'application/octet-stream') {
      return 'pdf';
    }
    return null;
  }

  if (IMAGE_EXTENSIONS.some((ext) => name.endsWith(ext))) {
    if (!type || IMAGE_TYPES.has(type) || type === 'application/octet-stream') {
      return 'image';
    }
    return null;
  }

  return null;
}

/** Returns a Turkish error message, or ``null`` when the file is acceptable. */
export function validateEvidenceFile(file) {
  if (!file) return 'Dosya seçin';

  if (!evidenceKind(file)) {
    return 'Sadece PDF veya fotoğraf (JPEG, PNG, WEBP) yükleyebilirsiniz';
  }

  if (!file.size) return 'Boş dosya yüklenemez';

  if (file.size > ISG_MAX_EVIDENCE_MB * 1024 * 1024) {
    return `Kanıt boyutu en fazla ${ISG_MAX_EVIDENCE_MB} MB olabilir`;
  }

  return null;
}

/** ``"PDF"`` / ``"Fotoğraf"`` — the chip label of an attachment. */
export function evidenceTypeLabel(contentTypeOrName) {
  const value = (contentTypeOrName || '').toLowerCase();
  if (value.startsWith('image/')) return 'Fotoğraf';
  if (/\.(jpe?g|png|webp)$/.test(value)) return 'Fotoğraf';
  return 'PDF';
}

/** Local ``YYYY-MM-DD`` (not UTC, so a late-evening save keeps today). */
export function todayIso() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}
