// src/utils/purchaseRequest.js
import { machineLabel, toNullableText, todayISO } from './repair';

/**
 * The header status says what the request is waiting for and is picked by the
 * user when the request is created. Whether a part arrived is tracked per row:
 * ``arrived_quantity`` out of ``quantity`` — ``0`` is "Gelmedi", the whole
 * ordered quantity is "Geldi" and anything in between is "Kısmi Geldi".
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

/**
 * Teslim durumu satır bazında üç değerlidir: kaç adet sipariş edildi
 * (``quantity``), kaç adet geldi (``arrived_quantity``) ve kalan miktar
 * (``quantity - arrived_quantity``). "Kısmi Geldi" tam bu aradaki durumdur.
 */
export const SPARE_ARRIVAL_STATES = ['pending', 'partial', 'arrived'];

export const SPARE_ARRIVAL_LABELS = {
  pending: 'Gelmedi',
  partial: 'Kısmi Geldi',
  arrived: 'Geldi',
};

const SPARE_ARRIVAL_BADGES = {
  pending: 'border-gray-200 bg-gray-50 text-gray-600',
  partial: 'border-amber-100 bg-amber-50 text-amber-700',
  arrived: 'border-emerald-100 bg-emerald-50 text-emerald-700',
};

/**
 * Sipariş / gelen / kalan miktarları. Gelen adet siparişi aşamaz; eski
 * kayıtlarda ``arrived_quantity`` yoksa ``is_arrived`` bayrağına düşülür.
 */
export function spareArrivalQuantities(item) {
  const ordered = Math.max(Number(item?.quantity) || 0, 0);
  const rawArrived = Number(
    item?.arrived_quantity ?? (item?.is_arrived ? ordered : 0)
  );
  const arrived = Math.min(
    Math.max(Number.isFinite(rawArrived) ? rawArrived : 0, 0),
    ordered
  );

  return { ordered, arrived, remaining: Math.max(ordered - arrived, 0) };
}

/** Satırın teslim durumu: ``pending`` / ``partial`` / ``arrived``. */
export function spareArrivalState(item) {
  const { ordered, arrived } = spareArrivalQuantities(item);

  if (arrived <= 0) return 'pending';
  return arrived >= ordered ? 'arrived' : 'partial';
}

export function spareArrivalLabel(state) {
  return SPARE_ARRIVAL_LABELS[state] || SPARE_ARRIVAL_LABELS.pending;
}

export function spareArrivalBadgeClass(state) {
  return SPARE_ARRIVAL_BADGES[state] || SPARE_ARRIVAL_BADGES.pending;
}

/**
 * Durum seçildiğinde yazılacak gelen adet: "Geldi" tüm siparişi, "Gelmedi"
 * sıfırı yazar. "Kısmi Geldi" mevcut kısmi değeri korur, yoksa 1 ile başlar;
 * kullanıcı satırdaki "Gelen" alanından düzeltir.
 */
export function arrivalQuantityForState(item, state) {
  const { ordered, arrived } = spareArrivalQuantities(item);

  if (state === 'arrived') return ordered;
  if (state === 'pending') return 0;
  if (arrived > 0 && arrived < ordered) return arrived;
  return Math.min(1, ordered);
}

/**
 * Talebin tamamı için miktar özeti (satırın "Parça" hücresi). Farklı birimler
 * karışmasın diye toplamlar yalnızca tek birim kullanıldığında döner.
 */
export function spareRequestArrivalSummary(request) {
  const summary = {
    ordered: 0,
    arrived: 0,
    remaining: 0,
    partial: 0,
    complete: 0,
    unit: '',
  };
  const units = new Set();

  for (const item of request?.items || []) {
    const { ordered, arrived, remaining } = spareArrivalQuantities(item);
    summary.ordered += ordered;
    summary.arrived += arrived;
    summary.remaining += remaining;
    units.add(String(item.unit || '').trim());

    const state = spareArrivalState(item);
    if (state === 'partial') summary.partial += 1;
    if (state === 'arrived') summary.complete += 1;
  }

  summary.unit = units.size === 1 ? [...units][0] : '';
  return summary;
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
    // ``machine_no`` is the "Makine ID No" typed by hand ("1042, 1043"),
    // because the same part often goes to several machines. ``machine_id`` is
    // kept only for rows that were saved with a machine from the old picker,
    // so editing such a request keeps its warehouse link.
    machine_id: null,
    machine_no: '',
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
  if (item.machine_id) return false;

  const textKeys = [
    'machine_no',
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

/** "ID No" of one part row: the typed numbers win over the linked machine. */
export function spareItemMachineLabel(item) {
  const typed = String(item?.machine_no ?? '').trim();
  if (typed) return typed;

  const hasMachine =
    item?.machine_id ||
    item?.identification_no ||
    item?.plate_no ||
    item?.vin_no;
  return hasMachine ? machineLabel(item) : '';
}

/**
 * How many distinct machines a saved request covers. A row may carry several
 * numbers typed by hand ("1042, 1043"), so they are split and de-duplicated;
 * rows saved with the old picker fall back to their linked machine.
 */
export function spareRequestMachineCount(request) {
  const seen = new Set();

  for (const item of request?.items || []) {
    const typed = String(item?.machine_no ?? '').trim();
    if (typed) {
      typed
        .split(/[\s,;/]+/)
        .filter(Boolean)
        .forEach((number) => seen.add(`no:${number.toLowerCase()}`));
      continue;
    }

    const label = spareItemMachineLabel(item);
    if (!label) continue;
    seen.add(item?.machine_id ? `id:${item.machine_id}` : `label:${label}`);
  }

  // Requests saved before the hand-typed numbers only had ``machine_labels``.
  if (seen.size === 0) {
    return (request?.machine_labels || []).length;
  }
  return seen.size;
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
    // Old rows keep the machine they were saved with; the form shows its
    // number as the starting value of the hand-typed "Makine ID No".
    machine_id: item.machine_id ?? null,
    machine_no:
      item.machine_no ||
      item.identification_no ||
      item.plate_no ||
      item.vin_no ||
      '',
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

    if (!item.machine_id && !String(item.machine_no || '').trim()) {
      rowErrors.machine_no = 'Makine ID No girin';
    }

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
        // ``machine_id`` only survives for rows that were saved with a machine
        // picked from the old list; ``machine_no`` carries the typed numbers.
        machine_id: item.machine_id || null,
        machine_no: toNullableText(item.machine_no),
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
