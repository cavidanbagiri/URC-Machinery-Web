// src/utils/stock.js
// Basit stok modülünün form yardımcıları. Ambar (warehouse) modülünden
// bağımsızdır; yalnızca ortak metin/tarih/sayı yardımcılarını kullanır.
import { formatDate, toNullableText, todayISO } from './repair';
import { UNIT_OPTIONS, formatQuantity, parseQuantity } from './purchaseRequest';

export { UNIT_OPTIONS, formatDate, formatQuantity, parseQuantity, todayISO };

export const EMPTY_SUMMARY = {
  item_count: 0,
  total_quantity: 0,
  out_of_stock_items: 0,
  month_issue_quantity: 0,
  month_issue_count: 0,
};

// =========================================================
// STOCK ITEM FORMS
// =========================================================

export function emptyItemForm() {
  return {
    name: '',
    unit: 'Adet',
    quantity: '0',
    notes: '',
  };
}

export function itemFormFromRow(item) {
  return {
    name: item?.name || '',
    unit: item?.unit || 'Adet',
    quantity: item ? String(item.quantity ?? 0) : '0',
    notes: item?.notes || '',
  };
}

export function validateItemForm(form) {
  const errors = {};

  if (!String(form.name || '').trim()) {
    errors.name = 'Malzeme adı zorunludur';
  }
  if (!String(form.unit || '').trim()) {
    errors.unit = 'Birim zorunludur';
  }

  const quantity = parseQuantity(form.quantity);
  if (quantity === null) {
    errors.quantity = 'Miktar zorunludur';
  } else if (quantity < 0) {
    errors.quantity = 'Miktar negatif olamaz';
  }

  return { errors, valid: Object.keys(errors).length === 0 };
}

export function buildItemPayload(form) {
  return {
    name: String(form.name).trim(),
    unit: String(form.unit).trim(),
    quantity: parseQuantity(form.quantity) ?? 0,
    notes: toNullableText(form.notes),
  };
}

// =========================================================
// ISSUE FORMS ("Sahaya Çıkanlar")
// =========================================================

export function emptyIssueForm(item = null) {
  return {
    stock_item: item || null,
    quantity: '1',
    issue_date: todayISO(),
    machine: null,
    given_to: '',
    note: '',
  };
}

export function validateIssueForm(form) {
  const errors = {};

  if (!form.stock_item?.id) {
    errors.stock_item = 'Malzeme seçin';
  }

  const quantity = parseQuantity(form.quantity);
  if (quantity === null) {
    errors.quantity = 'Miktar zorunludur';
  } else if (quantity <= 0) {
    errors.quantity = 'Miktar sıfırdan büyük olmalı';
  } else if (
    form.stock_item &&
    quantity > Number(form.stock_item.quantity || 0)
  ) {
    errors.quantity = `Yetersiz stok: mevcut ${formatQuantity(
      form.stock_item.quantity || 0
    )} ${form.stock_item.unit || ''}`.trim();
  }

  if (!form.issue_date) errors.issue_date = 'Tarih zorunludur';

  return { errors, valid: Object.keys(errors).length === 0 };
}

export function buildIssuePayload(form) {
  return {
    stock_item_id: form.stock_item.id,
    quantity: parseQuantity(form.quantity),
    issue_date: form.issue_date,
    machine_id: form.machine?.id ?? null,
    given_to: toNullableText(form.given_to),
    note: toNullableText(form.note),
  };
}

/** Kayıt sonrası kartta kalan miktar (modal önizlemesi). */
export function previewIssueBalance(item, quantity) {
  const amount = parseQuantity(quantity);
  if (!item || amount === null) return null;
  return Number(item.quantity || 0) - amount;
}
