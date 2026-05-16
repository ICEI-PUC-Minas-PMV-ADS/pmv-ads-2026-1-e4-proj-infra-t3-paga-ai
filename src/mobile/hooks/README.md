# Hooks — Instruções para cada responsável de módulo

Cada membro deve criar o arquivo `use[Modulo].ts` correspondente ao seu módulo **nesta pasta**.

## Responsabilidade dos hooks

Os hooks gerenciam o estado da UI (data, loading, error) e delegam as chamadas HTTP ao service correspondente. A tela **não** chama o service diretamente.

## Arquivos a criar

| Arquivo | Módulo |
|---------|--------|
| `useClientes.ts` | Clientes |
| `useEmprestimos.ts` | Empréstimos |
| `useNotificacoes.ts` | Notificações |
| `useRelatorios.ts` | Relatórios |

## Estrutura esperada

```ts
import { useState, useEffect, useCallback } from 'react';
import { getClientes } from '@services/clientes.service';
import type { Cliente } from '@types/cliente';

export function useClientes() {
  const [data, setData] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getClientes();
      setData(result);
    } catch {
      setError('Não foi possível carregar os clientes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
```
