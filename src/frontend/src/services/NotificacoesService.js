import { getToken } from "./authService";

const BASE_URL = `${import.meta.env.VITE_GATEWAY_URL ?? "http://localhost:5046"}/backend/Notificacoes`;

function headers() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

async function req(url, options = {}) {
  const res = await fetch(url, { ...options, headers: headers() });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.status === 204 ? null : res.json();
}

export const getNotificacoes     = (cobrador) => req(`${BASE_URL}/cobrador/${encodeURIComponent(cobrador)}`);
export const getNaoLidas         = (cobrador) => req(`${BASE_URL}/cobrador/${encodeURIComponent(cobrador)}/nao-lidas`);
export const marcarLida          = (id)       => req(`${BASE_URL}/${id}/lida`, { method: "PATCH" });
export const marcarTodasLidas    = (cobrador) => req(`${BASE_URL}/cobrador/${encodeURIComponent(cobrador)}/marcar-todas-lidas`, { method: "PATCH" });
export const deletarNotif        = (id)       => req(`${BASE_URL}/${id}`, { method: "DELETE" });