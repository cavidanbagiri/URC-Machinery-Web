// src/utils/dailyFault.js

/** Must match MAX_DOCUMENT_BYTES in server/models/daily_fault_model.py. */
export const MAX_DOCUMENT_MB = 10;

export function formatFileSize(bytes) {
  if (bytes === null || bytes === undefined || Number.isNaN(Number(bytes))) {
    return '—';
  }

  const size = Number(bytes);
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Browsers report PDF files as application/pdf, application/x-pdf or (for
 * some Windows setups) application/octet-stream; the backend checks the file
 * signature anyway.
 */
export function isPdfFile(file) {
  if (!file) return false;
  const name = (file.name || '').toLowerCase();
  if (!name.endsWith('.pdf')) return false;

  const type = (file.type || '').toLowerCase();
  return (
    type === '' ||
    type === 'application/pdf' ||
    type === 'application/x-pdf' ||
    type === 'application/octet-stream'
  );
}

export function validatePdfFile(file) {
  if (!isPdfFile(file)) return 'Sadece PDF evrak yükleyebilirsiniz';
  if (file.size > MAX_DOCUMENT_MB * 1024 * 1024) {
    return `Evrak boyutu en fazla ${MAX_DOCUMENT_MB} MB olabilir`;
  }
  if (!file.size) return 'Boş dosya yüklenemez';
  return null;
}
