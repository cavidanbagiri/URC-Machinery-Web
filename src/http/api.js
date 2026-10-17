




// http/api.js
import axios from 'axios';

// Set VITE_API_URL in frontend-web/.env for local development.
export const BASE_URL =
  import.meta.env.VITE_API_URL || 'https://urc-machinery-server.onrender.com/api';

const config = {
  baseURL: BASE_URL,
  withCredentials: true, // Sends the httpOnly refresh_token cookie
  headers: {
    'Content-Type': 'application/json',
  },
};

const $api = axios.create(config);

// Used for /auth/refresh so a failing refresh never re-enters the interceptor.
export const refreshApi = axios.create(config);

// Request interceptor - Add access token to every request
$api.interceptors.request.use(
  (request) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      request.headers.Authorization = `Bearer ${token}`;
    }
    return request;
  },
  (error) => Promise.reject(error)
);

const AUTH_ENDPOINT = /\/auth\/(login|register|refresh|logout)(?:[/?]|$)/;

function clearSession() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('user');
}

// Single-flight refresh: parallel 401s share one rotation request, otherwise
// multiple refreshes would invalidate each other's rotated refresh token.
let refreshPromise = null;

export function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = refreshApi.post('/auth/refresh').finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

// Response interceptor - Handle token refresh exactly once
$api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthEndpoint = AUTH_ENDPOINT.test(originalRequest?.url || '');

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      originalRequest._retry = true;

      try {
        const response = await refreshAccessToken();
        const accessToken = response.data?.access_token;

        if (!accessToken) {
          throw new Error('Refresh response did not include an access token');
        }

        localStorage.setItem('access_token', accessToken);
        if (response.data.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }

        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return $api(originalRequest);
      } catch (refreshError) {
        clearSession();

        // Avoid redirect loops and never send the user to a non-existent /login.
        if (!window.location.pathname.startsWith('/auth')) {
          window.location.assign('/auth?mode=login');
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default $api;
