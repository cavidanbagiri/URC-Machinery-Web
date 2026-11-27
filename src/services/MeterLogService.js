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

  /** Yeni bir KM / motor saati okuması ekler. */
  async createLog(payload) {
    const res = await $api.post('/meter-logs/create', payload);
    return res.data;
  }

  /**
   * Bir makinenin son okumaları (İşlemler → Düzenle penceresi).
   * @param {Object} params - machine_id, end_date, days
   */
  async fetchEntries(params = {}) {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(
        ([, value]) => value !== undefined && value !== null && value !== ''
      )
    );

    const res = await $api.get('/meter-logs/entries', { params: cleanParams });
    return res.data;
  }

  /**
   * Kaydedilmiş bir okumayı yerinde düzeltir (silme yok).
   * @param {number} id - okuma id'si
   * @param {Object} payload - log_date, km, engine_hours (yalnızca değişenler)
   */
  async updateLog(id, payload) {
    const res = await $api.put(`/meter-logs/update/${id}`, payload);
    return res.data;
  }
}

export default new MeterLogService();
