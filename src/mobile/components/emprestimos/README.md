# Componentes — Módulo Empréstimos

**Responsável:** membro do grupo designado para o módulo Empréstimos.

Crie nesta pasta os componentes visuais específicos do módulo, por exemplo:

- `EmprestimoCard.tsx` — card com valor, parcelas e status do empréstimo
- `EmprestimoListItem.tsx` — item de lista com navegação para o detalhe
- `StatusBadge.tsx` — badge colorido indicando o status (ativo, quitado, em atraso)

## Orientações

- Componentes desta pasta **não** fazem chamadas HTTP — recebem os dados via props.
- Para contêineres visuais, reutilize `Card` de `@components/common`.
- Tipagem: use `Emprestimo` de `@types/emprestimo`.
