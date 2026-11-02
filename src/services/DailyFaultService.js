// src/services/DailyFaultService.js
import $api from '../http/api';

function cleanParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null && value !== ''
    )
  );
}

class DailyFaultService {
  async fetchFaults(params = {}) {
    const res = await $api.get('/daily-faults/fetch_daily_faults', {
      params: cleanParams(params),
    });
    return res.data;
  }

  async fetchMachineOptions(params = {}) {
    const res = await $api.get('/daily-faults/machines', {
      params: cleanParams(params),
    });
    return res.data;
  }

  async createFault(payload) {
    const res = await $api.post('/daily-faults/create', payload);
    return res.data;
  }

  async uploadDocument(faultId, file) {
    const form = new FormData();
    form.append('file', file);

    const res = await $api.post(`/daily-faults/${faultId}/documents`, form, {
      // Let the browser add the multipart boundary to this header.
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  }

  async fetchDocument(faultId, documentId) {
    const res = await $api.get(
      `/daily-faults/${faultId}/documents/${documentId}`,
      { responseType: 'blob' }
    );
    return res.data;
  }

  async deleteDocument(faultId, documentId) {
    const res = await $api.delete(
      `/daily-faults/${faultId}/documents/${documentId}`
    );
    return res.data;
  }
}

export default new DailyFaultService();
