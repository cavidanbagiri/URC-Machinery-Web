// src/utils/tire.js

/**
 * Positions offered while creating a record. The column is free text on the
 * server (cranes and trucks need different names), so the operator can always
 * type a custom position instead of picking one of these.
 */
export const TIRE_POSITIONS = [
  'Sol Ön',
  'Sağ Ön',
  'Sol Arka 1',
  'Sağ Arka 1',
  'Sol Arka 2',
  'Sağ Arka 2',
  'Sol Orta',
  'Sağ Orta',
  'Yedek Lastik',
];

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
