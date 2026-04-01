using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using backend.Models;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EmprestimosController : ControllerBase
{
    private readonly IMongoCollection<Emprestimo> _emprestimos;

    public EmprestimosController (IMongoDatabase database)
    {
        
        _emprestimos = database.GetCollection<Emprestimo>("emprestimos");
    }

   [HttpGet("{id:int}")]
    public async Task<ActionResult<Emprestimo>> Get(int id)
    { 
        var emprestimo = await _emprestimos.Find(x => x.Id == id).FirstOrDefaultAsync();
        
        if (emprestimo is null)
            return NotFound(new {mensagem = $"Empréstimo com ID {id} não encontrado."});

        return Ok(emprestimo);
    }

     [HttpGet("carteira/{nomeCobrador}")]
    public async Task<ActionResult<IEnumerable<Emprestimo>>> GetCarteira(string nomeCobrador)
    {
        // Busca apenas o que pertence a esse cobrador e não foi pago
        var lista = await _emprestimos
            .Find(x => x.Cobrador == nomeCobrador && !x.Pago)
            .SortBy(x => x.DataVencimento)
            .ToListAsync();

        return Ok(lista);
    }

    [HttpGet("relatorio-lucro/{nomeCobrador}")]
public async Task<IActionResult> GetRelatorioLucro(string nomeCobrador)
{
    // 1. Busca todos os empréstimos desse cobrador
    var emprestimos = await _emprestimos
        .Find(x => x.Cobrador == nomeCobrador)
        .ToListAsync();

    // 2. Cria uma lista detalhada com o lucro de cada devedor
    var detalhePorDevedor = emprestimos.Select(e => new {
        Devedor = e.Cliente,
        ValorEmprestado = e.Valor,
        ValorComJuros = e.ValorFinal,
        LucroDesteEmprestimo = e.ValorFinal - e.Valor, // Os 30% deste cara
        Status = e.Pago ? "Recebido" : "Pendente"
    });

    // 3. Cálculos Totais (O "Final de Tudo")
    var totalInvestido = emprestimos.Sum(x => x.Valor);
    var totalAReceber = emprestimos.Sum(x => x.ValorFinal);
    var lucroTotalSeGeralPagar = totalAReceber - totalInvestido;

    return Ok(new {
        Cobrador = nomeCobrador,
        ResumoGeral = new {
            InvestimentoTotal = totalInvestido,
            RecebimentoTotalGeral = totalAReceber,
            LucroTotalProjetado = lucroTotalSeGeralPagar
        },
        ListaDetalhada = detalhePorDevedor
    });
}
    [HttpPost]
    public async Task<IActionResult> Post(Emprestimo novo)
    {
        // 1. Lógica de Auto-Incremento: Busca o maior ID atual no Atlas
    var ultimoEmprestimo = await _emprestimos.Find(_ => true)
                                             .SortByDescending(x => x.Id)
                                             .FirstOrDefaultAsync();
    
    // Se não existir nenhum, começa no 1. Se existir, soma +1 ao maior.
    novo.Id = (ultimoEmprestimo == null) ? 1 : ultimoEmprestimo.Id + 1;

    // 2. Sua Lógica de Negócio
    if (novo.TaxaJuros == 0) novo.TaxaJuros = 0.30m;

    novo.ValorFinal = novo.Valor * (1 + novo.TaxaJuros);
    
    // Dica: Use UtcNow para evitar confusão de fuso horário no Azure
    novo.DataEmprestimo = DateTime.UtcNow; 
    novo.DataVencimento = DateTime.UtcNow.AddDays(30);
    novo.Pago = false;
    
    await _emprestimos.InsertOneAsync(novo);
    
    return CreatedAtAction(nameof(Get), new { id = novo.Id }, novo);
    }

    [HttpPut("{id:int}")]
public async Task<IActionResult> Update(int id, Emprestimo emprestimoAtualizado)
{
    // 1. Garante que o ID da URL seja o mesmo do objeto
    emprestimoAtualizado.Id = id;

    // 2. Recalcula os valores (Regra de Negócio)
    if (emprestimoAtualizado.TaxaJuros == 0) emprestimoAtualizado.TaxaJuros = 0.30m;
    emprestimoAtualizado.ValorFinal = emprestimoAtualizado.Valor * (1 + emprestimoAtualizado.TaxaJuros);

    // 3. Tenta substituir no MongoDB Atlas
    var result = await _emprestimos.ReplaceOneAsync(x => x.Id == id, emprestimoAtualizado);
    
    if (result.MatchedCount == 0) return NotFound();

    return NoContent();
}

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _emprestimos.DeleteOneAsync(x => x.Id == id);

        if (result.DeletedCount == 0) return NotFound();

        return NoContent();
    }   
    [HttpPatch("{id:int}/pagar")]
    public async Task<IActionResult> MarcarComoPago(int id)
    {
        var filter = Builders<Emprestimo>.Filter.Eq(x => x.Id, id);
        var update = Builders<Emprestimo>.Update
            .Set(x => x.Pago, true)
            .Set(x => x.DataPagamento, DateTime.Now);

        var result =await _emprestimos.UpdateOneAsync(filter, update);

        if (result.MatchedCount == 0) return NotFound(new { mensagem = "Empréstimo não encontrado." });

        return Ok(new { mensagem = $"Empréstimo {id} marcado como Pago com sucesso!" });
    }
}