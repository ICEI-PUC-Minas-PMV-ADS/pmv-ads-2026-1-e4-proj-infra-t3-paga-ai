using System.Linq;
using Reports.API.Models;
using MongoDB.Driver;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using Empretimos.API.Models;

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
        return new Report
        {
            Id = new Random().Next(1, 100000),
            DataInicio = dataInicio,
            DataFim = dataFim,
            Tipo = "Relatório por período",
            Formato = "PDF",
            GeradoEm = DateTime.Now,
            Cobrador = cobrador ?? string.Empty
        };
    }

    public byte[] GerarPdf(DateTime dataInicio, DateTime dataFim, string? cobrador = null)
    {
        QuestPDF.Settings.License = LicenseType.Community;

        var dataInicioAjustada = dataInicio.Date;
        var dataFimAjustada = dataFim.Date.AddDays(1).AddTicks(-1);

        var filtro = Builders<Emprestimo>.Filter.Empty;

        // Versão temporária para TESTE:
        // traz registros pelo período usando DataPagamento OU DataEmprestimo
        var filtroPeriodo =
            Builders<Emprestimo>.Filter.Or(
                Builders<Emprestimo>.Filter.And(
                    Builders<Emprestimo>.Filter.Ne(x => x.DataPagamento, null),
                    Builders<Emprestimo>.Filter.Gte(x => x.DataPagamento, dataInicioAjustada),
                    Builders<Emprestimo>.Filter.Lte(x => x.DataPagamento, dataFimAjustada)
                ),
                Builders<Emprestimo>.Filter.And(
                    Builders<Emprestimo>.Filter.Gte(x => x.DataEmprestimo, dataInicioAjustada),
                    Builders<Emprestimo>.Filter.Lte(x => x.DataEmprestimo, dataFimAjustada)
                )
            );

        filtro &= filtroPeriodo;

        if (!string.IsNullOrWhiteSpace(cobrador))
        {
            filtro &= Builders<Emprestimo>.Filter.Eq(x => x.Cobrador, cobrador);
        }

        var registros = _emprestimosCollection
            .Find(filtro)
            .ToList();

        var totalRecebido = registros.Sum(x => x.ValorFinal);

        var pdf = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Margin(30);

                page.Header()
                    .Text("Relatório de Pagamentos")
                    .FontSize(20)
                    .Bold()
                    .FontColor(Colors.Blue.Darken2);

                page.Content().Column(col =>
                {
                    col.Spacing(10);

                    col.Item()
                        .Text($"Período: {dataInicio:dd/MM/yyyy} até {dataFim:dd/MM/yyyy}")
                        .FontSize(12);

                    if (!string.IsNullOrWhiteSpace(cobrador))
                    {
                        col.Item()
                            .Text($"Cobrador: {cobrador}")
                            .FontSize(12);
                    }

                    col.Item().LineHorizontal(1);

                    col.Item()
                        .Text("Resumo")
                        .Bold()
                        .FontSize(14);

                    if (registros.Any())
                    {
                        col.Item()
                            .Text($"Foram encontrados {registros.Count} registro(s) no período.");

                        col.Item().PaddingTop(10).Table(table =>
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
                                header.Cell().Text("Data").Bold();
                                header.Cell().Text("Valor").Bold();
                            });

                            foreach (var item in registros.OrderBy(x => x.DataPagamento ?? x.DataEmprestimo))
                            {
                                table.Cell().Text(item.Cliente ?? "-");
                                table.Cell().Text((item.DataPagamento ?? item.DataEmprestimo).ToString("dd/MM/yyyy"));
                                table.Cell().Text($"R$ {item.ValorFinal:N2}");
                            }
                        });

                        col.Item()
                            .PaddingTop(10)
                            .Text($"Total no período: R$ {totalRecebido:N2}")
                            .Bold();
                    }
                    else
                    {
                        col.Item()
                            .Text("Nenhum registro encontrado no período informado.");
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
}