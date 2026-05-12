using System.Linq;
using Reports.API.Models;
using MongoDB.Driver;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace Reports.API.Services;

public class ReportService
{
    private readonly IMongoCollection<Emprestimo> _emprestimosCollection;
    private readonly IMongoCollection<Report> _reportsCollection;

    public ReportService(IMongoDatabase database)
    {
        _emprestimosCollection = database.GetCollection<Emprestimo>("emprestimos");
        _reportsCollection = database.GetCollection<Report>("reports");
    }

    public Report GerarRelatorio(DateTime dataInicio, DateTime dataFim, string? cobrador = null)
{
    var dataInicioAjustada = DateTime.SpecifyKind(dataInicio.Date, DateTimeKind.Utc);
    var dataFimAjustada = DateTime.SpecifyKind(dataFim.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc);

    var filtro = CriarFiltroRelatorioCompleto(dataInicioAjustada, dataFimAjustada, cobrador);
    var registros = _emprestimosCollection.Find(filtro).ToList();

    // Calcula totais considerando parcelas
    var totalEmprestado = registros.Sum(x => x.Valor);

    var totalRecebido = registros.Sum(x =>
        x.Parcelas.Any()
            ? x.Parcelas.Where(p => p.Pago).Sum(p => p.Valor)
            : (x.DataPagamento != null ? x.ValorFinal : 0));

    var totalPendente = registros.Sum(x =>
        x.Parcelas.Any()
            ? x.Parcelas.Where(p => !p.Pago).Sum(p => p.Valor)
            : (x.DataPagamento == null ? x.ValorFinal : 0));

    var lucroTotal = registros.Sum(x =>
        x.Parcelas.Any()
            ? x.Parcelas.Where(p => p.Pago).Sum(p => p.Valor) - (x.Valor / x.NumeroParcelas * x.Parcelas.Count(p => p.Pago))
            : (x.DataPagamento != null ? x.ValorFinal - x.Valor : 0));

    // Empréstimos por devedor
    var emprestimosPorDevedor = registros
        .GroupBy(x => x.Cliente ?? "Não informado")
        .Select(g => new RelatorioDevedor
        {
            Devedor = g.Key,
            Quantidade = g.Count(),
            TotalEmprestado = g.Sum(x => x.Valor),
            Recebido = g.Sum(x =>
                x.Parcelas.Any()
                    ? x.Parcelas.Where(p => p.Pago).Sum(p => p.Valor)
                    : (x.DataPagamento != null ? x.ValorFinal : 0)),
            Pendente = g.Sum(x =>
                x.Parcelas.Any()
                    ? x.Parcelas.Where(p => !p.Pago).Sum(p => p.Valor)
                    : (x.DataPagamento == null ? x.ValorFinal : 0)),
            TaxaMedia = g.Any() ? g.Average(x => x.TaxaJuros) : 0
        })
        .ToList();

    // Pagamentos recentes — considera parcelas pagas individualmente
    var pagamentosRecentes = registros
        .SelectMany(x => x.Parcelas.Any()
            ? x.Parcelas.Where(p => p.Pago).Select(p => new PagamentoRecente
            {
                Data = p.DataPagamento ?? x.DataEmprestimo,
                Devedor = x.Cliente ?? "Não informado",
                Valor = p.Valor,
                Metodo = "PIX",
                Referencia = $"Empréstimo #{x.Id} — Parcela {p.Numero}/{x.NumeroParcelas}",
                Status = "Recebido"
            })
            : x.DataPagamento != null
                ? new[] { new PagamentoRecente
                {
                    Data = x.DataPagamento ?? x.DataEmprestimo,
                    Devedor = x.Cliente ?? "Não informado",
                    Valor = x.ValorFinal,
                    Metodo = "PIX",
                    Referencia = $"Empréstimo #{x.Id}",
                    Status = "Recebido"
                }}
                : Array.Empty<PagamentoRecente>())
        .OrderByDescending(p => p.Data)
        .Take(10)
        .ToList();

    return new Report
    {
        Id = new Random().Next(1, 100000),
        DataInicio = dataInicio,
        DataFim = dataFim,
        Tipo = "Relatório por período",
        Formato = "PDF",
        GeradoEm = DateTime.Now,
        Cobrador = cobrador ?? string.Empty,
        TotalEmprestado = totalEmprestado,
        TotalRecebido = totalRecebido,
        TotalPendente = totalPendente,
        LucroTotal = lucroTotal,
        EmprestimosPorDevedor = emprestimosPorDevedor,
        PagamentosRecentes = pagamentosRecentes
    };
}

