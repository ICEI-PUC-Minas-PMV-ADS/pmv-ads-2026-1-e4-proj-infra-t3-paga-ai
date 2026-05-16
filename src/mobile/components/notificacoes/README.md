# Componentes — Módulo Notificações

**Responsável:** membro do grupo designado para o módulo Notificações.

Crie nesta pasta os componentes visuais específicos do módulo, por exemplo:

- `NotificacaoItem.tsx` — item de lista com distinção visual entre lida/não lida
- `BadgeContador.tsx` — badge numérico para exibir contagem de não lidas na aba

## Orientações

- Componentes desta pasta **não** fazem chamadas HTTP — recebem os dados via props e callbacks (`onMarcarLida`).
- Para contêineres visuais, reutilize `Card` de `@components/common`.
- Rota de API: `NOTIFICACOES` de `@constants/endpoints`.
