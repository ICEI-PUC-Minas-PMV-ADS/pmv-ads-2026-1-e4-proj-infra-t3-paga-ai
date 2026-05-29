import api from './api';
import { REPORT } from '@constants/endpoints';

export interface RelatorioDevedor {
  devedor: string;
  quantidade: number;
  totalEmprestado: number;
  recebido: number;
  pendente: number;
  taxaMedia: number;
}

export interface PagamentoRecente {
  data: string;
  devedor: string;
  valor: number;
  metodo: string;
  referencia: string;
  status: string;
}

export interface Relatorio {
  totalEmprestado: number;
  totalRecebido: number;
  totalPendente: number;
  lucroTotal: number;
  emprestimosPorDevedor: RelatorioDevedor[];
  pagamentosRecentes: PagamentoRecente[];
}

export async function getRelatorio(
  dataInicio: string,
  dataFim: string,
  cobrador?: string
): Promise<Relatorio> {
  const { data } = await api.get<Relatorio>(REPORT, {
    params: { dataInicio, dataFim, cobrador },
  });
  return data;
}

export async function exportarPdf(
  dataInicio: string,
  dataFim: string,
  cobrador?: string
): Promise<string> {
  const response = await api.post(
    `${REPORT}/export-pdf`,
    { dataInicio, dataFim, cobrador },
    { responseType: 'arraybuffer' }
  );
  return response.data;
}
