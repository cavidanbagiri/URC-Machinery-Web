// src/services/MaintenanceService.js
import $api from '../http/api';

/**
 * Boş dəyərləri təmizləyir, amma `false` və `0` kimi dəyərləri saxlayır —
 * `include_inactive=false` və `has_plan=false` filterləri mənasını itirməsin.
 */
function cleanParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null && value !== ''
    )
  );
}

class MaintenanceService {
  async fetchMaintenance(params = {}) {
    const res = await $api.get('/maintenance/fetch_maintenance', {
      params: cleanParams(params),
    });
    return res.data;
  }

  async fetchSummary() {
    const res = await $api.get('/maintenance/summary');
    return res.data;
  }

  async fetchHistory(machineId, params = {}) {
    const res = await $api.get(`/maintenance/history/${machineId}`, {
      params: cleanParams(params),
    });
    return res.data;
  }

  /**
   * Arşiv sekmesi: bütün makinelerin tamamlanmış bakım kayıtları (sayfalı).
   * `search`, `date_from`, `date_to`, `usage_unit` filtrelerini destekler.
   */
  async fetchRecords(params = {}) {
    const res = await $api.get('/maintenance/records', {
      params: cleanParams(params),
    });
    return res.data;
  }

  async upsertSettings(machineId, payload) {
    const res = await $api.put(`/maintenance/settings/${machineId}`, payload);
    return res.data;
  }

  async addReading(machineId, payload) {
    const res = await $api.post(`/maintenance/reading/${machineId}`, payload);
    return res.data;
  }

  async complete(machineId, payload = {}, file = null) {
    const form = new FormData();

    if (payload.counter_value !== null && payload.counter_value !== undefined) {
      form.append('counter_value', String(payload.counter_value));
    }
    if (payload.interval_value !== null && payload.interval_value !== undefined) {
      form.append('interval_value', String(payload.interval_value));
    }
    if (payload.maintenance_date) {
      form.append('maintenance_date', payload.maintenance_date);
    }
    if (payload.notes) {
      form.append('notes', payload.notes);
    }
    if (file) {
      form.append('file', file);
    }

    const res = await $api.post(`/maintenance/complete/${machineId}`, form, {
      // Let the browser add the multipart boundary to this header.
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  }

  async fetchDocument(documentId) {
    const res = await $api.get(`/maintenance/documents/${documentId}`, {
      responseType: 'blob',
    });
    return res.data;
  }
}

export default new MaintenanceService();
