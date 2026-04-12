using Notificacoes.API.Models;

namespace Notificacoes.API.Repositories
{
    public interface INotificacaoRepository
    {
        Task<List<Notificacao>> GetPorCobrador(string nomeCobrador);
        Task<bool> MarcarComoLida(int id);
        Task<bool> Delete(int id);
    }
}