// src/services/DocumentTrackingService.js
import $api from '../http/api';

function cleanParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null && value !== ''
    )
  );
}

class DocumentTrackingService {
  async fetchDocumentTracking(params = {}) {
    const res = await $api.get('/document-tracking/fetch_document_tracking', {
      params: cleanParams(params),
    });
    return res.data;
  }

  async update(machineId, payload) {
    const res = await $api.put(`/document-tracking/update/${machineId}`, payload);
    return res.data;
  }
}

export default new DocumentTrackingService();
