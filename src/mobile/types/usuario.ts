// Tipo compartilhado que representa um usuário autenticado no sistema.

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  dataNascimento?: string;
  cpf?: string;
  telefone?: string;
}
