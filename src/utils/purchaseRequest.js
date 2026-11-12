// src/utils/purchaseRequest.js
import { toNullableText, todayISO } from './repair';

/**
 * The header status says what the request is waiting for and is picked by the
 * user when the request is created. Whether a part actually arrived is tracked
 * per row (``item.is_arrived``) — see `spareArrivalLabel`.
 */
export const SPARE_STATUSES = [
  'onay_bekliyor',
  'odeme_bekliyor',
  'firma_bekleniyor',
];

export const SPARE_STATUS_LABELS = {
  onay_bekliyor: 'Onay Bekliyor',
  odeme_bekliyor: 'Ödeme Bekliyor',
  firma_bekleniyor: 'Firmadan Gelmesi Bekleniyor',
};

const SPARE_STATUS_BADGES = {
  onay_bekliyor: 'border-blue-100 bg-blue-50 text-blue-700',
  odeme_bekliyor: 'border-amber-100 bg-amber-50 text-amber-700',
  firma_bekleniyor: 'border-indigo-100 bg-indigo-50 text-indigo-700',
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

/** "Geldi / Gelmedi" of one part row. */
export const SPARE_ARRIVAL_LABELS = { arrived: 'Geldi', pending: 'Gelmedi' };

export function spareArrivalLabel(isArrived) {
  return isArrived ? SPARE_ARRIVAL_LABELS.arrived : SPARE_ARRIVAL_LABELS.pending;
}

export function spareArrivalBadgeClass(isArrived) {
  return isArrived
    ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
    : 'border-gray-200 bg-gray-50 text-gray-600';
}

/**
 * PDF helpers are shared with the daily fault and tire modules: the same 10 MB
 * limit, the same browser MIME quirks and the same "Sadece PDF" messages.
 */
export {
  MAX_DOCUMENT_MB,
  formatFileSize,
  validatePdfFile as validateSpareDocument,
} from './dailyFault';

/** A new spare-part request opens with a full sheet of rows, Excel style. */
export const SPARE_ITEM_MIN_ROWS = 6;

let rowSequence = 0;

export function emptySpareItem() {
  rowSequence += 1;
  return {
    key: `spare-item-${rowSequence}`,
    id: null,
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

/**
 * Rows that still carry the defaults only (no machine, no text, ``quantity``
 * left at ``1``) are placeholders, so they are skipped by the validation and
 * dropped from the payload instead of blocking the save.
 */
export function isEmptySpareItem(item) {
  if (!item) return true;
  if (item.machine) return false;

  const textKeys = [
    'garage_request_no',
    'part_number',
    'description_ru',
    'description_tr',
    'supply_date',
  ];
  if (textKeys.some((key) => String(item[key] ?? '').trim() !== '')) return false;

  const quantity = String(item.quantity ?? '').trim();
  return quantity === '' || quantity === '1';
}

export function emptySpareForm() {
  return {
    id: null,
    title: '',
    stf_htf_no: '',
    territory_id: '',
    request_type_id: '',
    request_date: todayISO(),
    // The user must pick what the request is waiting for.
    status: '',
    items: Array.from({ length: SPARE_ITEM_MIN_ROWS }, emptySpareItem),
  };
}

/**
 * Turns a saved request (``GET /spare-parts``) back into the form model so the
 * same modal can edit it. Row ids are kept, so the backend updates those rows
 * in place and their "geldi" flag survives the edit.
 */
export function requestToSpareForm(request) {
  const items = (request?.items || []).map((item) => ({
    ...emptySpareItem(),
    id: item.id ?? null,
    machine: item.machine_id
      ? {
          id: item.machine_id,
          identification_no: item.identification_no,
          plate_no: item.plate_no,
          vin_no: item.vin_no,
        }
      : null,
    garage_request_no: item.garage_request_no || '',
    part_number: item.part_number || '',
    description_ru: item.description_ru || '',
    description_tr: item.description_tr || '',
    quantity:
      item.quantity === null || item.quantity === undefined
        ? '1'
        : String(item.quantity),
    unit: item.unit || 'Adet',
    supply_date: item.supply_date || '',
  }));

  return {
    id: request?.id ?? null,
    title: request?.title || '',
    stf_htf_no: request?.stf_htf_no || '',
    territory_id: request?.territory_id ?? '',
    request_type_id: request?.request_type_id ?? '',
    request_date: request?.request_date || todayISO(),
    status: request?.status || '',
    items: items.length > 0 ? items : [emptySpareItem()],
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
  const items = form.items || [];

  if (!String(form.title || '').trim()) {
    errors.title = 'Talep başlığı zorunludur';
  }
  if (!String(form.stf_htf_no || '').trim()) {
    errors.stf_htf_no = 'STF/HTF numarası zorunludur';
  }
  if (!form.territory_id) errors.territory_id = 'Bölge seçin';
  if (!form.request_type_id) errors.request_type_id = 'Talep türü seçin';
  if (!form.request_date) errors.request_date = 'Talep tarihi zorunludur';
  if (!form.status) errors.status = 'Durum seçin (neyi bekliyoruz?)';
  if (items.filter((item) => !isEmptySpareItem(item)).length === 0) {
    errors.items = 'En az bir parça satırı doldurun';
  }

  const itemErrors = items.map((item) => {
    // untouched placeholder rows are not validated
    if (isEmptySpareItem(item)) return {};

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
    items: form.items
      .filter((item) => !isEmptySpareItem(item))
      .map((item) => ({
        // Saved rows keep their id so the arrival flag survives the edit;
        // new rows simply omit it (the create endpoint forbids it).
        ...(item.id ? { id: item.id } : {}),
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
