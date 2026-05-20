// Instância axios compartilhada que conhece o Gateway e gerencia autenticação JWT.
// Todos os services do projeto devem importar esta instância — nunca criar axios direto.

import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL, DEV_BASE_URL } from '@constants/endpoints';

const TOKEN_KEY = '@pagaai:token';
const currentBaseUrl = __DEV__
  ? Platform.OS === 'android'
    ? 'http://10.0.2.2:5046'
    : DEV_BASE_URL
  : BASE_URL;

const api = axios.create({
  baseURL: currentBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem(TOKEN_KEY);
    }
    return Promise.reject(error);
  }
);

export { TOKEN_KEY };
export default api;
