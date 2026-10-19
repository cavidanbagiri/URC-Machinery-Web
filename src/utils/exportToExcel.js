// src/utils/exportToExcel.js
import * as XLSX from 'xlsx';

/**
 * Makine listesini Excel'e aktarır.
 *
 * @param {Array} machines — makine nesneleri
 * @param {Object} lookups — { territory: [...], company: [...] } vb.
 * @param {string} filename — dosya adı (varsayılan: "makineler.xlsx")
 */
export function exportMachinesToExcel(
  machines,
  lookups = {},
  filename = 'makineler.xlsx'
) {
  if (!machines || machines.length === 0) {
    throw new Error('Dışa aktarılacak makine yok');
  }

  // Lookup ID → ad
  const lookupName = (key, id) => {
    if (!id) return '';
    const found = lookups[key]?.find((x) => x.id === id);
    return found?.name || `#${id}`;
  };

  // İl çıxar
  const extractYear = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).getFullYear();
    } catch {
      return '';
    }
  };

  // Tarix formatla
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleString('tr-TR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  // Sətirləri hazırla (TƏRCÜMƏ BAŞLIQLARI İLƏ)
  const rows = machines.map((m) => ({
    'ID': m.id,
    'Kimlik No': m.identification_no || '',
    'VIN No': m.vin_no || '',
    'Plaka No': m.plate_no || '',                 // ← YENİ
    'Teknik Özellikler': m.technical_character || '',
    'Üretim Yılı': extractYear(m.production_year),
    'Ağırlık (kg)': m.weight ?? '',
    'Boyutlar': m.dimension || '',
    'Motor Gücü': m.engine_power || '',
    'Motor Marka Modeli': m.engine_mark_model || '',
    'Motor Kimliği': m.engine_identity || '',
    'Bölge': lookupName('territory', m.territory_id),
    'Taşıma Tipi': lookupName('type_transport', m.type_id),
    'Alt Taşıma Tipi': lookupName('sub_type_transport', m.subtype_id),
    'Marka': lookupName('car_mark', m.car_mark_id),
    'Model': lookupName('car_model', m.car_model_id),
    'Şirket': lookupName('company', m.company_id),
    'Durum': lookupName('car_status', m.status_id),
    'Oluşturulma Tarihi': formatDate(m.created_at),
    'Oluşturan (ID)': m.created_by_id ? `#${m.created_by_id}` : '',
  }));

  // Worksheet yarat
  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Sütun genişliklərini avtomatik hesabla
  const colWidths = Object.keys(rows[0]).map((key) => {
    const maxLen = Math.max(
      key.length,
      ...rows.map((row) => String(row[key] ?? '').length)
    );
    return { wch: Math.min(maxLen + 2, 40) };   // max 40 simvol
  });
  worksheet['!cols'] = colWidths;

  // Workbook yarat
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Makineler');

  // Fayl adına tarix əlavə et
  const dateStr = new Date().toISOString().slice(0, 10);   // 2026-09-24
  const finalFilename = filename.replace('.xlsx', `_${dateStr}.xlsx`);

  // Yaz
  XLSX.writeFile(workbook, finalFilename);
}