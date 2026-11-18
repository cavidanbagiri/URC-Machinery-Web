// src/utils/numberInput.js
//
// Table inputs accept both Turkish (``1.234,56``) and plain (``1234.56``)
// decimal notation.  The helpers are shared by the KM / engine-hour and fuel
// distribution tables so both pages behave the same way.

/** Decimal inputunu sayıya çevirir; 1.234,56 ve 1234.56 desteklenir. */
export function parseDecimalInput(value) {
  if (value === null || value === undefined) return null;

  const raw = String(value).trim().replace(/\s/g, '');
  if (!raw) return null;

  let normalized = raw;
  if (raw.includes(',') && raw.includes('.')) {
    // Son ayırıcı ondalık kabul edilir: 1.234,56 → 1234.56
    normalized =
      raw.lastIndexOf(',') > raw.lastIndexOf('.')
        ? raw.replace(/\./g, '').replace(',', '.')
        : raw.replace(/,/g, '');
  } else if (raw.includes(',')) {
    normalized = raw.replace(',', '.');
  }

  if (!/^\d+(\.\d+)?$/.test(normalized)) return null;

  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

export function formatInputValue(value) {
  if (value === null || value === undefined) return '';
  return String(value);
}
