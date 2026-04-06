using System;
using System.Linq;
using backend.Models;
using MongoDB.Driver;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

public class ReportService
{
    private readonly IMongoCollection<Emprestimo> _emprestimosCollection;
    private readonly IMongoCollection<Report> _reportsCollection;

    public ReportService(IMongoDatabase database)
    {
        _emprestimosCollection = database.GetCollection<Emprestimo>("emprestimos");
        _reportsCollection = database.GetCollection<Report>("reports");
    }

    public Report GerarRelatorio(DateTime dataInicio, DateTime dataFim)
    {
        var report = new Report
        {
            Id = Guid.NewGuid().ToString(),
            DataInicio = dataInicio,
            DataFim = dataFim,
            Tipo = "Relatório por período",
            Formato = "PDF",
            GeradoEm = DateTime.Now,
            UsuarioId = "user-001"
        };

        _reportsCollection.InsertOne(report);

        return report;
    }

    public byte[] GerarPdf(DateTime dataInicio, DateTime dataFim)
    {
        QuestPDF.Settings.License = LicenseType.Community;

        var registros = _emprestimosCollection
            .Find(x => x.Pago == true &&
                       x.DataPagamento.HasValue &&
                       x.DataPagamento.Value >= dataInicio &&
                       x.DataPagamento.Value <= dataFim)
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

                    col.Item().LineHorizontal(1);

                    col.Item()
                        .Text("Resumo")
                        .Bold()
                        .FontSize(14);

                    if (registros.Any())
                    {
                        col.Item()
                            .Text($"Foram encontrados {registros.Count} pagamento(s) no período.");

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

                            foreach (var item in registros)
                            {
                                table.Cell().Text(item.Cliente);
                                table.Cell().Text(item.DataPagamento?.ToString("dd/MM/yyyy") ?? "-");
                                table.Cell().Text($"R$ {item.ValorFinal:N2}");
                            }
                        });

                        col.Item()
                            .PaddingTop(10)
                            .Text($"Total recebido no período: R$ {totalRecebido:N2}")
                            .Bold();
                    }
                    else
                    {
                        col.Item()
                            .Text("Nenhum pagamento encontrado no período informado.");
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