# Módulo Notificações

**Responsável:** membro do grupo designado para o módulo Notificações.

## O que implementar

| Arquivo | Descrição |
|---------|-----------|
| `index.tsx` | Listagem de notificações com distinção visual entre lidas e não lidas |

## Orientações

- Utilize o hook `useNotificacoes` (a criar em `src/mobile/hooks/useNotificacoes.ts`) para gerenciar estado (data, loading, error) e expor a função `marcarComoLida(id)`.
- O hook deve chamar `notificacoes.service.ts` (a criar em `src/mobile/services/notificacoes.service.ts`), que importa a instância `api` de `@services/api`.
- Componentes visuais específicos devem ficar em `src/mobile/components/notificacoes/`.
- Importe `Card` e `LoadingSpinner` de `@components/common`.
- Rota de API: `NOTIFICACOES` de `@constants/endpoints`.
