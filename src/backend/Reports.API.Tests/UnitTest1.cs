using Xunit;
using Moq;
using MongoDB.Driver;
using Reports.API.Models;
using Reports.API.Services;
using Empretimos.API.Models;

namespace Reports.API.Tests;

public class ReportServiceTests
{
    [Fact]
    public void GerarRelatorio_DeveRetornarObjetoPreenchidoCorretamente()
    {
        // Arrange
        var mockDatabase = new Mock<IMongoDatabase>();
        var mockEmprestimosCollection = new Mock<IMongoCollection<Emprestimo>>();
        var mockReportsCollection = new Mock<IMongoCollection<Report>>();

        mockDatabase
            .Setup(db => db.GetCollection<Emprestimo>("emprestimos", null))
            .Returns(mockEmprestimosCollection.Object);

        mockDatabase
            .Setup(db => db.GetCollection<Report>("reports", null))
            .Returns(mockReportsCollection.Object);

        var service = new ReportService(mockDatabase.Object);

        var dataInicio = new DateTime(2026, 4, 1);
        var dataFim = new DateTime(2026, 4, 30);
        var cobrador = "Cristina";

        // Act
        var resultado = service.GerarRelatorio(dataInicio, dataFim, cobrador);

        // Assert
        Assert.NotNull(resultado);
        Assert.True(resultado.Id > 0);
        Assert.Equal(dataInicio, resultado.DataInicio);
        Assert.Equal(dataFim, resultado.DataFim);
        Assert.Equal("Relatório por período", resultado.Tipo);
        Assert.Equal("PDF", resultado.Formato);
        Assert.Equal(cobrador, resultado.Cobrador);
    }
}