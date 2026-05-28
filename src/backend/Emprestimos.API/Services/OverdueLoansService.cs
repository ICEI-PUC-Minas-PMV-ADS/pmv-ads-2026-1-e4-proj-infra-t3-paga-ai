using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using Emprestimos.API.Models;

namespace Emprestimos.API.Services;

public class OverdueLoansService : BackgroundService
{
    private readonly IMongoDatabase _db;
    private readonly ILogger<OverdueLoansService> _logger;

    // Roda uma vez por dia
    private readonly TimeSpan _intervalo = TimeSpan.FromHours(24);

    public OverdueLoansService(IMongoDatabase db, ILogger<OverdueLoansService> logger)
    {
        _db = db;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Aguarda 10s na inicialização pra não competir com o startup
        await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            _logger.LogInformation("[Atraso] Verificando empréstimos em atraso...");

            try
            {
                await VerificarAtrasosAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[Atraso] Erro ao verificar atrasos.");
            }

            await Task.Delay(_intervalo, stoppingToken);
        }
    }

    private async Task VerificarAtrasosAsync()
    {
        var colEmprestimos = _db.GetCollection<Emprestimo>("emprestimos");
        var colNotificacoes = _db.GetCollection<Notificacao>("notificacoes");
        var hoje = DateTime.UtcNow.Date;

        // Busca empréstimos pendentes/atrasados com parcelas ainda não pagas
        var emprestimos = await colEmprestimos
            .Find(x => !x.Pago && x.Status != StatusPagamento.Pago)
            .ToListAsync();

        foreach (var emp in emprestimos)
        {
            // Verifica cada parcela individualmente
            var parcelasAtrasadas = emp.Parcelas
                .Where(p => !p.Pago && !p.NotificadoAtraso && p.DataVencimento.Date < hoje)
                .ToList();

            foreach (var parcela in parcelasAtrasadas)
            {
                var diasAtraso = (hoje - parcela.DataVencimento.Date).Days;

                var mensagem = emp.NumeroParcelas == 1
                    ? $"⚠️ ATRASO: {emp.Cliente} está {diasAtraso} dia(s) em atraso — {emp.ValorFinal:C}"
                    : $"⚠️ ATRASO: {emp.Cliente} — parcela {parcela.Numero}/{emp.NumeroParcelas} " +
                      $"({parcela.Valor:C}) está {diasAtraso} dia(s) em atraso";

                // Salva a notificação
                var ultima = await colNotificacoes
                    .Find(_ => true)
                    .SortByDescending(x => x.Id)
                    .FirstOrDefaultAsync();

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

                // Marca a parcela como notificada (não repete amanhã)
                parcela.NotificadoAtraso = true;

                _logger.LogInformation(
                    "[Atraso] Notificação enviada — empréstimo {Id}, parcela {Num}",
                    emp.Id, parcela.Numero);
            }

            // Se teve parcelas atrasadas, atualiza o status e as parcelas no banco
            if (parcelasAtrasadas.Any())
            {
                var filter = Builders<Emprestimo>.Filter.Eq(x => x.Id, emp.Id);
                var update = Builders<Emprestimo>.Update
                    .Set(x => x.Parcelas, emp.Parcelas)
                    .Set(x => x.Status, StatusPagamento.Atrasado);

                await colEmprestimos.UpdateOneAsync(filter, update);
            }
        }
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
            _logger.LogWarning("[Push] Erro ao enviar notificação: {Msg}", ex.Message);
        }
    }
}