    public byte[] GerarPdf(DateTime dataInicio, DateTime dataFim, string? cobrador = null)
{
    QuestPDF.Settings.License = LicenseType.Community;

    var dataInicioAjustada = DateTime.SpecifyKind(dataInicio.Date, DateTimeKind.Utc);
    var dataFimAjustada = DateTime.SpecifyKind(dataFim.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc);

    var filtro = CriarFiltroRelatorioCompleto(dataInicioAjustada, dataFimAjustada, cobrador);
    var registros = _emprestimosCollection.Find(filtro).ToList();

    var totalEmprestado = registros.Sum(x => x.Valor);

    var totalRecebido = registros.Sum(x =>
        x.Parcelas.Any()
            ? x.Parcelas.Where(p => p.Pago).Sum(p => p.Valor)
            : (x.DataPagamento != null ? x.ValorFinal : 0));

    var totalPendente = registros.Sum(x =>
        x.Parcelas.Any()
            ? x.Parcelas.Where(p => !p.Pago).Sum(p => p.Valor)
            : (x.DataPagamento == null ? x.ValorFinal : 0));

    var lucroTotal = registros.Sum(x =>
        x.Parcelas.Any()
            ? x.Parcelas.Where(p => p.Pago).Sum(p => p.Valor) - (x.Valor / x.NumeroParcelas * x.Parcelas.Count(p => p.Pago))
            : (x.DataPagamento != null ? x.ValorFinal - x.Valor : 0));

    var pdf = Document.Create(container =>
    {
        container.Page(page =>
        {
            page.Margin(30);

            page.Header()
                .Text("Relatório Financeiro")
                .FontSize(20)
                .Bold()
                .FontColor(Colors.Blue.Darken2);

            page.Content().Column(col =>
            {
                col.Spacing(10);

                col.Item().Text($"Período: {dataInicio:dd/MM/yyyy} até {dataFim:dd/MM/yyyy}").FontSize(12);

                if (!string.IsNullOrWhiteSpace(cobrador))
                    col.Item().Text($"Cobrador: {cobrador}").FontSize(12);

                col.Item().LineHorizontal(1);

                col.Item().Text("Resumo Geral").Bold().FontSize(14);
                col.Item().Text($"Total emprestado: R$ {totalEmprestado:N2}");
                col.Item().Text($"Total recebido: R$ {totalRecebido:N2}");
                col.Item().Text($"Total pendente: R$ {totalPendente:N2}");
                col.Item().Text($"Lucro total: R$ {lucroTotal:N2}");

                col.Item().PaddingTop(10).Text("Empréstimos").Bold().FontSize(14);

                foreach (var emp in registros.OrderBy(x => x.Cliente))
                {
                    col.Item().PaddingTop(6).Text($"{emp.Cliente ?? "-"} — Empréstimo #{emp.Id}").Bold();
                    col.Item().Text($"Valor: R$ {emp.Valor:N2} | Juros: {emp.TaxaJuros * 100:N1}% | Total: R$ {emp.ValorFinal:N2}");

                    if (emp.Parcelas.Any())
                    {
                        col.Item().Table(table =>
                        {
                            table.ColumnsDefinition(columns =>
                            {
                                columns.RelativeColumn(1);
                                columns.RelativeColumn(2);
                                columns.RelativeColumn(2);
                                columns.RelativeColumn(2);
                            });

                            table.Header(header =>
                            {
                                header.Cell().Text("Parcela").Bold();
                                header.Cell().Text("Vencimento").Bold();
                                header.Cell().Text("Valor").Bold();
                                header.Cell().Text("Status").Bold();
                            });

                            foreach (var p in emp.Parcelas.OrderBy(p => p.Numero))
                            {
                                table.Cell().Text($"{p.Numero}/{emp.NumeroParcelas}");
                                table.Cell().Text(p.DataVencimento.ToString("dd/MM/yyyy"));
                                table.Cell().Text($"R$ {p.Valor:N2}");
                                table.Cell().Text(p.Pago ? $"Pago em {p.DataPagamento:dd/MM/yyyy}" : "Pendente");
                            }
                        });
                    }
                    else
                    {
                        col.Item().Text($"Vencimento: {emp.DataVencimento:dd/MM/yyyy} | Status: {(emp.DataPagamento != null ? $"Pago em {emp.DataPagamento:dd/MM/yyyy}" : "Pendente")}");
                    }

                    col.Item().LineHorizontal(0.5f);
                }
            });

            page.Footer()
                .AlignCenter()
                .Text(x =>
                {
                    x.Span("Gerado em ");
                    x.Span($"{DateTime.Now:dd/MM/yyyy HH:mm}");
                });
        });
    });

    return pdf.GeneratePdf();
}

    private static FilterDefinition<Emprestimo> CriarFiltroRelatorioCompleto(
        DateTime dataInicio,
        DateTime dataFim,
        string? cobrador = null)
    {
        var filtroPagos = Builders<Emprestimo>.Filter.And(
            Builders<Emprestimo>.Filter.Ne(x => x.DataPagamento, null),
            Builders<Emprestimo>.Filter.Gte(x => x.DataPagamento, dataInicio),
            Builders<Emprestimo>.Filter.Lte(x => x.DataPagamento, dataFim)
        );

        var filtroPendentes = Builders<Emprestimo>.Filter.And(
            Builders<Emprestimo>.Filter.Eq(x => x.DataPagamento, null),
            Builders<Emprestimo>.Filter.Gte(x => x.DataEmprestimo, dataInicio),
            Builders<Emprestimo>.Filter.Lte(x => x.DataEmprestimo, dataFim)
        );

        var filtro = Builders<Emprestimo>.Filter.Or(filtroPagos, filtroPendentes);

        if (!string.IsNullOrWhiteSpace(cobrador))
            filtro &= Builders<Emprestimo>.Filter.Eq(x => x.Cobrador, cobrador);

        return filtro;
    }
}
