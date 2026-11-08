// src/utils/filters.js
// Sütun filtrelerinin (components/ui/ColumnFilter) ortak yardımcıları.

/**
 * Filtre gerçekten dolu mu? Boş string / null / undefined = filtre yok.
 */
export function isFilterFilled(value) {
  return value !== '' && value !== null && value !== undefined;
}

/**
 * Verilen anahtarlardan en az biri dolu mu? (tarih aralığı gibi çok anahtarlı
 * filtrelerde kolon başlığının "aktif" görünmesi için kullanılır.)
 */
export function hasAnyFilter(values, keys = []) {
  return keys.some((key) => isFilterFilled(values?.[key]));
}
