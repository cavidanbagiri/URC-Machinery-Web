// src/services/SettingService.js
import $api from '../http/api';

// =========================================================
// LOOKUP CONFIG — hansı endpoint-lər var
// =========================================================

export const LOOKUP_CONFIG = {
  territory: {
    label: 'Territory',
    endpoint: '/machines',
    createPath: '/create_territory',
    fetchPath: '/fetch_territories',
    updatePath: (id) => `/update_territory/${id}`,
    deletePath: (id) => `/delete_territory/${id}`,
  },
  type_transport: {
    label: 'Type Transport',
    endpoint: '/machines',
    createPath: '/create_type_transport',
    fetchPath: '/fetch_type_transports',
    updatePath: (id) => `/update_type_transport/${id}`,
    deletePath: (id) => `/delete_type_transport/${id}`,
  },
  sub_type_transport: {
    label: 'SubType Transport',
    endpoint: '/machines',
    createPath: '/create_sub_type_transport',
    fetchPath: '/fetch_sub_type_transports',
    updatePath: (id) => `/update_sub_type_transport/${id}`,
    deletePath: (id) => `/delete_sub_type_transport/${id}`,
  },
  car_mark: {
    label: 'Car Mark',
    endpoint: '/machines',
    createPath: '/create_car_mark',
    fetchPath: '/fetch_car_marks',
    updatePath: (id) => `/update_car_mark/${id}`,
    deletePath: (id) => `/delete_car_mark/${id}`,
  },
  car_model: {
    label: 'Car Model',
    endpoint: '/machines',
    createPath: '/create_car_model',
    fetchPath: '/fetch_car_models',
    updatePath: (id) => `/update_car_model/${id}`,
    deletePath: (id) => `/delete_car_model/${id}`,
  },
  company: {
    label: 'Company',
    endpoint: '/machines',
    createPath: '/create_company',
    fetchPath: '/fetch_companies',
    updatePath: (id) => `/update_company/${id}`,
    deletePath: (id) => `/delete_company/${id}`,
  },
  // YENİ
  car_status: {
    label: 'Car Status',
    endpoint: '/machines',
    createPath: '/create_car_status',
    fetchPath: '/fetch_car_statuses',
    updatePath: (id) => `/update_car_status/${id}`,
    deletePath: (id) => `/delete_car_status/${id}`,
  },
};


// =========================================================
// SERVICE
// =========================================================

class SettingService {
  /**
   * Generic lookup üçün bütün CRUD əməliyyatları.
   * @param {string} key — LOOKUP_CONFIG açarı (məs. "territory")
   */

  async fetchAll(key) {
    const cfg = LOOKUP_CONFIG[key];
    const res = await $api.get(`${cfg.endpoint}${cfg.fetchPath}`);
    return res.data;
  }

  async create(key, payload) {
    const cfg = LOOKUP_CONFIG[key];
    const res = await $api.post(`${cfg.endpoint}${cfg.createPath}`, payload);
    return res.data;
  }

  async update(key, id, payload) {
    const cfg = LOOKUP_CONFIG[key];
    const res = await $api.put(`${cfg.endpoint}${cfg.updatePath(id)}`, payload);
    return res.data;
  }

  async delete(key, id) {
    const cfg = LOOKUP_CONFIG[key];
    const res = await $api.delete(`${cfg.endpoint}${cfg.deletePath(id)}`);
    return res.data;
  }
}

export default new SettingService();