// src/services/StockService.js
import $api from '../http/api';

const BASE = '/stock';

function cleanParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null && value !== ''
    )
  );
}

class StockService {
  // ---------- SUMMARY ----------

  async fetchSummary() {
    const res = await $api.get(`${BASE}/summary`);
    return res.data;
  }

  // ---------- STOCK ITEMS ----------

  async fetchItems(params = {}) {
    const res = await $api.get(`${BASE}/items`, {
      params: cleanParams(params),
    });
    return res.data;
  }

  async fetchItem(itemId) {
    const res = await $api.get(`${BASE}/items/${itemId}`);
    return res.data;
  }

  async createItem(payload) {
    const res = await $api.post(`${BASE}/items`, payload);
    return res.data;
  }

  async updateItem(itemId, payload) {
    const res = await $api.patch(`${BASE}/items/${itemId}`, payload);
    return res.data;
  }

  async deleteItem(itemId) {
    const res = await $api.delete(`${BASE}/items/${itemId}`);
    return res.data;
  }

  // ---------- FIELD ISSUES ----------

  async fetchIssues(params = {}) {
    const res = await $api.get(`${BASE}/issues`, {
      params: cleanParams(params),
    });
    return res.data;
  }

  async createIssue(payload) {
    const res = await $api.post(`${BASE}/issues`, payload);
    return res.data;
  }

  async deleteIssue(issueId) {
    const res = await $api.delete(`${BASE}/issues/${issueId}`);
    return res.data;
  }
}

export default new StockService();
