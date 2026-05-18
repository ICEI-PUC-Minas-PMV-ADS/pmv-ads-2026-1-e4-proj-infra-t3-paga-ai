using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using Notificacoes.API.Models;

namespace Notificacoes.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class NotificacoesController : ControllerBase
{
    private readonly IMongoCollection<Notificacao> _notificacoes;

    public NotificacoesController(IMongoDatabase database)
    {
        _notificacoes = database.GetCollection<Notificacao>("notificacoes");
    }

    [HttpGet("cobrador/{nomeCobrador}")]
    public async Task<ActionResult<IEnumerable<Notificacao>>> GetPorCobrador(string nomeCobrador)
    {
        var lista = await _notificacoes
            .Find(x => x.Cobrador == nomeCobrador)
            .SortByDescending(x => x.DataCriacao)
            .ToListAsync();

        return Ok(lista);
    }

    [HttpGet("cobrador/{nomeCobrador}/nao-lidas")]
    public async Task<IActionResult> GetNaoLidas(string nomeCobrador)
    {
        var count = await _notificacoes
            .CountDocumentsAsync(x => x.Cobrador == nomeCobrador && !x.Lida);

        return Ok(new { total = count });
    }

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

    [HttpPatch("cobrador/{nomeCobrador}/marcar-todas-lidas")]
    public async Task<IActionResult> MarcarTodasLidas(string nomeCobrador)
    {
        await _notificacoes.UpdateManyAsync(
            x => x.Cobrador == nomeCobrador && !x.Lida,
            Builders<Notificacao>.Update.Set(x => x.Lida, true)
        );

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