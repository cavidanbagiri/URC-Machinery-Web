// src/utils/warehouse.js
import { formatDate, toNullableText, todayISO } from './repair';
import { UNIT_OPTIONS, formatQuantity, parseQuantity } from './purchaseRequest';

export { UNIT_OPTIONS, formatDate, formatQuantity, parseQuantity };

export const MOVEMENT_IN = 'giris';
export const MOVEMENT_OUT = 'cikis';

export const MOVEMENT_TYPE_OPTIONS = [
  { value: MOVEMENT_IN, label: 'Giriş' },
  { value: MOVEMENT_OUT, label: 'Çıkış' },
];

const MOVEMENT_BADGES = {
  [MOVEMENT_IN]: 'border-emerald-100 bg-emerald-50 text-emerald-700',
  [MOVEMENT_OUT]: 'border-rose-100 bg-rose-50 text-rose-700',
};

export const STOCK_STATUS_LABELS = {
  yeterli: 'Yeterli',
  az: 'Kritik Seviye',
  tukendi: 'Stokta Yok',
};

const STOCK_STATUS_BADGES = {
  yeterli: 'border-emerald-100 bg-emerald-50 text-emerald-700',
  az: 'border-amber-100 bg-amber-50 text-amber-700',
  tukendi: 'border-rose-100 bg-rose-50 text-rose-700',
};

export function stockStatusLabel(status) {
  return STOCK_STATUS_LABELS[status] || status || '—';
}

export function stockStatusBadgeClass(status) {
  return (
    STOCK_STATUS_BADGES[status] || 'border-gray-200 bg-gray-50 text-gray-600'
  );
}

export function movementTypeLabel(type) {
  return type === MOVEMENT_OUT ? 'Çıkış' : 'Giriş';
}

export function movementBadgeClass(type) {
  return MOVEMENT_BADGES[type] || 'border-gray-200 bg-gray-50 text-gray-600';
}

/** Green for entries, red for issues — used by the quantity column. */
export function movementQuantityClass(type) {
  return type === MOVEMENT_OUT ? 'text-rose-600' : 'text-emerald-600';
}

export function movementQuantityPrefix(type) {
  return type === MOVEMENT_OUT ? '−' : '+';
}

/** ``balance`` after a manual movement, used by the modal preview. */
export function previewBalance(item, type, quantity) {
  const amount = parseQuantity(quantity);
  if (amount === null) return null;

  const current = Number(item?.quantity || 0);
  return type === MOVEMENT_OUT ? current - amount : current + amount;
}

// =========================================================
// FORMS
// =========================================================

export function emptyStockForm() {
  return {
    name: '',
    part_number: '',
    unit: 'Adet',
    territory_id: '',
    location: '',
    min_quantity: '0',
    description_tr: '',
    description_ru: '',
    notes: '',
  };
}

export function stockFormFromItem(item) {
  return {
    name: item?.name || '',
    part_number: item?.part_number || '',
    unit: item?.unit || 'Adet',
    territory_id: item?.territory_id ? String(item.territory_id) : '',
    location: item?.location || '',
    min_quantity: item ? String(item.min_quantity ?? 0) : '0',
    description_tr: item?.description_tr || '',
    description_ru: item?.description_ru || '',
    notes: item?.notes || '',
  };
}

export function emptyMovementForm() {
  return {
    quantity: '1',
    movement_date: todayISO(),
    machine: null,
    document_no: '',
    note: '',
  };
}

export function emptyReceiptForm(lines) {
  return {
    movement_date: todayISO(),
    note: '',
    lines: (lines || []).map((line) => ({
      request_item_id: line.request_item_id,
      quantity: String(line.quantity ?? 1),
      row: line,
    })),
  };
}

// =========================================================
// VALIDATION
// =========================================================

export function validateStockForm(form) {
  const errors = {};

  if (!String(form.name || '').trim()) {
    errors.name = 'Malzeme adı zorunludur';
  }
  if (!String(form.unit || '').trim()) {
    errors.unit = 'Birim zorunludur';
  }

  const minQuantity = parseQuantity(form.min_quantity);
  if (minQuantity === null) {
    errors.min_quantity = 'Kritik seviye zorunludur';
  } else if (minQuantity < 0) {
    errors.min_quantity = 'Kritik seviye negatif olamaz';
  }

  return { errors, valid: Object.keys(errors).length === 0 };
}

export function validateMovementForm(form, { direction, item } = {}) {
  const errors = {};

  const quantity = parseQuantity(form.quantity);
  if (quantity === null) {
    errors.quantity = 'Miktar zorunludur';
  } else if (quantity <= 0) {
    errors.quantity = 'Miktar sıfırdan büyük olmalı';
  } else if (
    direction === MOVEMENT_OUT &&
    quantity > Number(item?.quantity || 0)
  ) {
    errors.quantity = `Yetersiz stok: mevcut ${formatQuantity(
      item?.quantity || 0
    )} ${item?.unit || ''}`.trim();
  }

  if (!form.movement_date) errors.movement_date = 'Tarih zorunludur';

  return { errors, valid: Object.keys(errors).length === 0 };
}

export function validateReceiptForm(form) {
  const errors = {};
  const lineErrors = (form.lines || []).map((line) => {
    const quantity = parseQuantity(line.quantity);
    if (quantity === null) return { quantity: 'Miktar zorunludur' };
    if (quantity <= 0) return { quantity: 'Miktar sıfırdan büyük olmalı' };
    return {};
  });

  if (!form.movement_date) errors.movement_date = 'Tarih zorunludur';
  if (!form.lines || form.lines.length === 0) {
    errors.lines = 'En az bir kalem seçin';
  }

  const valid =
    Object.keys(errors).length === 0 &&
    lineErrors.every((row) => Object.keys(row).length === 0);

  return { errors, lineErrors, valid };
}

// =========================================================
// PAYLOADS
// =========================================================

export function buildStockPayload(form) {
  return {
    name: String(form.name).trim(),
    part_number: toNullableText(form.part_number),
    unit: String(form.unit).trim(),
    territory_id: form.territory_id ? Number(form.territory_id) : null,
    location: toNullableText(form.location),
    min_quantity: parseQuantity(form.min_quantity) ?? 0,
    description_tr: toNullableText(form.description_tr),
    description_ru: toNullableText(form.description_ru),
    notes: toNullableText(form.notes),
  };
}

export function buildMovementPayload(form, { direction, item }) {
  return {
    item_id: item.id,
    movement_type: direction,
    quantity: parseQuantity(form.quantity),
    movement_date: form.movement_date,
    machine_id: form.machine?.id ?? null,
    document_no: toNullableText(form.document_no),
    note: toNullableText(form.note),
  };
}

export function buildReceiptPayload(form) {
  return {
    movement_date: form.movement_date,
    note: toNullableText(form.note),
    items: form.lines.map((line) => ({
      request_item_id: line.request_item_id,
      quantity: parseQuantity(line.quantity),
    })),
  };
}
