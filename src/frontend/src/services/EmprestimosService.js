import { getToken } from "./authService";

const BASE_URL = `${import.meta.env.VITE_GATEWAY_URL ?? "http://localhost:5046"}/backend/Emprestimos`;

function authHeaders() {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request(url, options = {}) {
  const res = await fetch(url, { ...options, headers: authHeaders() });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.mensagem || err.message || `HTTP ${res.status}`);
  }
  return res.status === 204 ? null : res.json();
}

export const getCarteira = () =>
  request(`${BASE_URL}/carteira`);

export const getRelatorioLucro = () => {
  const hoje = new Date().toISOString().split('T')[0];
  const inicio = '2020-01-01';
  return request(`${BASE_URL}/relatorio-lucro?dataInicio=${inicio}&dataFim=${hoje}`);
};
export const getPagos = () =>
  request(`${BASE_URL}/pagos`);

export const criarEmprestimo = (dados) =>
  request(BASE_URL, { method: "POST", body: JSON.stringify(dados) });

export const marcarComoPago = (id) =>
  request(`${BASE_URL}/${id}/pagar`, { method: "PATCH" });

export const deletarEmprestimo = (id) =>
  request(`${BASE_URL}/${id}`, { method: "DELETE" });