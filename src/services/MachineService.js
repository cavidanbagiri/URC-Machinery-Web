// src/services/MachineService.js
import $api from '../http/api';

class MachineService {
  /**
   * Bütün machine-ları filterlərlə gətir.
   * @param {Object} params — limit, offset, filterlər
   */
  async fetchMachines(params = {}) {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(
        ([, value]) => value !== undefined && value !== null && value !== ''
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

  // ---------- MACHINE PHOTOS ----------
  async fetchMachinePhotos(machineId) {
    const res = await $api.get(`/machines/fetch_machine_photos/${machineId}`);
    return res.data;
  }

  /**
   * Multipart upload; the shared axios instance defaults to JSON, so the
   * Content-Type must be overridden here (axios adds the boundary itself).
   */
  async uploadMachinePhoto(machineId, file, isPrimary = false) {
    const formData = new FormData();
    formData.append('file', file);
    if (isPrimary) formData.append('is_primary', 'true');

    const res = await $api.post(
      `/machines/upload_machine_photo/${machineId}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return res.data;
  }

  async setPrimaryMachinePhoto(photoId) {
    const res = await $api.put(
      `/machines/set_primary_machine_photo/${photoId}`
    );
    return res.data;
  }

  async deleteMachinePhoto(photoId) {
    await $api.delete(`/machines/delete_machine_photo/${photoId}`);
    return photoId;
  }

}

export default new MachineService();