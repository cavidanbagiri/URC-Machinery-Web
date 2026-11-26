// src/services/FuelLogService.js
import $api from '../http/api';

/** Boş (undefined / null / "") parametreleri istekten çıkarır. */
function cleanParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null && value !== ''
    )
  );
}

class FuelLogService {
  /**
   * Makineler + secilen gunun mazot toplamlari + gun/hafta/ay ozetleri.
   * @param {Object} params - fuel_date, search
   */
  async fetchOverview(params = {}) {
    const res = await $api.get('/fuel-logs/overview', {
      params: cleanParams(params),
    });
    return res.data;
  }

  /** Yeni bir mazot dagitimi ekler. */
  async createLog(payload) {
    const res = await $api.post('/fuel-logs/create', payload);
    return res.data;
  }

  /**
   * Bir makinenin son kayitlari (varsayilan 30 gun, secilen gun dahil).
   * "Islemler -> Duzenle" penceresi bu listeyi gosterir; yanlis gune
   * yazilmis satir burada bulunup duzeltilir.
   * @param {Object} params - machine_id (zorunlu), end_date, days
   */
  async fetchEntries(params = {}) {
    const res = await $api.get('/fuel-logs/entries', {
      params: cleanParams(params),
    });
    return res.data;
  }

  /**
   * Kaydedilmis tek bir mazot satirini duzeltir (tarih / litre).
   * Gonderilmeyen alanlar oldugu gibi kalir.
   */
  async updateLog(logId, payload) {
    const res = await $api.put(`/fuel-logs/update/${logId}`, payload);
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

  /**
   * Bir kiralama sozlesmesinin son mazot satirlari (Kiralik sekmesi).
   * @param {Object} params - rental_id (zorunlu), end_date, days
   */
  async fetchRentalEntries(params = {}) {
    const res = await $api.get('/fuel-logs/rental/entries', {
      params: cleanParams(params),
    });
    return res.data;
  }

  /**
   * Kiralik defterdeki tek bir satiri duzeltir. Tarih / litre ile birlikte
   * satirda saklanan KM ve motor saati okumasi da duzeltilebilir.
   */
  async updateRentalLog(logId, payload) {
    const res = await $api.put(`/fuel-logs/rental/update/${logId}`, payload);
    return res.data;
  }
}

export default new FuelLogService();
