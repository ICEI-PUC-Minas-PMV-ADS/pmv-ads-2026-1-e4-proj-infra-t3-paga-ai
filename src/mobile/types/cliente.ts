export interface Cliente {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  endereco?: string;
  observacoes?: string;
  dataCadastro?: string;
}

export type ClientePayload = Omit<Cliente, 'id' | 'dataCadastro'>;

export const fmtCpf = (cpf: string) => {
  if (!cpf) return '';
  const d = cpf.replace(/\D/g, '');
  return d.length === 11
    ? d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    : cpf;
};

export const fmtTelefone = (tel: string) => {
  if (!tel) return '';
  const d = tel.replace(/\D/g, '');
  if (d.length === 11) return d.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  if (d.length === 10) return d.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  return tel;
};
