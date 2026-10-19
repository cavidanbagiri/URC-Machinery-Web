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

  async upsertSettings(machineId, payload) {
    const res = await $api.put(`/maintenance/settings/${machineId}`, payload);
    return res.data;
  }

  async addReading(machineId, payload) {
    const res = await $api.post(`/maintenance/reading/${machineId}`, payload);
    return res.data;
  }

  async complete(machineId, payload) {
    const res = await $api.post(`/maintenance/complete/${machineId}`, payload);
    return res.data;
  }
}

export default new MaintenanceService();
