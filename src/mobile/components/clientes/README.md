# Componentes — Módulo Clientes

**Responsável:** membro do grupo designado para o módulo Clientes.

Crie nesta pasta os componentes visuais específicos do módulo, por exemplo:

- `ClienteCard.tsx` — card com nome, CPF e telefone do cliente
- `ClienteListItem.tsx` — item de lista com navegação para o detalhe
- `ClienteForm.tsx` — formulário compartilhado entre criação e edição

## Orientações

- Componentes desta pasta **não** fazem chamadas HTTP — recebem os dados via props.
- Para campos de texto, reutilize `Input` de `@components/common`.
- Para contêineres visuais, reutilize `Card` de `@components/common`.
- Tipagem: use `Cliente` de `@types/cliente`.
