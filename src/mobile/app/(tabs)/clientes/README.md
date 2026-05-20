# Módulo Clientes

**Responsável:** membro do grupo designado para o módulo Clientes.

## O que implementar

| Arquivo | Descrição |
|---------|-----------|
| `index.tsx` | Listagem de clientes com busca e paginação |
| `[id].tsx` | Tela de detalhe e edição de um cliente específico |

## Orientações

- Utilize o hook `useClientes` (a criar em `src/mobile/hooks/useClientes.ts`) para gerenciar estado (data, loading, error).
- O hook deve chamar `clientes.service.ts` (a criar em `src/mobile/services/clientes.service.ts`), que importa a instância `api` de `@services/api`.
- Componentes visuais específicos do módulo devem ficar em `src/mobile/components/clientes/`.
- Importe `Button`, `Input`, `Card` e `LoadingSpinner` de `@components/common`.
- Tipagem: use `Cliente` de `@types/cliente`.
- Rota de API: `CLIENTES` de `@constants/endpoints`.
