import api from './api';
import { CLIENTES } from '@constants/endpoints';
import type { Cliente, ClientePayload } from '@typings/cliente';


export async function getClientes(): Promise<Cliente[]> {
  const { data } = await api.get<Cliente[]>(CLIENTES);
  return data;
}

export async function getClienteById(id: number): Promise<Cliente> {
  const { data } = await api.get<Cliente>(`${CLIENTES}/${id}`);
  return data;
}

export async function createCliente(payload: ClientePayload): Promise<Cliente> {
  const { data } = await api.post<Cliente>(CLIENTES, payload);
  return data;
}

export async function updateCliente(id: number, payload: Partial<ClientePayload>): Promise<Cliente> {
  await api.put(`${CLIENTES}/${id}`, payload);
  const { data } = await api.get<Cliente>(`${CLIENTES}/${id}`);
  return data;
}

export async function deleteCliente(id: number): Promise<void> {
  await api.delete(`${CLIENTES}/${id}`);
}
