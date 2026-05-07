import api from './api';

export const getUsuarios = async () => {
  const response = await api.get('/usuarios'); // Rota que passa pelo Gateway
  return response.data;
};
