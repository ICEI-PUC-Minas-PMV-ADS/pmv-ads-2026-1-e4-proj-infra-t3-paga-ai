// Centraliza todos os endereços e rotas do Gateway — nenhum outro arquivo deve hardcodar URLs.

export const BASE_URL = 'https://paga-ai-gateway.azurewebsites.net';
export const DEV_BASE_URL = 'http://localhost:5046';

export const USUARIOS = '/api/usuarios';
export const CLIENTES = '/api/clientes';
export const EMPRESTIMOS = '/api/emprestimos';
export const NOTIFICACOES = '/api/notificacoes';
export const REPORT = '/api/report';
