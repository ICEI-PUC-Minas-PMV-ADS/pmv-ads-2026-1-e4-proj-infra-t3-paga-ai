using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using backend.Models;
using MongoDB.Bson;


namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EmprestimosController : ControllerBase
{
    private readonly IMongoCollection<Emprestimo> _emprestimos;
    private readonly IMongoDatabase _db;

    public EmprestimosController (IMongoDatabase database)
    {
       _db = database;   
        _emprestimos = database.GetCollection<Emprestimo>("emprestimos");
    }

 // GET: Agora pede o cobrador para garantir que ele só veja o que é dele
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

    // 2. Cálculos Totais (DEFININDO AS VARIÁVEIS AQUI)
    var totalInvestido = emprestimos.Sum(x => x.Valor);
    var totalAReceberGeral = emprestimos.Sum(x => x.ValorFinal);
    var lucroTotalProjetado = totalAReceberGeral - totalInvestido;

    // 3. Cria uma lista detalhada com o lucro de cada devedor
    var detalhePorDevedor = emprestimos.Select(e => new {
        Devedor = e.Cliente,
        ValorEmprestado = e.Valor,
        ValorComJuros = e.ValorFinal,
        LucroDesteEmprestimo = e.ValorFinal - e.Valor,
        Status = e.Pago ? "Recebido" : "Pendente"
    });

    // 4. Retorno usando as variáveis declaradas acima
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

        // Se o usuário mandar 30 em vez de 0.30, nós corrigimos:
        if (novo.TaxaJuros > 1) novo.TaxaJuros = novo.TaxaJuros / 100;
    
        // Se não mandar nada, assume 30%
        if (novo.TaxaJuros == 0) novo.TaxaJuros = 0.30m;

        // Cálculo correto: 1500 * (1 + 0.30) = 1950
        novo.ValorFinal = novo.Valor * (1 + novo.TaxaJuros);   
        novo.DataEmprestimo = DateTime.UtcNow; 
        novo.DataVencimento = DateTime.UtcNow.AddDays(30);
        novo.Pago = false;
        
        await _emprestimos.InsertOneAsync(novo);
        // INTERLIGAÇÃO: Cria uma notificação automática de "Empréstimo Realizado"
       // 4. ACESSA A COLEÇÃO DE NOTIFICAÇÕES (mesmo banco, outra tabela)
    // Usamos o banco de dados que já injetamos no construtor
    var database = _emprestimos.Database; 
   // 1. Pega a coleção usando a Classe (não BsonDocument)
var colNotificacoes = _db.GetCollection<Notificacao>("notificacoes");

// 2. Busca o último ID das notificações para fazer o +1
var ultima = await colNotificacoes.Find(_ => true)
    .SortByDescending(x => x.Id)
    .FirstOrDefaultAsync();

// 3. Cria o objeto já com o ID correto (int)
var novaNotif = new Notificacao 
{
    Id = (ultima == null) ? 1 : ultima.Id + 1,
    ClienteId = novo.ClienteId,
    Cobrador = novo.Cobrador,
    Mensagem = $"Novo empréstimo de {novo.Valor:C} criado para {novo.Cliente}.",
    DataCriacao = DateTime.UtcNow,
    Lida = false
};

// 4. Salva no banco
await colNotificacoes.InsertOneAsync(novaNotif);
      
        return CreatedAtAction(nameof(Get), new { id = novo.Id, nomeCobrador = novo.Cobrador }, novo);
    }

    [HttpPut("{id:int}/{nomeCobrador}")]
    public async Task<IActionResult> Update(int id, string nomeCobrador, Emprestimo atualizado)
    {
        atualizado.Id = id;
        atualizado.Cobrador = nomeCobrador;

    // Repete a lógica de segurança da taxa no Update também
    if (atualizado.TaxaJuros >= 1) atualizado.TaxaJuros = atualizado.TaxaJuros / 100;
    if (atualizado.TaxaJuros <= 0) atualizado.TaxaJuros = 0.30m;

    // Recalcula o valor final caso o valor emprestado tenha mudado
    atualizado.ValorFinal = atualizado.Valor * (1 + atualizado.TaxaJuros);

    // Substitui apenas se ID e Cobrador baterem (Segurança)
    var result = await _emprestimos.ReplaceOneAsync(
        x => x.Id == id && x.Cobrador == nomeCobrador, 
        atualizado
    );
    
    if (result.MatchedCount == 0) return NotFound(new { mensagem = "Empréstimo não encontrado para este cobrador." });

    return NoContent();
}

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, string nomeCobrador)
    {
        var result = await _emprestimos.DeleteOneAsync(x => x.Id == id && x.Cobrador == nomeCobrador);
        if (result.DeletedCount == 0) return NotFound();
        return NoContent();
    }   
    [HttpPatch("{id:int}/pagar/{nomeCobrador}")]
    public async Task<IActionResult> MarcarComoPago(int id, string nomeCobrador)
    {
    // Filtro duplo: ID correto E pertence ao cobrador logado
    var filter = Builders<Emprestimo>.Filter.And(
        Builders<Emprestimo>.Filter.Eq(x => x.Id, id),
        Builders<Emprestimo>.Filter.Eq(x => x.Cobrador, nomeCobrador)
    );


    // Agora atualiza o status E a data do recebimento
    var update = Builders<Emprestimo>.Update
        .Set(x => x.Pago, true)
        .Set(x => x.DataPagamento, DateTime.UtcNow); 

    // 3. EXECUTAR E PEGAR O RESULTADO (Usando o nome correto da variável)
    var emprestimoAtualizado = await _emprestimos.FindOneAndUpdateAsync(
        filter, 
        update, 
        new FindOneAndUpdateOptions<Emprestimo> { ReturnDocument = ReturnDocument.After }
    );

    // Se não achou nada, sai fora
    if (emprestimoAtualizado is null) 
        return NotFound(new { mensagem = "Empréstimo não encontrado." });

    // 4. GERAR NOTIFICAÇÃO (Usando '_db' que definimos no construtor)
    var colNotificacoes = _db.GetCollection<BsonDocument>("notificacoes");
    
    var notificacaoPagamento = new BsonDocument 
{
    { "ClienteId", emprestimoAtualizado.ClienteId },
    { "Cobrador", nomeCobrador },
    { "Mensagem", $"💰 RECEBIDO: {emprestimoAtualizado.Cliente} pagou o ID {id} hoje!" },
    { "Data", DateTime.UtcNow },
    { "Tipo", "PagamentoRecebido" }
};

    await colNotificacoes.InsertOneAsync(notificacaoPagamento);

    return Ok(new { mensagem = $"O cliente {emprestimoAtualizado.Cliente} pagou com sucesso em {DateTime.Now:dd/MM/yyyy HH:mm}!" });
    
}
}