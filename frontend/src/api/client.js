import axios from 'axios';
import { toast } from 'react-toastify';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});

// Attach Bearer token from localStorage on every request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Track if a logout redirect is already in progress to avoid duplicate redirects
let isRedirectingToLogin = false;

// Global response error handling
client.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url || '';

    // Never auto-logout on auth endpoints (login, register, forgot-password)
    const isAuthEndpoint =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/register') ||
      requestUrl.includes('/auth/forgot-password') ||
      requestUrl.includes('/auth/reset-password');

    if (status === 401 && !isAuthEndpoint) {
      // Only redirect if a token existed (i.e., the user WAS logged in)
      const hadToken = !!localStorage.getItem('auth_token');

      if (hadToken && !isRedirectingToLogin) {
        isRedirectingToLogin = true;

        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_permissions');
        localStorage.removeItem('auth_roles');

        toast.error('Session expired. Please log in again.');

        // Small delay so any in-flight state updates finish before redirect
        setTimeout(() => {
          window.location.href = '/login';
          isRedirectingToLogin = false;
        }, 300);
      }
    }

    return Promise.reject(error);
  }
);

export default client;
