// src/utils/purchaseRequest.js
import { toNullableText, todayISO } from './repair';

export const SPARE_STATUSES = ['bekleniyor', 'geldi'];

export const SPARE_STATUS_LABELS = {
  bekleniyor: 'Bekleniyor',
  geldi: 'Geldi',
};

const SPARE_STATUS_BADGES = {
  bekleniyor: 'border-amber-100 bg-amber-50 text-amber-700',
  geldi: 'border-emerald-100 bg-emerald-50 text-emerald-700',
};

export const UNIT_OPTIONS = [
  'Adet',
  'Takım',
  'Kg',
  'Litre',
  'Metre',
  'Kutu',
  'Paket',
  'Rulo',
  'Hizmet',
];

export function spareStatusLabel(status) {
  return SPARE_STATUS_LABELS[status] || status || '—';
}

export function spareStatusBadgeClass(status) {
  return SPARE_STATUS_BADGES[status] || 'border-gray-200 bg-gray-50 text-gray-600';
}

/** The status button always flips the request to the other state. */
export function nextSpareStatus(status) {
  return status === 'geldi' ? 'bekleniyor' : 'geldi';
}

let rowSequence = 0;

export function emptySpareItem() {
  rowSequence += 1;
  return {
    key: `spare-item-${rowSequence}`,
    machine: null,
    garage_request_no: '',
    part_number: '',
    description_ru: '',
    description_tr: '',
    quantity: '1',
    unit: 'Adet',
    supply_date: '',
  };
}

export function emptySpareForm() {
  return {
    title: '',
    stf_htf_no: '',
    territory_id: '',
    request_type_id: '',
    request_date: todayISO(),
    status: 'bekleniyor',
    items: [emptySpareItem()],
  };
}

export function emptyServiceForm() {
  return {
    title: '',
    service_form_no: '',
    machine: null,
    company_name: '',
    service_description: '',
    request_date: todayISO(),
  };
}

/** Quantity inputs accept both ``12,5`` and ``12.5``. */
export function parseQuantity(value) {
  const text = String(value ?? '')
    .trim()
    .replace(',', '.');
  if (!text) return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatQuantity(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return value ?? '—';
  return parsed.toLocaleString('tr-TR', { maximumFractionDigits: 3 });
}

export function validateSpareForm(form) {
  const errors = {};

  if (!String(form.title || '').trim()) {
    errors.title = 'Talep başlığı zorunludur';
  }
  if (!String(form.stf_htf_no || '').trim()) {
    errors.stf_htf_no = 'STF/HTF numarası zorunludur';
  }
  if (!form.territory_id) errors.territory_id = 'Bölge seçin';
  if (!form.request_type_id) errors.request_type_id = 'Talep türü seçin';
  if (!form.request_date) errors.request_date = 'Talep tarihi zorunludur';
  if (!form.items || form.items.length === 0) {
    errors.items = 'En az bir parça satırı ekleyin';
  }

  const itemErrors = (form.items || []).map((item) => {
    const rowErrors = {};

    if (!item.machine) rowErrors.machine = 'Makine seçin';

    const quantity = parseQuantity(item.quantity);
    if (quantity === null) {
      rowErrors.quantity = 'Miktar zorunludur';
    } else if (quantity <= 0) {
      rowErrors.quantity = 'Miktar sıfırdan büyük olmalı';
    }

    if (!String(item.unit || '').trim()) rowErrors.unit = 'Birim zorunludur';

    return rowErrors;
  });

  const valid =
    Object.keys(errors).length === 0 &&
    itemErrors.every((row) => Object.keys(row).length === 0);

  return { errors, itemErrors, valid };
}

export function validateServiceForm(form) {
  const errors = {};

  if (!String(form.title || '').trim()) {
    errors.title = 'Servis form başlığı zorunludur';
  }
  if (!String(form.service_form_no || '').trim()) {
    errors.service_form_no = 'Servis form numarası zorunludur';
  }
  if (!form.machine) errors.machine = 'Makine seçin';
  if (!String(form.company_name || '').trim()) {
    errors.company_name = 'Hizmet alınacak firma zorunludur';
  }
  if (!String(form.service_description || '').trim()) {
    errors.service_description = 'Hizmet tanımı zorunludur';
  }
  if (!form.request_date) errors.request_date = 'Talep tarihi zorunludur';

  return { errors, valid: Object.keys(errors).length === 0 };
}

export function buildSparePayload(form) {
  return {
    title: String(form.title).trim(),
    stf_htf_no: String(form.stf_htf_no).trim(),
    territory_id: Number(form.territory_id),
    request_type_id: Number(form.request_type_id),
    request_date: form.request_date,
    status: form.status,
    items: form.items.map((item) => ({
      machine_id: item.machine?.id,
      garage_request_no: toNullableText(item.garage_request_no),
      part_number: toNullableText(item.part_number),
      description_ru: toNullableText(item.description_ru),
      description_tr: toNullableText(item.description_tr),
      quantity: parseQuantity(item.quantity),
      unit: String(item.unit).trim(),
      supply_date: toNullableText(item.supply_date),
    })),
  };
}

export function buildServicePayload(form) {
  return {
    title: String(form.title).trim(),
    service_form_no: String(form.service_form_no).trim(),
    machine_id: form.machine?.id,
    company_name: String(form.company_name).trim(),
    service_description: String(form.service_description).trim(),
    request_date: form.request_date,
  };
}
