// src/services/UserService.js
import $api from '../http/api';

/**
 * Read-only user directory. The dashboard header renders these people as an
 * overlapping avatar stack, so only public profile fields come back.
 */
class UserService {
  /** Team members (photo URL, name, e-mail, position) plus the total count. */
  async fetchTeam(params = {}) {
    const res = await $api.get('/users/team', { params });
    return res.data;
  }
}

export default new UserService();
