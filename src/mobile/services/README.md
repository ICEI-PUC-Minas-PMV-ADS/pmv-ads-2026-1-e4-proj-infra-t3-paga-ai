# Services — Instruções para cada responsável de módulo

Cada membro deve criar o arquivo `[modulo].service.ts` correspondente ao seu módulo **nesta pasta**.

## Regra fundamental

**Todo service deve importar a instância `api` de `./api`** — nunca criar uma instância axios própria. Isso garante que o JWT e a baseURL sejam injetados automaticamente.

```ts
import api from './api';
import { CLIENTES } from '@constants/endpoints'; // use a constante do módulo
```

## Arquivos a criar

| Arquivo | Módulo | Responsável |
|---------|--------|-------------|
| `usuarios.service.ts` | Usuários / Auth | responsável pelo módulo Usuários |
| `clientes.service.ts` | Clientes | responsável pelo módulo Clientes |
| `emprestimos.service.ts` | Empréstimos | responsável pelo módulo Empréstimos |
| `notificacoes.service.ts` | Notificações | responsável pelo módulo Notificações |
| `report.service.ts` | Relatórios | responsável pelo módulo Relatórios |

## Estrutura esperada de cada service

```ts
import api from './api';
import { CLIENTES } from '@constants/endpoints';
import type { Cliente } from '@types/cliente';

export async function getClientes(): Promise<Cliente[]> {
  const { data } = await api.get<Cliente[]>(CLIENTES);
  return data;
}

export async function getClienteById(id: number): Promise<Cliente> {
  const { data } = await api.get<Cliente>(`${CLIENTES}/${id}`);
  return data;
}

export async function createCliente(payload: Omit<Cliente, 'id'>): Promise<Cliente> {
  const { data } = await api.post<Cliente>(CLIENTES, payload);
  return data;
}

export async function updateCliente(id: number, payload: Partial<Cliente>): Promise<Cliente> {
  const { data } = await api.put<Cliente>(`${CLIENTES}/${id}`, payload);
  return data;
}

export async function deleteCliente(id: number): Promise<void> {
  await api.delete(`${CLIENTES}/${id}`);
}
```
