// hooks/useClientes.ts
// Responsabilidade: gerenciar o estado do módulo Clientes.
// As telas não chamam o service diretamente — sempre via este hook.
// Expõe os dados, os estados de loading/erro e as funções de CRUD.

import { useState, useCallback } from "react";
import { Cliente } from "@modelos/cliente";
import * as clientesService from "@services/clientes.service";
import type {
  CriarClienteDTO,
  AtualizarClienteDTO,
} from "@services/clientes.service";

// ─── Tipo do retorno do hook ──────────────────────────────────────────────────
interface UseClientesReturn {
  clientes:  Cliente[];
  cliente:   Cliente | null;
  loading:   boolean;
  error:     string | null;
  fetchAll:  () => Promise<void>;
  fetchById: (id: number) => Promise<void>;
  create:    (dados: CriarClienteDTO) => Promise<void>;
  update:    (id: number, dados: AtualizarClienteDTO) => Promise<void>;
  remove:    (id: number) => Promise<void>;
  clearError: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useClientes(): UseClientesReturn {

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cliente,  setCliente]  = useState<Cliente | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const clearError = () => setError(null);

  // ── Buscar todos ────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await clientesService.getAll();
      setClientes(data);
    } catch (err) {
      setError("Não foi possível carregar os clientes.");
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Buscar por ID ───────────────────────────────────────────────────────────
  const fetchById = useCallback(async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await clientesService.getById(id);
      setCliente(data);
    } catch (err) {
      setError("Cliente não encontrado.");
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Criar ───────────────────────────────────────────────────────────────────
  const create = useCallback(async (dados: CriarClienteDTO) => {
    try {
      setLoading(true);
      setError(null);
      const novo = await clientesService.create(dados);
      setClientes((anterior) => [...anterior, novo]); // atualiza a lista local
    } catch (err) {
      setError("Não foi possível criar o cliente.");
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Atualizar ───────────────────────────────────────────────────────────────
  const update = useCallback(async (id: number, dados: AtualizarClienteDTO) => {
    try {
      setLoading(true);
      setError(null);
      const atualizado = await clientesService.update(id, dados);
      setClientes((anterior) =>
        anterior.map((c) => (c.id === atualizado.id ? atualizado : c))
      );
      setCliente(atualizado);
    } catch (err) {
      setError("Não foi possível atualizar o cliente.");
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Remover ─────────────────────────────────────────────────────────────────
  const remove = useCallback(async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      await clientesService.remove(id);
      setClientes((anterior) => anterior.filter((c) => c.id !== id));
    } catch (err) {
      setError("Não foi possível remover o cliente.");
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    clientes,
    cliente,
    loading,
    error,
    fetchAll,
    fetchById,
    create,
    update,
    remove,
    clearError,
  };
}