// src/services/IsgService.js
import $api from '../http/api';

function cleanParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null && value !== ''
    )
  );
}

class IsgService {
  async fetchNonconformities(params = {}) {
    const res = await $api.get('/isg/fetch_nonconformities', {
      params: cleanParams(params),
    });
    return res.data;
  }

  async fetchOverview() {
    const res = await $api.get('/isg/overview');
    return res.data;
  }

  /** Open/closed counts per project — the dashboard summary table. */
  async fetchProjectSummary() {
    const res = await $api.get('/isg/project_summary');
    return res.data;
  }

  async fetchResponsibles() {
    const res = await $api.get('/isg/responsibles');
    return res.data;
  }

  async create(payload) {
    const res = await $api.post('/isg/create', payload);
    return res.data;
  }

  async update(itemId, payload) {
    const res = await $api.put(`/isg/update/${itemId}`, payload);
    return res.data;
  }

  async setStatus(itemId, status) {
    const res = await $api.patch(`/isg/${itemId}/status`, { status });
    return res.data;
  }

  async remove(itemId) {
    await $api.delete(`/isg/delete/${itemId}`);
  }

  async uploadAttachment(itemId, file) {
    const form = new FormData();
    form.append('file', file);

    const res = await $api.post(`/isg/${itemId}/attachments`, form, {
      // Let the browser add the multipart boundary to this header.
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  }

  async fetchAttachment(itemId, attachmentId, download = false) {
    const res = await $api.get(
      `/isg/${itemId}/attachments/${attachmentId}`,
      {
        params: download ? { download: true } : undefined,
        responseType: 'blob',
      }
    );
    return res.data;
  }

  async deleteAttachment(itemId, attachmentId) {
    const res = await $api.delete(
      `/isg/${itemId}/attachments/${attachmentId}`
    );
    return res.data;
  }
}

export default new IsgService();
