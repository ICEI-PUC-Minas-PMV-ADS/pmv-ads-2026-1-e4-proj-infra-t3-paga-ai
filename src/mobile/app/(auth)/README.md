# Módulo Autenticação (Usuários)

**Responsável:** membro do grupo designado para o módulo Usuários.

## O que implementar

| Arquivo | Descrição |
|---------|-----------|
| `login.tsx` | Formulário de login com e-mail e senha |

## Orientações

- Importe `Input` e `Button` de `@components/common` para montar o formulário.
- Use a função `login(user, token)` exposta pelo hook `useAuth` de `@hooks/useAuth` para persistir a sessão após autenticação bem-sucedida.
- Chame o endpoint `POST ${USUARIOS}/login` via a instância `api` de `@services/api` (ou crie `usuarios.service.ts` em `src/mobile/services/`).
- Após login bem-sucedido, a navegação para `/(tabs)` ocorre automaticamente pelo `_layout.tsx` raiz — não é necessário chamar `router.replace` manualmente.
- Tipagem do usuário retornado: `Usuario` de `@types/usuario`.
