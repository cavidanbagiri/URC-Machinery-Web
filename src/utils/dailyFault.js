// src/utils/dailyFault.js

/** Must match MAX_DOCUMENT_BYTES in server/models/daily_fault_model.py. */
export const MAX_DOCUMENT_MB = 10;

/**
 * Units offered for the "Değişen Parça" quantity. The backend keeps the value
 * as free text (``changed_part_unit``, max 20 chars), so new units can be added
 * here without a migration.
 */
export const CHANGED_PART_UNITS = ['Adet', 'Mt', 'Ton', 'Litre'];

/** Quantities accept both ``3,2`` and ``3.2``; a blank field means "not given". */
export function parsePartQuantity(value) {
  const text = String(value ?? '')
    .trim()
    .replace(',', '.');
  if (!text) return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : NaN;
}

export function formatPartQuantity(value) {
  if (value === null || value === undefined || String(value).trim() === '') {
    return '';
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return String(value);
  return parsed.toLocaleString('tr-TR', { maximumFractionDigits: 3 });
}

/**
 * The structured part of a fault as one line: ``315/80 R22.5 · 3,2 Adet``.
 * Returns ``''`` when neither a part number nor a quantity was recorded.
 */
export function changedPartLabel(item) {
  const partNo = String(item?.changed_part_no ?? '').trim();
  const quantity = item?.changed_part_quantity;
  const unit = String(item?.changed_part_unit ?? '').trim();

  const amount =
    quantity === null || quantity === undefined || quantity === ''
      ? ''
      : [formatPartQuantity(quantity), unit].filter(Boolean).join(' ');

  return [partNo, amount].filter(Boolean).join(' · ');
}

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
