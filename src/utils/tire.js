// src/utils/tire.js

/**
 * Tire positions are no longer hard-coded: they come from the Settings lookup
 * (`tire_position` in `stores/lookup_slice.js`, backed by the `tire_positions`
 * table and managed in Ayarlar → Lastik Konumu). The record column stays free
 * text, so the form still accepts a custom value.
 */

/** Frequently typed reasons; "Değişim sebebi" stays free text as well. */
export const TIRE_CHANGE_REASONS = [
  'Patladı',
  'Aşınma (diş derinliği limiti)',
  'Yanak yarığı',
  'Balon / şişme',
  'Kullanım ömrü tamamlandı',
  'Mevsimsel değişim',
  'Jant hasarı',
  'Rotasyon',
];

/**
 * PDF helpers are shared with the daily fault module: the same 10 MB limit,
 * the same browser MIME quirks and the same "Sadece PDF" messages.
 */
export {
  MAX_DOCUMENT_MB,
  formatFileSize,
  validatePdfFile as validateTirePdf,
} from './dailyFault';

/** "Sol Ön · Michelin XZL · 315/80 R22.5" — empty parts are skipped. */
export function tireSpecLabel(item) {
  if (!item) return '—';
  const parts = [item.brand_model, item.size].filter(Boolean);
  return parts.length ? parts.join(' · ') : '—';
}
