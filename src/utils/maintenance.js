// src/utils/maintenance.js

/**
 * PDF helpers are shared with the daily fault, repair and tire modules: the
 * same 10 MB limit, the same browser MIME quirks and the same "Sadece PDF"
 * messages.
 */
export {
  MAX_DOCUMENT_MB,
  formatFileSize,
  validatePdfFile as validateMaintenancePdf,
} from './dailyFault';

export const UNIT_LABELS = {
  km: 'km',
  hour: 'saat',
};

// Maintenance packages offered at completion. The backend validates the same
// lists in `repositories/maintenance_repository.py`.
export const MAINTENANCE_INTERVAL_OPTIONS = {
  km: [10_000, 20_000, 30_000, 40_000],
  hour: [500, 1_000, 2_000, 4_000],
};

// Short explanations for the hourly packages. They describe the work scope,
// not a separate schedule: the plan interval still drives the next due date.
export const MAINTENANCE_INTERVAL_HINTS = {
  hour: {
    500: 'Filtre değişimi',
    1_000: 'Filtre + şanzıman yağı',
    2_000: 'Genişletilmiş bakım',
    4_000: 'Kapsamlı bakım',
  },
};

export function maintenanceIntervalOptions(unit) {
  return MAINTENANCE_INTERVAL_OPTIONS[unit] || [];
}

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
