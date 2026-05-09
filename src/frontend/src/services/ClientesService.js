// ─────────────────────────────────────────────────────────────────────────────
// clientesService.js
// Funções de acesso à API de Clientes (Clientes.API — .NET 8 + MongoDB)
// Base URL: ajuste a constante abaixo conforme o ambiente
// ─────────────────────────────────────────────────────────────────────────────

const BASE_URL = "http://localhost:5046/backend/Clientes"; // <- trocar pela URL do Azure em produção

// Helper interno: lança erro com a mensagem da API se a resposta não for ok
async function checarResposta(res) {
  if (!res.ok) {
    const erro = await res.json().catch(() => ({ mensagem: "Erro desconhecido." }));
    throw new Error(erro.mensagem || `Erro HTTP ${res.status}`);
  }
  return res;
}

// ── READ — GET /api/clientes ──────────────────────────────────────────────────
// Retorna: Cliente[]
export async function getClientes(token) {
  const res = await fetch(BASE_URL, {
    headers: { Authorization: `Bearer ${token}` },
  });
  await checarResposta(res);
  return res.json(); // [{ id, nome, cpf, telefone, endereco, email, descricao }]
}

// ── READ ONE — GET /api/clientes/:id ─────────────────────────────────────────
// Retorna: Cliente
export async function getClienteById(id, token) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  await checarResposta(res);
  return res.json();
}

// ── CREATE — POST /api/clientes ───────────────────────────────────────────────
// Envia:   { nome, cpf, telefone, endereco, email, descricao }
// Retorna: Cliente criado (com id gerado pelo servidor)
export async function createCliente(dados, token) {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
       Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(dados),
  });
  await checarResposta(res);
  return res.json();
}

// ── UPDATE — PUT /api/clientes/:id ───────────────────────────────────────────
// Envia:   { id, nome, cpf, telefone, endereco, email, descricao }
// Retorna: 204 No Content (sem corpo)
export async function updateCliente(id, dados, token) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ ...dados, id }),
  });
  await checarResposta(res);
  // 204 não tem corpo — retorna apenas confirmação
  return { sucesso: true };
}

// ── DELETE — DELETE /api/clientes/:id ────────────────────────────────────────
// Retorna: 204 No Content (sem corpo)
export async function deleteCliente(id, token) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "DELETE",
   headers: { Authorization: `Bearer ${token}` },
  });
  await checarResposta(res);
  return { sucesso: true };
}
