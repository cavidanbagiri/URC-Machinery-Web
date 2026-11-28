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

  async updateArchiveNote(repairId, payload) {
    const res = await $api.put(`/repair/${repairId}/archive_note`, payload);
    return res.data;
  }

  async uploadDocument(repairId, file) {
    const form = new FormData();
    form.append('file', file);

    const res = await $api.post(`/repair/${repairId}/documents`, form, {
      // Let the browser add the multipart boundary to this header.
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  }

  async fetchDocument(repairId, documentId) {
    const res = await $api.get(`/repair/${repairId}/documents/${documentId}`, {
      responseType: 'blob',
    });
    return res.data;
  }

  async deleteDocument(repairId, documentId) {
    const res = await $api.delete(
      `/repair/${repairId}/documents/${documentId}`
    );
    return res.data;
  }
}

export default new RepairService();
