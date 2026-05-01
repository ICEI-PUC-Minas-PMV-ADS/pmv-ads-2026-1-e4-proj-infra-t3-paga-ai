import axios from 'axios';


const api = axios.create({
  baseURL: 'https://emprestimos-fra0habvh3cvf7ee.eastus-01.azurewebsites.net/'
});



//const api = axios.create({
  // URL do seu Gateway no Azure
 // baseURL: 'https://gateway-hxc8cshmfsd9cwdt.eastus-01.azurewebsites.net',
//});

// Isso adiciona o token automaticamente em todas as chamadas
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token"); // Ou onde você guarda o JWT
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;