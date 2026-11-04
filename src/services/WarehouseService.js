// src/services/WarehouseService.js
import $api from '../http/api';

const BASE = '/warehouse';

function cleanParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null && value !== ''
    )
  );
}

class WarehouseService {
  // ---------- SUMMARY ----------

  async fetchSummary() {
    const res = await $api.get(`${BASE}/summary`);
    return res.data;
  }

  // ---------- STOCK CARDS ----------

  async fetchStock(params = {}) {
    const res = await $api.get(`${BASE}/stock`, {
      params: cleanParams(params),
    });
    return res.data;
  }

  async fetchStockItem(itemId) {
    const res = await $api.get(`${BASE}/stock/${itemId}`);
    return res.data;
  }

  async createStockItem(payload) {
    const res = await $api.post(`${BASE}/stock`, payload);
    return res.data;
  }

  async updateStockItem(itemId, payload) {
    const res = await $api.patch(`${BASE}/stock/${itemId}`, payload);
    return res.data;
  }

  async deleteStockItem(itemId) {
    const res = await $api.delete(`${BASE}/stock/${itemId}`);
    return res.data;
  }

  // ---------- MOVEMENTS ----------

  async fetchMovements(params = {}) {
    const res = await $api.get(`${BASE}/movements`, {
      params: cleanParams(params),
    });
    return res.data;
  }

  async createMovement(payload) {
    const res = await $api.post(`${BASE}/movements`, payload);
    return res.data;
  }

  // ---------- RECEIPTS (satın alma -> depo) ----------

  async fetchPendingReceipts(params = {}) {
    const res = await $api.get(`${BASE}/pending-receipts`, {
      params: cleanParams(params),
    });
    return res.data;
  }

  async receiveItems(payload) {
    const res = await $api.post(`${BASE}/receipts`, payload);
    return res.data;
  }
}

export default new WarehouseService();
