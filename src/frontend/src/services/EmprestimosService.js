import { getToken } from "./authService";

const BASE_URL = import.meta.env.VITE_EMPRESTIMOS_URL ?? "http://localhost:5276/api/Emprestimos";

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

export const getCarteira = (cobrador) =>
  request(`${BASE_URL}/carteira/${encodeURIComponent(cobrador)}`);

export const getRelatorioLucro = (cobrador) =>
  request(`${BASE_URL}/relatorio-lucro/${encodeURIComponent(cobrador)}`);

export const criarEmprestimo = (dados) =>
  request(BASE_URL, { method: "POST", body: JSON.stringify(dados) });

export const marcarComoPago = (id, cobrador) =>
  request(`${BASE_URL}/${id}/pagar/${encodeURIComponent(cobrador)}`, { method: "PATCH" });

export const deletarEmprestimo = (id, cobrador) =>
  request(`${BASE_URL}/${id}/${encodeURIComponent(cobrador)}`, { method: "DELETE" });
