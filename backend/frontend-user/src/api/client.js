import axios from 'axios';

import { cacheGet, cacheSet, isOnline } from '../utils/offline';

const client = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'https://safeguard-c7n8.onrender.com',
  withCredentials: false
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => {
    if (response.config.method === 'get' && response.status === 200) {
      const key = 'api_' + response.config.url + JSON.stringify(response.config.params || {});
      cacheSet(key, response.data);
    }
    return response;
  },
  async (error) => {
    if (!isOnline() && error.config?.method === 'get') {
      const key = 'api_' + error.config.url + JSON.stringify(error.config.params || {});
      const cached = cacheGet(key);
      if (cached) {
        return Promise.resolve({ data: cached, cached: true });
      }
    }
    return Promise.reject(error);
  }
);

export default client;
