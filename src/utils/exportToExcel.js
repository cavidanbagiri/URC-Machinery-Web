// src/utils/exportToExcel.js
import * as XLSX from 'xlsx';

/**
 * Maşın siyahısını Excel-ə export edir.
 *
 * @param {Array} machines — machine obyektləri
 * @param {Object} lookups — { territory: [...], company: [...] } və s.
 * @param {string} filename — fayl adı (default: "machines.xlsx")
 */
export function exportMachinesToExcel(
  machines,
  lookups = {},
  filename = 'machines.xlsx'
) {
  if (!machines || machines.length === 0) {
    throw new Error('Export üçün heç bir maşın yoxdur');
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
      return new Date(dateStr).toLocaleString('az-AZ', {
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
    'Identification No': m.identification_no || '',
    'VIN No': m.vin_no || '',
    'Technical Character': m.technical_character || '',
    'Production Year': extractYear(m.production_year),
    'Weight (kg)': m.weight ?? '',
    'Dimension': m.dimension || '',
    'Engine Power': m.engine_power || '',
    'Engine Mark Model': m.engine_mark_model || '',
    'Engine Identity': m.engine_identity || '',
    'Territory': lookupName('territory', m.territory_id),
    'Type Transport': lookupName('type_transport', m.type_id),
    'SubType Transport': lookupName('sub_type_transport', m.subtype_id),
    'Mark': lookupName('car_mark', m.car_mark_id),
    'Model': lookupName('car_model', m.car_model_id),
    'Company': lookupName('company', m.company_id),
    'Yaradılma tarixi': formatDate(m.created_at),
    'Yaradan (ID)': m.created_by_id ? `#${m.created_by_id}` : '',
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
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Machines');

  // Fayl adına tarix əlavə et
  const dateStr = new Date().toISOString().slice(0, 10);   // 2026-09-24
  const finalFilename = filename.replace('.xlsx', `_${dateStr}.xlsx`);

  // Yaz
  XLSX.writeFile(workbook, finalFilename);
}