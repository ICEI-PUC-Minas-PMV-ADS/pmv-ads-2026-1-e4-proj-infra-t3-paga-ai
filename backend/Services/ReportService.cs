using System;
using backend.Models;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

public class ReportService
{
    public Report GerarRelatorio(DateTime dataInicio, DateTime dataFim)
    {
        return new Report
        {
            Id = Guid.NewGuid().ToString(),
            DataInicio = dataInicio,
            DataFim = dataFim,
            Tipo = "Relatório por período",
            Formato = "JSON",
            GeradoEm = DateTime.Now,
            UsuarioId = "user-001"
        };

    }
    public byte[] GerarPdf(DateTime dataInicio, DateTime dataFim)
    {
        QuestPDF.Settings.License = LicenseType.Community;

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

                    col.Item()
                        .Text("Aqui depois vamos listar quem pagou no período, valores e total recebido.");

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

                        table.Cell().Text("João Silva");
                        table.Cell().Text("15/01/2024");
                        table.Cell().Text("R$ 250,00");

                        table.Cell().Text("Maria Souza");
                        table.Cell().Text("20/02/2024");
                        table.Cell().Text("R$ 400,00");
                    });

                    col.Item()
                        .PaddingTop(10)
                        .Text("Total recebido no período: R$ 650,00")
                        .Bold();
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