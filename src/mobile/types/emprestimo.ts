// Tipo compartilhado que representa um empréstimo registrado no sistema.

export interface Emprestimo {
  id: number;
  clienteId: number;
  valor: number;
  parcelas: number;
  status: string;
  dataCriacao: string;
}
