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

   [HttpGet]
    public async Task<ActionResult<Emprestimo>> Get(int id)
    { 
        var emprestimo = await _emprestimos.Find(x => x.Id == id).FirstOrDefaultAsync();
        return emprestimo is null ? NotFound() : emprestimo;
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
        // Lógica de Negócio: Se não informar taxa, aplica os 30%
         if (novo.TaxaJuros == 0) novo.TaxaJuros = 0.30m;

         novo.ValorFinal = novo.Valor * (1 + novo.TaxaJuros);
         novo.DataVencimento = DateTime.Now.AddDays(30);
         novo.Pago = false;
        
        await _emprestimos.InsertOneAsync(novo);
        return CreatedAtAction(nameof(Get), new { id = novo.Id }, novo);
    }

    [HttpPut("{id:int}")]
public async Task<IActionResult> Update(int id, Emprestimo emprestimoAtualizado)
{
    // Garante que o ID da URL seja o mesmo do objeto para não corromper o banco
    emprestimoAtualizado.Id = id;

    // Tenta substituir direto
    var result = await _emprestimos.ReplaceOneAsync(x => x.Id == id, emprestimoAtualizado);
    
    // Se não encontrou ninguém com esse ID no banco
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
}