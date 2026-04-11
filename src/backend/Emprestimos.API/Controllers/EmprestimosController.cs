using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using MongoDB.Bson;
using Emprestimos.API.Models;

namespace Emprestimos.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EmprestimosController : ControllerBase
{
    private readonly IMongoCollection<Emprestimo> _emprestimos;
    private readonly IMongoDatabase _db;

    // Construtor único unificado
    public EmprestimosController(IMongoDatabase database)
    {
        _db = database;
        _emprestimos = database.GetCollection<Emprestimo>("emprestimos");
    }

    [HttpGet("{id:int}/{nomeCobrador}")]
    public async Task<ActionResult<Emprestimo>> Get(int id, string nomeCobrador)
    { 
        var emprestimo = await _emprestimos
            .Find(x => x.Id == id && x.Cobrador == nomeCobrador)
            .FirstOrDefaultAsync();
        
        if (emprestimo is null)
            return NotFound(new { mensagem = $"Empréstimo {id} não encontrado para o cobrador {nomeCobrador}." });

        return Ok(emprestimo);
    }

    [HttpGet("carteira/{nomeCobrador}")]
    public async Task<ActionResult<IEnumerable<Emprestimo>>> GetCarteira(string nomeCobrador)
    {
        var lista = await _emprestimos
            .Find(x => x.Cobrador == nomeCobrador && !x.Pago)
            .SortBy(x => x.DataVencimento)
            .ToListAsync();

        return Ok(lista);
    }

    [HttpGet("relatorio-lucro/{nomeCobrador}")]
    public async Task<IActionResult> GetRelatorioLucro(string nomeCobrador)
    {
        var emprestimos = await _emprestimos.Find(x => x.Cobrador == nomeCobrador).ToListAsync();

        var totalInvestido = emprestimos.Sum(x => x.Valor);
        var totalAReceberGeral = emprestimos.Sum(x => x.ValorFinal);
        var lucroTotalProjetado = totalAReceberGeral - totalInvestido;

        var detalhePorDevedor = emprestimos.Select(e => new {
            Devedor = e.Cliente,
            ValorEmprestado = e.Valor,
            ValorComJuros = e.ValorFinal,
            LucroDesteEmprestimo = e.ValorFinal - e.Valor,
            Status = e.Pago ? "Recebido" : "Pendente"
        });

        return Ok(new {
            Cobrador = nomeCobrador,
            ResumoGeral = new {
                InvestimentoTotal = totalInvestido,
                RecebimentoTotalGeral = totalAReceberGeral,
                LucroTotalProjetado = lucroTotalProjetado
            },
            ListaDetalhada = detalhePorDevedor
        });
    }

    [HttpPost]
    public async Task<IActionResult> Post(Emprestimo novo)
    {
        var ultimoEmprestimo = await _emprestimos.Find(_ => true).SortByDescending(x => x.Id).FirstOrDefaultAsync();
        novo.Id = (ultimoEmprestimo == null) ? 1 : ultimoEmprestimo.Id + 1;

        if (novo.TaxaJuros > 1) novo.TaxaJuros = novo.TaxaJuros / 100;
        if (novo.TaxaJuros == 0) novo.TaxaJuros = 0.30m;

        novo.ValorFinal = novo.Valor * (1 + novo.TaxaJuros);   
        novo.DataEmprestimo = DateTime.UtcNow; 
        novo.DataVencimento = DateTime.UtcNow.AddDays(30);
        novo.Pago = false;
        
        await _emprestimos.InsertOneAsync(novo);

        // NOTIFICAÇÃO DE NOVO EMPRÉSTIMO
        var colNotificacoes = _db.GetCollection<Notificacao>("notificacoes");
        var ultima = await colNotificacoes.Find(_ => true).SortByDescending(x => x.Id).FirstOrDefaultAsync();

        var novaNotif = new Notificacao 
        {
            Id = (ultima == null) ? 1 : ultima.Id + 1,
            ClienteId = novo.ClienteId,
            ClienteNome = novo.Cliente,
            Cobrador = novo.Cobrador,
            Valor = novo.ValorFinal,
            DataVencimento = novo.DataVencimento,
            Tipo = "Cobrança",
            DataCriacao = DateTime.UtcNow,
            Lida = false,
            Mensagem = $"Novo empréstimo criado para {novo.Cliente}"
        };

        await colNotificacoes.InsertOneAsync(novaNotif);
      
        return CreatedAtAction(nameof(Get), new { id = novo.Id, nomeCobrador = novo.Cobrador }, novo);
    }

    [HttpPatch("{id:int}/pagar/{nomeCobrador}")]
    public async Task<IActionResult> MarcarComoPago(int id, string nomeCobrador)
    {
        var filter = Builders<Emprestimo>.Filter.And(
            Builders<Emprestimo>.Filter.Eq(x => x.Id, id),
            Builders<Emprestimo>.Filter.Eq(x => x.Cobrador, nomeCobrador)
        );

        var update = Builders<Emprestimo>.Update
            .Set(x => x.Pago, true)
            .Set(x => x.DataPagamento, DateTime.UtcNow); 

        var emprestimoAtualizado = await _emprestimos.FindOneAndUpdateAsync(
            filter, 
            update, 
            new FindOneAndUpdateOptions<Emprestimo> { ReturnDocument = ReturnDocument.After }
        );

        if (emprestimoAtualizado is null) 
            return NotFound(new { mensagem = "Empréstimo não encontrado." });

        // NOTIFICAÇÃO DE PAGAMENTO RECEBIDO
        var colNotificacoes = _db.GetCollection<Notificacao>("notificacoes");
        var ultima = await colNotificacoes.Find(_ => true).SortByDescending(x => x.Id).FirstOrDefaultAsync();

        var notificacaoPagamento = new Notificacao 
        {
            Id = (ultima == null) ? 1 : ultima.Id + 1,
            ClienteId = emprestimoAtualizado.ClienteId,
            ClienteNome = emprestimoAtualizado.Cliente,
            Cobrador = nomeCobrador,
            Valor = emprestimoAtualizado.ValorFinal,
            Tipo = "Pagamento",
            Data = DateTime.UtcNow,
            Lida = false,
            Mensagem = $"💰 RECEBIDO: {emprestimoAtualizado.Cliente} pagou {emprestimoAtualizado.ValorFinal:C} hoje!"
        };

        await colNotificacoes.InsertOneAsync(notificacaoPagamento);

        return Ok(new { mensagem = "Pagamento registrado com sucesso!", dados = emprestimoAtualizado });
    }

    [HttpDelete("{id:int}/{nomeCobrador}")]
    public async Task<IActionResult> Delete(int id, string nomeCobrador)
    {
        var result = await _emprestimos.DeleteOneAsync(x => x.Id == id && x.Cobrador == nomeCobrador);
        if (result.DeletedCount == 0) return NotFound();
        return NoContent();
    }
}
