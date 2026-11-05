// src/services/ForumService.js
import $api from '../http/api';

function cleanParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null && value !== ''
    )
  );
}

class ForumService {
  async fetchTopics(params = {}) {
    const res = await $api.get('/forum/topics', { params: cleanParams(params) });
    return res.data;
  }

  async fetchTopic(topicId) {
    const res = await $api.get(`/forum/topics/${topicId}`);
    return res.data;
  }

  async fetchMachineOptions(params = {}) {
    const res = await $api.get('/forum/machines', {
      params: cleanParams(params),
    });
    return res.data;
  }

  async createTopic(payload) {
    const res = await $api.post('/forum/topics', payload);
    return res.data;
  }

  async addComment(topicId, payload) {
    const res = await $api.post(`/forum/topics/${topicId}/comments`, payload);
    return res.data;
  }

  async setResolved(topicId, payload) {
    const res = await $api.post(`/forum/topics/${topicId}/resolve`, payload);
    return res.data;
  }

  async deleteTopic(topicId) {
    const res = await $api.delete(`/forum/topics/${topicId}`);
    return res.data;
  }

  async uploadPhoto(topicId, file) {
    const form = new FormData();
    form.append('file', file);

    const res = await $api.post(`/forum/topics/${topicId}/photos`, form, {
      // Let the browser add the multipart boundary to this header.
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  }

  /** Photos live in PostgreSQL behind the API, so they arrive as a Blob. */
  async fetchPhoto(topicId, photoId) {
    const res = await $api.get(
      `/forum/topics/${topicId}/photos/${photoId}`,
      { responseType: 'blob' }
    );
    return res.data;
  }

  async deletePhoto(topicId, photoId) {
    const res = await $api.delete(
      `/forum/topics/${topicId}/photos/${photoId}`
    );
    return res.data;
  }
}

export default new ForumService();
