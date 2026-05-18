export interface Parcela {
  numero: number;
  valor: number;
  dataVencimento: string;   // ISO 8601
  pago: boolean;
  dataPagamento?: string;   // ISO 8601 — preenchido quando pago
}
 
// StatusPagamento enum (backend): Pendente = 0, Pago = 2
export enum StatusPagamento {
  Pendente = 0,
  Pago     = 2,
}
 
export interface Emprestimo {
  id: number;
  clienteId: number;
  cliente: string;          // campo exato do backend — sem alias
  cobrador: string;
  valor: number;
  taxaJuros: number;        // decimal: 0.30 = 30% — já vem convertido
  valorFinal: number;       // valor * (1 + taxaJuros)
  valorParcela: number;
  numeroParcelas: number;
  parcelas: Parcela[];
  dataEmprestimo: string;   // ISO 8601
  dataVencimento: string;   // ISO 8601 — primeiro vencimento
  pago: boolean;
  dataPagamento?: string;   // ISO 8601 — preenchido quando todas pagas
  status: StatusPagamento;
}
 
// ─── Status calculado no front (igual à lógica do web) ───────────────────────
 
export type StatusDisplay = 'Em aberto' | 'Vencendo' | 'Em atraso' | 'Pago';
 
/**
 * Replica exata da função calcularStatus() do Emprestimos.jsx web:
 *   pago        → "Pago"
 *   diff < 0    → "Em atraso"
 *   diff <= 5   → "Vencendo"
 *   else        → "Em aberto"
 */
export function calcularStatusDisplay(emprestimo: Emprestimo): StatusDisplay {
  if (emprestimo.pago) return 'Pago';
  const diff = Math.ceil(
    (new Date(emprestimo.dataVencimento).getTime() - Date.now()) / 86_400_000,
  );
  if (diff < 0)  return 'Em atraso';
  if (diff <= 5) return 'Vencendo';
  return 'Em aberto';
}
 
// ─── Helpers de formatação ────────────────────────────────────────────────────
 
export const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
 
export const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('pt-BR') : '—';
 
export const fmtDateCurta = (d?: string) =>
  d
    ? new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    : '—';
