// src/utils/machineStatus.js
// Machine statuses are operator-managed Turkish labels (Aktif, Bakımda, Hurda,
// Arızalı) and the Settings page lets an admin rename them, so the UI compares
// normalised names instead of one exact string. Mirrors the backend helper in
// server/repositories/car_status_lookup.py.

const FOLD_MAP = {
  ç: 'c',
  Ç: 'c',
  ğ: 'g',
  Ğ: 'g',
  ı: 'i',
  İ: 'i',
  I: 'i',
  ö: 'o',
  Ö: 'o',
  ş: 's',
  Ş: 's',
  ü: 'u',
  Ü: 'u',
  ə: 'e',
  Ə: 'e',
};

// Labels that mean "the machine is under repair": the current Turkish label and
// the legacy seed value.
export const REPAIR_STATUS_ALIASES = [
  'arizali',
  'tamirde',
  'tamirda',
  'temirde',
];

/** Fold a status name so "Arızalı", "ARIZALI" and "arizali " all match. */
export function normalizeStatusName(name) {
  if (!name) return '';

  return String(name)
    .trim()
    .split('')
    .map((char) => FOLD_MAP[char] ?? char)
    .join('')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** True when the label belongs to the "under repair" machine status. */
export function isRepairStatusName(name) {
  return REPAIR_STATUS_ALIASES.includes(normalizeStatusName(name));
}
