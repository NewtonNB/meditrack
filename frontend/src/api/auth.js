import client from './client';

export const login = (credentials) =>
  client.post('/auth/login', credentials);

export const register = (data) =>
  client.post('/auth/register', data);

export const logout = () =>
  client.post('/auth/logout');

export const getMe = () =>
  client.get('/auth/me');

export const forgotPassword = (email) =>
  client.post('/auth/forgot-password', { email });

export const resetPassword = (data) =>
  client.post('/auth/reset-password', data);
