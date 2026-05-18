# Módulo Relatórios

**Responsável:** membro do grupo designado para o módulo Relatórios.

## O que implementar

| Arquivo | Descrição |
|---------|-----------|
| `index.tsx` | Exibição do sumário executivo retornado pelo endpoint de relatórios |

## Orientações

- Utilize o hook `useRelatorios` (a criar em `src/mobile/hooks/useRelatorios.ts`) para gerenciar estado (data, loading, error).
- O hook deve chamar `report.service.ts` (a criar em `src/mobile/services/report.service.ts`), que importa a instância `api` de `@services/api`.
- Importe `Card` e `LoadingSpinner` de `@components/common`.
- Rota de API: `REPORT` de `@constants/endpoints`.
- Considere usar gráficos simples (ex.: `react-native-chart-kit`) para visualização, se necessário.
