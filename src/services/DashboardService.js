// src/services/DashboardService.js
import $api from '../http/api';

class DashboardService {
  async fetchStatusStatistics() {
    const res = await $api.get('/machines/statistics/status');
    return res.data;
  }

  async fetchPivotStatistics() {
    const res = await $api.get('/machines/statistics/pivot');
    return res.data;
  }

  /**
   * Dashboard'daki **Mazot Dagilimi** grafigi: son `days` gunun SRU / DCU /
   * kiralik mazot toplamlari (gun basina bir bar grubu). Dashboard son 10 gunu
   * ister; API'nin kendi varsayilani 7'dir.
   */
  async fetchFuelDistribution(days = 10) {
    const res = await $api.get('/fuel-logs/statistics/daily', {
      params: { days },
    });
    return res.data;
  }
}

export default new DashboardService();