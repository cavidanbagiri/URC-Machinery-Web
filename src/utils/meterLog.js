// src/utils/meterLog.js
//
// Yardımcılar "Güncel KM ve Motor Saatleri" tablosu içindir.  Bir güne ait
// birden fazla kayıt olabilir; bu durumda o günün **son** kaydı güncel değer
// kabul edilir.  Eski kayıtlar silinmez, haftalık matriste "+N" olarak görünür.

import { formatDate } from './maintenance';

export { parseDecimalInput, formatInputValue } from './numberInput';

const WEEKDAY_LABELS = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
const MONTH_LABELS = [
  'Oca',
  'Şub',
  'Mar',
  'Nis',
  'May',
  'Haz',
  'Tem',
  'Ağu',
  'Eyl',
  'Eki',
  'Kas',
  'Ara',
];

function parseISODate(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function toISODate(value) {
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${value.getFullYear()}-${month}-${day}`;
}

/** Secilen gunden geriye/ileriye dogru gun listesi (timezone-safe). */
export function buildDateRange(startISO, days = 7) {
  const start = parseISODate(startISO);
  if (!start) return [];

  return Array.from({ length: days }, (_, index) => {
    const current = new Date(start);
    current.setDate(start.getDate() + index);

    return {
      iso: toISODate(current),
      day: String(current.getDate()).padStart(2, '0'),
      month: MONTH_LABELS[current.getMonth()],
      weekday: WEEKDAY_LABELS[current.getDay()],
      label: formatDate(toISODate(current)),
    };
  });
}

/**
 * Kayıtları `log_date`e göre gruplar; her grupta en son kaydı `latest` olarak
 * tutar.  Sıralama tarih → oluşturulma zamanı → id şeklindedir.
 */
export function groupLogsByDate(logs = []) {
  const groups = new Map();

  for (const log of logs) {
    if (!log?.log_date) continue;

    const current = groups.get(log.log_date) || { latest: null, count: 0 };
    current.count += 1;

    if (!current.latest || isNewer(log, current.latest)) {
      current.latest = log;
    }

    groups.set(log.log_date, current);
  }

  return groups;
}

function isNewer(candidate, current) {
  const createdDiff =
    new Date(candidate.created_at || 0).getTime() -
    new Date(current.created_at || 0).getTime();

  if (createdDiff !== 0) return createdDiff > 0;
  return (candidate.id || 0) > (current.id || 0);
}

/** Bir makinenin belirli bir gündeki son kaydını döndürür. */
export function latestEntryForDate(machine, dateISO) {
  const group = groupLogsByDate(machine?.recent_logs).get(dateISO);
  return group?.latest || null;
}
