// src/services/FuelLogService.js
import $api from '../http/api';

class FuelLogService {
  /**
   * Makineler + secilen gunun mazot toplamlari + gun/hafta/ay ozetleri.
   * @param {Object} params - fuel_date, search
   */
  async fetchOverview(params = {}) {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(
        ([, value]) => value !== undefined && value !== null && value !== ''
      )
    );

    const res = await $api.get('/fuel-logs/overview', { params: cleanParams });
    return res.data;
  }

  /** Yeni bir mazot dagitimi ekler (update/delete yok). */
  async createLog(payload) {
    const res = await $api.post('/fuel-logs/create', payload);
    return res.data;
  }
}

export default new FuelLogService();
