// src/utils/documentTracking.js

// Keep this list in the same order as the table columns and the backend
// DOCUMENT_DATE_FIELDS tuple.
export const DOCUMENT_DATE_FIELDS = [
  'compulsory_traffic_insurance_date',
  'inspection_end_date',
  'passenger_transport_license_date',
  'partial_technical_inspection_date',
  'full_technical_inspection_date',
  'hazardous_production_facility_date',
  'leasing_date',
  'equipment_control_date',
];

export const DOCUMENT_DATE_LABELS = {
  compulsory_traffic_insurance_date: 'Zorunlu Trafik Sigortası / ОСАГО',
  inspection_end_date: 'Muayene / Тех.осмотр',
  passenger_transport_license_date: 'Yolcu Taşıma Lisansı / Лицензия',
  partial_technical_inspection_date: 'Kısmi Teknik Muayene / ЧТО',
  full_technical_inspection_date: 'Tam Teknik Muayene / ПТО',
  hazardous_production_facility_date: 'Kaldırma Ekipmanları Sigortası / ОПО',
  leasing_date: 'Lizing',
  equipment_control_date: 'Metan Gazı Kontrolu / Проверка Газ метана',
};

function parseDateOnly(value) {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    const parsed = new Date(year, month - 1, day);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatDate(value) {
  const parsed = parseDateOnly(value);
  return parsed ? parsed.toLocaleDateString('tr-TR') : '—';
}

/** Red for expired, amber for the next 30 days, gray for an empty date. */
export function dateToneClass(value) {
  const parsed = parseDateOnly(value);
  if (!parsed) return 'text-gray-400';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (parsed < today) return 'font-medium text-red-600';

  const soon = new Date(today);
  soon.setDate(soon.getDate() + 30);
  if (parsed <= soon) return 'font-medium text-amber-600';

  return 'text-gray-700';
}

export function dateToneTitle(value) {
  const parsed = parseDateOnly(value);
  if (!parsed) return 'Tarih girilmedi';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (parsed < today) return 'Süresi geçmiş';

  const soon = new Date(today);
  soon.setDate(soon.getDate() + 30);
  if (parsed <= soon) return '30 gün içinde doluyor';

  return formatDate(value);
}

/** Display row -> `YYYY-MM-DD` strings for the date inputs. */
export function draftFromItem(item) {
  const draft = {};
  for (const field of DOCUMENT_DATE_FIELDS) {
    draft[field] = item?.[field] || '';
  }
  return draft;
}

/** Input values -> API payload; an empty input clears the stored date. */
export function payloadFromDraft(draft) {
  const payload = {};
  for (const field of DOCUMENT_DATE_FIELDS) {
    payload[field] = draft?.[field] || null;
  }
  return payload;
}
