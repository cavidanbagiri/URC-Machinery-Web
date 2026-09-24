




// http/api.js - Add refresh token interceptor
import axios from 'axios';
import authService from '../services/AuthService';

const BASE_URL = 'http://localhost:8000/api';

const $api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // CRITICAL: This sends the refresh_token cookie
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add access token to every request
$api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle token refresh
$api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If 401 error and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token
        const response = await authService.refreshToken();
        
        // Store new access token
        if (response.data.access_token) {
          localStorage.setItem('access_token', response.data.access_token);
          
          // Update user data if returned
          if (response.data.user) {
            localStorage.setItem('user', JSON.stringify(response.data.user));
          }
          
          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${response.data.access_token}`;
          return $api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed - redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default $api;