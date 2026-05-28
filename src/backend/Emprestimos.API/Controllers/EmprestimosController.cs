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

    if (novo.NumeroParcelas <= 0) novo.NumeroParcelas = 1;

    // Juros simples: ValorFinal = Valor * (1 + TaxaJuros)
    novo.ValorFinal = novo.Valor * (1 + novo.TaxaJuros);
    novo.ValorParcela = Math.Round(novo.ValorFinal / novo.NumeroParcelas, 2);

    novo.DataEmprestimo = DateTime.UtcNow;

    // Se não informou primeiro vencimento, assume 30 dias
    if (novo.DataVencimento == default)
        novo.DataVencimento = DateTime.UtcNow.AddDays(30);

    // Gera as parcelas a cada 30 dias a partir do primeiro vencimento
    novo.Parcelas = new List<Parcela>();
    for (int i = 0; i < novo.NumeroParcelas; i++)
    {
        novo.Parcelas.Add(new Parcela
        {
            Numero = i + 1,
            Valor = novo.ValorParcela,
            DataVencimento = novo.DataVencimento.AddDays(30 * i),
            Pago = false
        });
    }

    novo.Pago = false;

    await _emprestimos.InsertOneAsync(novo);

    // NOTIFICAÇÃO ÚNICA DE NOVO EMPRÉSTIMO
    var colNotificacoes = _db.GetCollection<Notificacao>("notificacoes");
    var ultima = await colNotificacoes.Find(_ => true).SortByDescending(x => x.Id).FirstOrDefaultAsync();

    var mensagem = novo.NumeroParcelas == 1
        ? $"Novo empréstimo criado para {novo.Cliente} — vence em {novo.DataVencimento:dd/MM/yyyy}"
        : $"Novo empréstimo criado para {novo.Cliente} — {novo.NumeroParcelas}x de {novo.ValorParcela:C}, primeiro vencimento em {novo.DataVencimento:dd/MM/yyyy}";

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
        Mensagem = mensagem
    };

    await colNotificacoes.InsertOneAsync(novaNotif);
        await EnviarPushAsync(novo.Cobrador, "Novo Empréstimo", mensagem);

        return CreatedAtAction(nameof(Get), new { id = novo.Id, nomeCobrador = novo.Cobrador }, novo);
}
[HttpPatch("{id:int}/pagar/{nomeCobrador}")]
public async Task<IActionResult> MarcarComoPago(int id, string nomeCobrador)
{
    var emprestimo = await _emprestimos
        .Find(x => x.Id == id && x.Cobrador == nomeCobrador)
        .FirstOrDefaultAsync();

    if (emprestimo is null)
        return NotFound(new { mensagem = "Empréstimo não encontrado." });

    // Encontra a próxima parcela pendente
    var parcelaPendente = emprestimo.Parcelas
        .Where(p => !p.Pago)
        .OrderBy(p => p.Numero)
        .FirstOrDefault();

    if (parcelaPendente != null)
    {
        parcelaPendente.Pago = true;
        parcelaPendente.DataPagamento = DateTime.UtcNow;
    }

    // Verifica se todas as parcelas foram pagas
    bool todasPagas = emprestimo.Parcelas.All(p => p.Pago);

    var filter = Builders<Emprestimo>.Filter.And(
        Builders<Emprestimo>.Filter.Eq(x => x.Id, id),
        Builders<Emprestimo>.Filter.Eq(x => x.Cobrador, nomeCobrador)
    );

    var update = Builders<Emprestimo>.Update
        .Set(x => x.Parcelas, emprestimo.Parcelas)
        .Set(x => x.Pago, todasPagas)
        .Set(x => x.Status, todasPagas ? StatusPagamento.Pago : StatusPagamento.Pendente)
        .Set(x => x.DataPagamento, todasPagas ? DateTime.UtcNow : (DateTime?)null);

    var emprestimoAtualizado = await _emprestimos.FindOneAndUpdateAsync(
        filter,
        update,
        new FindOneAndUpdateOptions<Emprestimo> { ReturnDocument = ReturnDocument.After }
    );

    if (emprestimoAtualizado is null)
        return NotFound(new { mensagem = "Empréstimo não encontrado." });

    // NOTIFICAÇÃO DE PAGAMENTO
    var colNotificacoes = _db.GetCollection<Notificacao>("notificacoes");
    var ultima = await colNotificacoes.Find(_ => true).SortByDescending(x => x.Id).FirstOrDefaultAsync();

    var parcelasPagas = emprestimoAtualizado.Parcelas.Count(p => p.Pago);
    var totalParcelas = emprestimoAtualizado.NumeroParcelas;

    var mensagem = todasPagas
        ? $"💰 RECEBIDO: {emprestimoAtualizado.Cliente} quitou o empréstimo!"
        : $"💰 RECEBIDO: {emprestimoAtualizado.Cliente} pagou parcela {parcelasPagas}/{totalParcelas} — {emprestimoAtualizado.ValorParcela:C}";

    var notificacaoPagamento = new Notificacao
    {
        Id = (ultima == null) ? 1 : ultima.Id + 1,
        ClienteId = emprestimoAtualizado.ClienteId,
        ClienteNome = emprestimoAtualizado.Cliente,
        Cobrador = nomeCobrador,
        Valor = emprestimoAtualizado.ValorParcela,
        Tipo = "Pagamento",
        Data = DateTime.UtcNow,
        Lida = false,
        Mensagem = mensagem,
        NumeroParcela = parcelasPagas,      
        TotalParcelas = totalParcelas        
};
    

    await colNotificacoes.InsertOneAsync(notificacaoPagamento);
        await EnviarPushAsync(nomeCobrador, "Pagamento Recebido", mensagem);

        var parcelasPendentes = emprestimoAtualizado.Parcelas.Count(p => !p.Pago);
    var saldoPendente = parcelasPendentes * emprestimoAtualizado.ValorParcela;

    return Ok(new
    {
        mensagem = todasPagas ? "Empréstimo quitado!" : $"Parcela {parcelasPagas}/{totalParcelas} registrada.",
        parcelasPagas,
        parcelasPendentes,
        saldoPendente,
        dados = emprestimoAtualizado
    });
}


    [HttpDelete("{id:int}/{nomeCobrador}")]
    public async Task<IActionResult> Delete(int id, string nomeCobrador)
    {
        var result = await _emprestimos.DeleteOneAsync(x => x.Id == id && x.Cobrador == nomeCobrador);
        if (result.DeletedCount == 0) return NotFound();
        return NoContent();
    }

    private async Task EnviarPushAsync(string cobrador, string titulo, string mensagem)
    {
        try
        {
            var colUsuarios = _db.GetCollection<dynamic>("usuarios");
            var usuario = await colUsuarios
                .Find(Builders<dynamic>.Filter.Eq("Nome", cobrador))
                .FirstOrDefaultAsync();

            if (usuario == null) return;
            var dict = (IDictionary<string, object>)usuario;
            if (!dict.TryGetValue("PushToken", out var tokenObj)) return;
            string? pushToken = tokenObj?.ToString();
            if (string.IsNullOrEmpty(pushToken)) return;

            using var http = new HttpClient();
            var payload = new
            {
                to = pushToken,
                title = titulo,
                body = mensagem,
                sound = "default"
            };

            var json = System.Text.Json.JsonSerializer.Serialize(payload);
            var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");
            await http.PostAsync("https://exp.host/--/api/v2/push/send", content);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Push] Erro ao enviar notificação: {ex.Message}");
        }
    }

    [HttpPost("verificar-atrasos")]
    public async Task<IActionResult> VerificarAtrasos()
    {
        var hoje = DateTime.UtcNow.Date;
        var colNotificacoes = _db.GetCollection<Notificacao>("notificacoes");

        var emprestimos = await _emprestimos
            .Find(x => !x.Pago)
            .ToListAsync();

        int count = 0;

        foreach (var emp in emprestimos)
        {
            var parcelasAtrasadas = emp.Parcelas
                .Where(p => !p.Pago && !p.NotificadoAtraso && p.DataVencimento.Date < hoje)
                .ToList();

            foreach (var parcela in parcelasAtrasadas)
            {
                var diasAtraso = (hoje - parcela.DataVencimento.Date).Days;

                var mensagem = emp.NumeroParcelas == 1
                    ? $"⚠️ ATRASO: {emp.Cliente} está {diasAtraso} dia(s) em atraso — {emp.ValorFinal:C}"
                    : $"⚠️ ATRASO: {emp.Cliente} — parcela {parcela.Numero}/{emp.NumeroParcelas} ({parcela.Valor:C}) está {diasAtraso} dia(s) em atraso";

                var ultima = await colNotificacoes.Find(_ => true).SortByDescending(x => x.Id).FirstOrDefaultAsync();

                var notif = new Notificacao
                {
                    Id = (ultima == null) ? 1 : ultima.Id + 1,
                    ClienteId = emp.ClienteId,
                    ClienteNome = emp.Cliente,
                    Cobrador = emp.Cobrador,
                    Valor = parcela.Valor,
                    DataVencimento = parcela.DataVencimento,
                    Tipo = "Atraso",
                    Data = DateTime.UtcNow,
                    DataCriacao = DateTime.UtcNow,
                    Lida = false,
                    Mensagem = mensagem,
                    EmprestimoId = emp.Id,
                    NumeroParcela = parcela.Numero,
                    TotalParcelas = emp.NumeroParcelas
                };

                await colNotificacoes.InsertOneAsync(notif);
                await EnviarPushAsync(emp.Cobrador, "Parcela em Atraso", mensagem);

                parcela.NotificadoAtraso = true;
                count++;
            }

            if (parcelasAtrasadas.Any())
            {
                var filter = Builders<Emprestimo>.Filter.Eq(x => x.Id, emp.Id);
                var update = Builders<Emprestimo>.Update
                    .Set(x => x.Parcelas, emp.Parcelas)
                    .Set(x => x.Status, StatusPagamento.Atrasado);

                await _emprestimos.UpdateOneAsync(filter, update);
            }
        }

        return Ok(new { mensagem = $"{count} notificações de atraso enviadas." });
    }

}
