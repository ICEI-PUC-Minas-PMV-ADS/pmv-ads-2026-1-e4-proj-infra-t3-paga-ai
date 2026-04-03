using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using backend.Models;

[ApiController]
[Route("api/[controller]")]

public class NotificacoesController : ControllerBase
{
    private readonly IMongoCollection<Notificacao> _notificacoes;

    public NotificacoesController(IMongoDatabase database)
    {
        _notificacoes = database.GetCollection<Notificacao>("notificacoes");
    }

    [HttpGet]
    public async Task<ActionResult<List<Notificacao>>> GetAll()
    {
        var notificacoes = await _notificacoes.Find(x => true).ToListAsync();
        return Ok(notificacoes);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Notificacao>> Get(string id)
    {
        var notificacao = await _notificacoes.Find(x => x.Id == id).FirstOrDefaultAsync();
        if (notificacao == null)
        {
            return NotFound();
        }

        return notificacao;

    }

    [HttpPost]
    public async Task<IActionResult> Post(Notificacao novo)
    {
        await _notificacoes.InsertOneAsync(novo);
        return Ok(novo);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, Notificacao notificacaoLida)
    {
        var notificacao = await _notificacoes.Find(x => x.Id == id).FirstOrDefaultAsync();

        if (notificacao == null) return NotFound();

        notificacaoLida.Id = notificacao.Id;

        await _notificacoes.ReplaceOneAsync(x => x.Id == id, notificacaoLida);

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var resultado = await _notificacoes.DeleteOneAsync(x => x.Id == id);

        if (resultado.DeletedCount == 0)
            return NotFound();

        return NoContent();
    }
}
