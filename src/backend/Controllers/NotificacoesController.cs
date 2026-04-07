using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using backend.Models;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class NotificacoesController : ControllerBase
{
    private readonly IMongoCollection<Notificacao> _notificacoes;

    public NotificacoesController(IMongoDatabase database)
    {
        _notificacoes = database.GetCollection<Notificacao>("notificacoes");
    }

    // 1. Lista TODAS (Útil para o admin)
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Notificacao>>> Get()
    {
        var lista = await _notificacoes.Find(_ => true).ToListAsync();
        return Ok(lista);
    }

    // 2. Busca notificações de um COBRADOR específico (O seu foco!)
    // Rota: api/notificacoes/cobrador/Marcos24
    [HttpGet("cobrador/{nomeCobrador}")]
    public async Task<ActionResult<IEnumerable<Notificacao>>> GetPorCobrador(string nomeCobrador)
    {
        var lista = await _notificacoes
            .Find(x => x.Cobrador == nomeCobrador)
            .SortByDescending(x => x.DataCriacao)
            .ToListAsync();

        return Ok(lista);
    }

    // 3. Marca como lida (PATCH é melhor que PUT aqui)
    [HttpPatch("{id:int}/lida")]
    public async Task<IActionResult> MarcarComoLida(int id)
    {
        var result = await _notificacoes.UpdateOneAsync(
            x => x.Id == id, 
            Builders<Notificacao>.Update.Set(x => x.Lida, true)
        );

        if (result.MatchedCount == 0) return NotFound();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var resultado = await _notificacoes.DeleteOneAsync(x => x.Id == id);
        if (resultado.DeletedCount == 0) return NotFound();
        return NoContent();
    }
}
