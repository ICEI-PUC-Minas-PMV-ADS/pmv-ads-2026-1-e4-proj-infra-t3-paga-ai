# Módulo Empréstimos

**Responsável:** membro do grupo designado para o módulo Empréstimos.

## O que implementar

| Arquivo | Descrição |
|---------|-----------|
| `index.tsx` | Listagem de empréstimos com filtro por status |
| `[id].tsx` | Tela de detalhe de um empréstimo (parcelas, vencimento) |

## Orientações

- Utilize o hook `useEmprestimos` (a criar em `src/mobile/hooks/useEmprestimos.ts`) para gerenciar estado (data, loading, error).
- O hook deve chamar `emprestimos.service.ts` (a criar em `src/mobile/services/emprestimos.service.ts`), que importa a instância `api` de `@services/api`.
- Componentes visuais específicos do módulo devem ficar em `src/mobile/components/emprestimos/`.
- Importe `Button`, `Card` e `LoadingSpinner` de `@components/common`.
- Tipagem: use `Emprestimo` de `@types/emprestimo`.
- Rota de API: `EMPRESTIMOS` de `@constants/endpoints`.
