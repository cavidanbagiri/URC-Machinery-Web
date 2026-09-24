import $api from '../http/api';

// Register user
const register = async (userData) => {
  const response = await $api.post('/auth/register', userData);
  return response.data;
};

// Login user
const login = async (userData) => {
  const response = await $api.post('/auth/login', userData);
  return response.data;
};


const logout = async () => {
  try {
    // Call backend logout endpoint
    await $api.post('/auth/logout');
  } catch (error) {
    console.error('Logout API error:', error);
  } finally {
    // Always clear local storage even if API call fails
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  }
};



// Refresh token - Just call endpoint, cookie is automatic
const refreshToken = async () => {
  const response = await $api.post('/auth/refresh');
  // Backend returns new access_token and sets new refresh_token cookie if needed
  if (response.data.access_token) {
    localStorage.setItem('access_token', response.data.access_token);
    if (response.data.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
  }
  return response;
};


// Get current user
const getCurrentUser = async () => {
  const response = await $api.get('/auth/me');
  return response.data;
};

const authService = {
  register,
  login,
  logout,
  refreshToken,
  getCurrentUser,
};

export default authService;