// services/clientes.service.ts
// Responsabilidade: todas as chamadas à Clientes.API passando pelo Gateway.
// Este arquivo é a única camada que conhece as rotas de clientes.
// Nenhuma tela ou hook deve chamar o api.ts diretamente — sempre via este service.

import api from "./api";                        // services/api.ts — instância axios + JWT
import { CLIENTES } from "@constants/endpoints"; // constants/endpoints.ts — '/api/clientes'
import { Cliente }  from "@modelos/cliente";       // types/cliente.ts

// ─── Tipos auxiliares ─────────────────────────────────────────────────────────

// Dados necessários para criar um novo cliente (sem id — gerado pelo backend)
export type CriarClienteDTO = Omit<Cliente, "id">;

// Dados para atualizar — todos os campos são opcionais exceto o id
export type AtualizarClienteDTO = Partial<CriarClienteDTO>;


// ─── Funções do service ───────────────────────────────────────────────────────

/**
 * Busca todos os clientes.
 * GET /api/clientes
 */
export async function getAll(): Promise<Cliente[]> {
  const response = await api.get<Cliente[]>(CLIENTES);
  return response.data;
}

/**
 * Busca um cliente pelo ID.
 * GET /api/clientes/:id
 */
export async function getById(id: number): Promise<Cliente> {
  const response = await api.get<Cliente>(`${CLIENTES}/${id}`);
  return response.data;
}

/**
 * Cria um novo cliente.
 * POST /api/clientes
 */
export async function create(dados: CriarClienteDTO): Promise<Cliente> {
  const response = await api.post<Cliente>(CLIENTES, dados);
  return response.data;
}

/**
 * Atualiza um cliente existente.
 * PUT /api/clientes/:id
 */
export async function update(
  id: number,
  dados: AtualizarClienteDTO
): Promise<Cliente> {
  const response = await api.put<Cliente>(`${CLIENTES}/${id}`, dados);
  return response.data;
}

/**
 * Remove um cliente pelo ID.
 * DELETE /api/clientes/:id
 */
export async function remove(id: number): Promise<void> {
  await api.delete(`${CLIENTES}/${id}`);
}