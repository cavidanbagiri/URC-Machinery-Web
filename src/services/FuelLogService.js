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

  /**
   * Kiralik makineye verilen mazotu ekler. Kiralik ekipmanin filo ID'si
   * olmadigi icin kayit makine yerine kiralama sozlesmesine baglanir.
   * `km` ve `engine_hours` istege baglidir; mazotla ayni gun alinan sayac
   * okumasi gonderilir, bos birakilirsa sunucuda NULL kalir.
   */
  async createRentalLog(payload) {
    const res = await $api.post('/fuel-logs/rental/create', payload);
    return res.data;
  }
}

export default new FuelLogService();
