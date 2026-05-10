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

        var pagos = registros.Where(x => x.DataPagamento != null).ToList();
        var pendentes = registros.Where(x => x.DataPagamento == null).ToList();

        var totalEmprestado = registros.Sum(x => x.Valor);
        var totalRecebido = pagos.Sum(x => x.ValorFinal);
        var totalPendente = pendentes.Sum(x => x.ValorFinal);
        var lucroTotal = pagos.Sum(x => x.ValorFinal - x.Valor);

        var emprestimosPorDevedor = registros
            .GroupBy(x => x.Cliente ?? "Não informado")
            .Select(g => new RelatorioDevedor
            {
                Devedor = g.Key,
                Quantidade = g.Count(),
                TotalEmprestado = g.Sum(x => x.Valor),
                Recebido = g.Where(x => x.DataPagamento != null).Sum(x => x.ValorFinal),
                Pendente = g.Where(x => x.DataPagamento == null).Sum(x => x.ValorFinal),
                TaxaMedia = g.Any() ? g.Average(x => x.TaxaJuros) : 0
            })
            .ToList();

        var pagamentosRecentes = pagos
            .OrderByDescending(x => x.DataPagamento)
            .Take(10)
            .Select(x => new PagamentoRecente
            {
                Data = x.DataPagamento ?? x.DataEmprestimo,
                Devedor = x.Cliente ?? "Não informado",
                Valor = x.ValorFinal,
                Metodo = "PIX",
                Referencia = $"Empréstimo #{x.Id}",
                Status = "Recebido"
            })
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

        var pagos = registros.Where(x => x.DataPagamento != null).ToList();
        var pendentes = registros.Where(x => x.DataPagamento == null).ToList();

        var totalEmprestado = registros.Sum(x => x.Valor);
        var totalRecebido = pagos.Sum(x => x.ValorFinal);
        var totalPendente = pendentes.Sum(x => x.ValorFinal);
        var lucroTotal = pagos.Sum(x => x.ValorFinal - x.Valor);

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

                    col.Item().PaddingTop(10).Text("Pagamentos Recebidos").Bold().FontSize(14);

                    if (pagos.Any())
                    {
                        col.Item().Table(table =>
                        {
                            table.ColumnsDefinition(columns =>
                            {
                                columns.RelativeColumn(3);
                                columns.RelativeColumn(2);
                                columns.RelativeColumn(2);
                            });

                            table.Header(header =>
                            {
                                header.Cell().Text("Cliente").Bold();
                                header.Cell().Text("Data Pagamento").Bold();
                                header.Cell().Text("Valor").Bold();
                            });

                            foreach (var item in pagos.OrderBy(x => x.DataPagamento))
                            {
                                table.Cell().Text(item.Cliente ?? "-");
                                table.Cell().Text(item.DataPagamento?.ToString("dd/MM/yyyy") ?? "-");
                                table.Cell().Text($"R$ {item.ValorFinal:N2}");
                            }
                        });
                    }
                    else
                    {
                        col.Item().Text("Nenhum pagamento encontrado no período.");
                    }

                    col.Item().PaddingTop(10).Text("Empréstimos Pendentes").Bold().FontSize(14);

                    if (pendentes.Any())
                    {
                        col.Item().Table(table =>
                        {
                            table.ColumnsDefinition(columns =>
                            {
                                columns.RelativeColumn(3);
                                columns.RelativeColumn(2);
                                columns.RelativeColumn(2);
                            });

                            table.Header(header =>
                            {
                                header.Cell().Text("Cliente").Bold();
                                header.Cell().Text("Data Empréstimo").Bold();
                                header.Cell().Text("Valor Pendente").Bold();
                            });

                            foreach (var item in pendentes.OrderBy(x => x.DataEmprestimo))
                            {
                                table.Cell().Text(item.Cliente ?? "-");
                                table.Cell().Text(item.DataEmprestimo.ToString("dd/MM/yyyy"));
                                table.Cell().Text($"R$ {item.ValorFinal:N2}");
                            }
                        });
                    }
                    else
                    {
                        col.Item().Text("Nenhum empréstimo pendente encontrado no período.");
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
