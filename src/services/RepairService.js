// src/services/RepairService.js
import $api from '../http/api';

function cleanParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null && value !== ''
    )
  );
}

class RepairService {
  async fetchRepairs(params = {}) {
    const res = await $api.get('/repair/fetch_repairs', {
      params: cleanParams(params),
    });
    return res.data;
  }

  async fetchSummary() {
    const res = await $api.get('/repair/summary');
    return res.data;
  }

  async fetchRepairTypes() {
    const res = await $api.get('/repair/repair_types');
    return res.data;
  }

  async fetchMachineOptions(params = {}) {
    const res = await $api.get('/repair/machines', {
      params: cleanParams(params),
    });
    return res.data;
  }

  async fetchEstimate(repairTypeId) {
    const res = await $api.get(`/repair/estimate/${repairTypeId}`);
    return res.data;
  }

  async fetchHistory(machineId) {
    const res = await $api.get(`/repair/history/${machineId}`);
    return res.data;
  }

  async fetchRepair(repairId) {
    const res = await $api.get(`/repair/${repairId}`);
    return res.data;
  }

  async createRepair(payload) {
    const res = await $api.post('/repair/create', payload);
    return res.data;
  }

  async quickOpenRepair(machineId) {
    const res = await $api.post(`/repair/quick_open/${machineId}`);
    return res.data;
  }

  async updateRepair(repairId, payload) {
    const res = await $api.put(`/repair/${repairId}`, payload);
    return res.data;
  }

  async closeRepair(repairId, payload) {
    const res = await $api.post(`/repair/${repairId}/close`, payload);
    return res.data;
  }

  async cancelRepair(repairId, payload) {
    const res = await $api.post(`/repair/${repairId}/cancel`, payload);
    return res.data;
  }

  async reopenRepair(repairId, payload = {}) {
    const res = await $api.post(`/repair/${repairId}/reopen`, payload);
    return res.data;
  }

  async addNote(repairId, payload) {
    const res = await $api.post(`/repair/${repairId}/notes`, payload);
    return res.data;
  }
}

export default new RepairService();
