// src/services/MeterLogService.js
import $api from '../http/api';

class MeterLogService {
  /**
   * Makineler + son KM/saat + secilen gunun de dahil oldugu log penceresi.
   * @param {Object} params - days, end_date, search
   */
  async fetchOverview(params = {}) {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(
        ([, value]) => value !== undefined && value !== null && value !== ''
      )
    );

    const res = await $api.get('/meter-logs/overview', { params: cleanParams });
    return res.data;
  }

  /** Yeni bir KM / motor saati okuması ekler (update/delete yok). */
  async createLog(payload) {
    const res = await $api.post('/meter-logs/create', payload);
    return res.data;
  }
}

export default new MeterLogService();
