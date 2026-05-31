import { useState, useCallback } from 'react';
import type { Cliente, ClientePayload } from '@typings/cliente';
import {
  getClientes,
  createCliente,
  updateCliente,
  deleteCliente,
} from '@services/clientes.service';

export function useClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const data = await getClientes();
      setClientes(data);
    } catch {
      setErro('Não foi possível carregar os clientes.');
    } finally {
      setLoading(false);
    }
  }, []);

  const criar = useCallback(async (payload: ClientePayload) => {
    const novo = await createCliente(payload);
    setClientes((prev) => [novo, ...prev]);
    return novo;
  }, []);

  const atualizar = useCallback(async (id: number, payload: Partial<ClientePayload>) => {
    const atualizado = await updateCliente(id, payload);
    setClientes((prev) => prev.map((c) => (c.id === id ? atualizado : c)));
    return atualizado;
  }, []);
  const deletar = useCallback(async (id: number) => {
    await deleteCliente(id);
    setClientes((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return { clientes, loading, erro, carregar, criar, atualizar, deletar };
}
