// src/services/TireService.js
import $api from '../http/api';

function cleanParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null && value !== ''
    )
  );
}

class TireService {
  async fetchTires(params = {}) {
    const res = await $api.get('/tires/fetch_tires', {
      params: cleanParams(params),
    });
    return res.data;
  }

  async fetchMachineOptions(params = {}) {
    const res = await $api.get('/tires/machines', {
      params: cleanParams(params),
    });
    return res.data;
  }

  async createChange(payload) {
    const res = await $api.post('/tires/create', payload);
    return res.data;
  }

  /** Older changes of the same machine + position ("eski kayıtlar"). */
  async fetchHistory(tireId, params = {}) {
    const res = await $api.get(`/tires/${tireId}/history`, {
      params: cleanParams(params),
    });
    return res.data;
  }

  async uploadDocument(tireId, file) {
    const form = new FormData();
    form.append('file', file);

    const res = await $api.post(`/tires/${tireId}/documents`, form, {
      // Let the browser add the multipart boundary to this header.
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  }

  async fetchDocument(tireId, documentId) {
    const res = await $api.get(`/tires/${tireId}/documents/${documentId}`, {
      responseType: 'blob',
    });
    return res.data;
  }

  async deleteDocument(tireId, documentId) {
    const res = await $api.delete(`/tires/${tireId}/documents/${documentId}`);
    return res.data;
  }
}

export default new TireService();
