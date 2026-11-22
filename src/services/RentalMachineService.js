// src/services/RentalMachineService.js
import $api from '../http/api';

function cleanParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null && value !== ''
    )
  );
}

class RentalMachineService {
  async fetchRentalMachines(params = {}) {
    const res = await $api.get('/rental-machines/fetch_rental_machines', {
      params: cleanParams(params),
    });
    return res.data;
  }

  async create(payload) {
    const res = await $api.post('/rental-machines/create', payload);
    return res.data;
  }

  async update(rentalId, payload) {
    const res = await $api.put(
      `/rental-machines/update/${rentalId}`,
      payload
    );
    return res.data;
  }

  async remove(rentalId) {
    await $api.delete(`/rental-machines/delete/${rentalId}`);
  }
}

export default new RentalMachineService();
