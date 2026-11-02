// src/services/PurchaseRequestService.js
import $api from '../http/api';

const BASE = '/purchase-requests';

function cleanParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null && value !== ''
    )
  );
}

class PurchaseRequestService {
  // ---------- SPARE PART REQUESTS ----------

  async fetchSpareParts(params = {}) {
    const res = await $api.get(`${BASE}/spare-parts`, {
      params: cleanParams(params),
    });
    return res.data;
  }

  async createSparePart(payload) {
    const res = await $api.post(`${BASE}/spare-parts`, payload);
    return res.data;
  }

  async updateSparePartStatus(requestId, status) {
    const res = await $api.patch(`${BASE}/spare-parts/${requestId}/status`, {
      status,
    });
    return res.data;
  }

  async deleteSparePart(requestId) {
    const res = await $api.delete(`${BASE}/spare-parts/${requestId}`);
    return res.data;
  }

  // ---------- SERVICE REQUESTS ----------

  async fetchServiceRequests(params = {}) {
    const res = await $api.get(`${BASE}/service-requests`, {
      params: cleanParams(params),
    });
    return res.data;
  }

  async createServiceRequest(payload) {
    const res = await $api.post(`${BASE}/service-requests`, payload);
    return res.data;
  }

  async deleteServiceRequest(requestId) {
    const res = await $api.delete(`${BASE}/service-requests/${requestId}`);
    return res.data;
  }

  // ---------- OPTIONS ----------

  async fetchRequestTypes() {
    const res = await $api.get(`${BASE}/spare-part-types`);
    return res.data;
  }

  async fetchMachines(params = {}) {
    const res = await $api.get(`${BASE}/machines`, {
      params: cleanParams(params),
    });
    return res.data;
  }
}

export default new PurchaseRequestService();
