// src/utils/maintenance.js

export const UNIT_LABELS = {
  km: 'km',
  hour: 'saat',
};

const numberFormatter = new Intl.NumberFormat('tr-TR', {
  maximumFractionDigits: 2,
});

export function unitLabel(unit) {
  return UNIT_LABELS[unit] || unit || '';
}

export function formatNumber(value) {
  if (value === null || value === undefined || value === '') return '—';
  const number = Number(value);
  if (Number.isNaN(number)) return '—';
  return numberFormatter.format(number);
}

export function formatCounter(value, unit) {
  if (value === null || value === undefined || value === '') return '—';
  const label = unitLabel(unit);
  return `${formatNumber(value)}${label ? ` ${label}` : ''}`;
}

export function formatDate(value) {
  if (!value) return '—';
  try {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [year, month, day] = value.split('-').map(Number);
      return new Date(year, month - 1, day).toLocaleDateString('tr-TR');
    }
    return new Date(value).toLocaleDateString('tr-TR');
  } catch {
    return value;
  }
}

export function formatDateTime(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return value;
  }
}

/** Bugünün yerel tarihini `YYYY-MM-DD` formatında qaytarır. */
export function todayISO() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

/** `null`/boş string-i `null`-a, ədədi isə Number-a çevirir. */
export function toNullableNumber(value) {
  if (value === '' || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isNaN(number) ? null : number;
}

/** `null`/boş string-i `null`-a çevirir. */
export function toNullableText(value) {
  if (value === '' || value === null || value === undefined) return null;
  return String(value).trim() || null;
}
