using MongoDB.Driver;
using Notificacoes.API.Models;

namespace Notificacoes.API.Repositories
{
    public class NotificacaoRepository : INotificacaoRepository
    {
        private readonly IMongoCollection<Notificacao> _notificacoes;

        public NotificacaoRepository(IMongoDatabase database)
        {
            _notificacoes = database.GetCollection<Notificacao>("notificacoes");
        }

        public async Task<List<Notificacao>> GetPorCobrador(string nomeCobrador)
        {
            return await _notificacoes
                .Find(x => x.Cobrador == nomeCobrador)
                .SortByDescending(x => x.DataCriacao)
                .ToListAsync();
        }

        public async Task<bool> MarcarComoLida(int id)
        {
            var result = await _notificacoes.UpdateOneAsync(
                x => x.Id == id,
                Builders<Notificacao>.Update.Set(x => x.Lida, true)
            );

            return result.MatchedCount > 0;
        }

        public async Task<bool> Delete(int id)
        {
            var result = await _notificacoes.DeleteOneAsync(x => x.Id == id);
            return result.DeletedCount > 0;
        }
    }
}
