// src/services/DashboardService.js
import $api from '../http/api';

class DashboardService {
  async fetchStatusStatistics() {
    const res = await $api.get('/machines/statistics/status');
    return res.data;
  }
}

export default new DashboardService();