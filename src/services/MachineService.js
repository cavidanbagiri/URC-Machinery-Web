// src/services/MachineService.js
import $api from '../http/api';

class MachineService {
  /**
   * Bütün machine-ları filterlərlə gətir.
   * @param {Object} params — limit, offset, filterlər
   */
  async fetchMachines(params = {}) {
    // Boş dəyərləri təmizlə (undefined, null, '')
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(
        ([_, v]) => v !== undefined && v !== null && v !== ''
      )
    );

    const res = await $api.get('/machines/fetch_machines', {
      params: cleanParams,
    });
    return res.data;
  }

  async fetchMachineById(id) {
    const res = await $api.get(`/machines/fetch_machine/${id}`);
    return res.data;
  }

  async createMachine(payload) {
    const res = await $api.post('/machines/create_machine', payload);
    return res.data;
  }

  async updateMachine(id, payload) {
    const res = await $api.put(`/machines/update_machine/${id}`, payload);
    return res.data;
  }

  async deleteMachine(id) {
    const res = await $api.delete(`/machines/delete_machine/${id}`);
    return res.data;
  }
}

export default new MachineService();