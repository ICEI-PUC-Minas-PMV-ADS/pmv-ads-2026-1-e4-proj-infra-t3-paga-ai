import { getToken } from "./authService";

const BASE_URL = "http://localhost:5169/api/report";

function headers() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

async function req(url, options = {}) {
  const res = await fetch(url, { ...options, headers: headers() });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export const getRelatorio = (dataInicio, dataFim, cobrador) =>
  req(`${BASE_URL}?dataInicio=${dataInicio}&dataFim=${dataFim}&cobrador=${encodeURIComponent(cobrador)}`);

export const exportarPdf = (dataInicio, dataFim, cobrador) =>
  fetch(`${BASE_URL}/export-pdf`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ dataInicio, dataFim, cobrador }),
  });
