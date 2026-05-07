import api from './api';
export const loanService = {
  getCarteira: (nome) => 
    api.get(`api/Emprestimos/carteira/${nome}`),

  getRelatorioLucro: (nome) => 
    api.get(`api/Emprestimos/relatorio-lucro/${nome}`),

  solicitar: (dados) => 
    api.post('api/Emprestimos', dados),

  marcarComoPago: (id, nome) => 
    api.patch(`api/Emprestimos/${id}/pagar/${nome}`)
};
//export const loanService = {
  // Rota: Upstream do Ocelot + Rota do Controller C#
//  getCarteira: (nome) => 
//    api.get(`backend/Emprestimos/carteira/${nome}`),

//  getRelatorioLucro: (nome) => 
//    api.get(`backend/Emprestimos/api/Emprestimos/relatorio-lucro/${nome}`),

//  solicitar: (dados) => 
//    api.post('backend/Emprestimos/api/Emprestimos', dados),

//  marcarComoPago: (id, nome) => 
//    api.patch(`backend/Emprestimos/api/Emprestimos/${id}/pagar/${nome}`)
//};
