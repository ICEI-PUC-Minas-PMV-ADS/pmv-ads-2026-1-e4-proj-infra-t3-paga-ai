import axios from 'axios';

const api = axios.create({
    baseURL: 'https://notificacoe-ezdecvdvhfe8becj.eastus-01.azurewebsites.net',
    headers: { 'Content-Type': 'application/json' },
});

export type NotificacaoAPI = {
    id: number;
    clienteId: number;
    clienteNome: string;
    cobrador: string;
    mensagem: string | null;
    lida: boolean;
    data: string;
    dataCriacao: string;
    emprestimoId: number | null;
    tipo: string;
    valor: number;
    dataVencimento: string;
    numeroParcela: number;
    totalParcelas: number;
};

export async function getNotificacoesPorCobrador(
    nomeCobrador: string
): Promise<NotificacaoAPI[]> {
    const response = await api.get(`/api/Notificacoes/cobrador/${encodeURIComponent(nomeCobrador)}`);
    return response.data;
}

export async function getNaoLidas(nomeCobrador: string): Promise<number> {
    const response = await api.get(`/api/Notificacoes/cobrador/${encodeURIComponent(nomeCobrador)}/nao-lidas`);
    return response.data.total;
}

export async function marcarComoLida(id: number): Promise<void> {
    await api.patch(`/api/Notificacoes/${id}/lida`);
}

export async function marcarTodasLidas(nomeCobrador: string): Promise<void> {
    await api.patch(`/api/Notificacoes/cobrador/${encodeURIComponent(nomeCobrador)}/marcar-todas-lidas`);
}

export async function deletarNotificacao(id: number): Promise<void> {
    await api.delete(`/api/Notificacoes/${id}`);
}