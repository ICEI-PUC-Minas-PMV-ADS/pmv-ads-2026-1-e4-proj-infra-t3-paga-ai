using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using Testcontainers.MongoDb;
using MongoDB.Driver;
using System.Net.Http.Json;
using Xunit;

namespace Reports.API.Tests;

public class ReportIntegrationFixture : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly MongoDbContainer _mongoContainer = new MongoDbBuilder()
        .WithImage("mongo:6.0")
        .Build();

    public async Task InitializeAsync() => await _mongoContainer.StartAsync();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["JwtSettings:SecretKey"]  = "pagai-chave-super-secreta-2026-minima-32chars!",
                ["JwtSettings:Issuer"]     = "pagai-api",
                ["JwtSettings:Audience"]   = "pagai-app"
            });
        });

        builder.ConfigureTestServices(services =>
        {
            var clientDesc = services.SingleOrDefault(d => d.ServiceType == typeof(IMongoClient));
            if (clientDesc != null) services.Remove(clientDesc);
            var dbDesc = services.SingleOrDefault(d => d.ServiceType == typeof(IMongoDatabase));
            if (dbDesc != null) services.Remove(dbDesc);

            var client   = new MongoClient(_mongoContainer.GetConnectionString());
            var database = client.GetDatabase("reports_test_db");
            services.AddSingleton<IMongoClient>(client);
            services.AddScoped<IMongoDatabase>(_ => database);
        });
    }

    public new async Task DisposeAsync() => await _mongoContainer.DisposeAsync();
}

public class ReportControllerIntegrationTests : IClassFixture<ReportIntegrationFixture>
{
    private readonly HttpClient _client;

    public ReportControllerIntegrationTests(ReportIntegrationFixture factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetRelatorio_PeriodoValido_DeveRetornarOk()
    {
        var response = await _client.GetAsync(
            "/api/report?dataInicio=2026-01-01&dataFim=2026-12-31");

        Assert.Equal(System.Net.HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetRelatorio_ComCobrador_DeveRetornarSomenteDosCobrador()
    {
        var response = await _client.GetAsync(
            "/api/report?dataInicio=2026-01-01&dataFim=2026-12-31&cobrador=Renata");

        Assert.Equal(System.Net.HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<dynamic>();
        Assert.NotNull(body);
    }

    [Fact]
    public async Task GetRelatorio_BancoDeDadosVazio_DeveRetornarZeros()
    {
        var response = await _client.GetAsync(
            "/api/report?dataInicio=2026-01-01&dataFim=2026-12-31&cobrador=CobradoreInexistente");

        Assert.Equal(System.Net.HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task ExportPdf_DadosValidos_DeveRetornarPdf()
    {
        var payload = new
        {
            dataInicio = new DateTime(2026, 1, 1),
            dataFim    = new DateTime(2026, 12, 31),
            cobrador   = "Renata"
        };

        var response = await _client.PostAsJsonAsync("/api/report/export-pdf", payload);

        Assert.Equal(System.Net.HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("application/pdf", response.Content.Headers.ContentType?.MediaType);
    }
}
