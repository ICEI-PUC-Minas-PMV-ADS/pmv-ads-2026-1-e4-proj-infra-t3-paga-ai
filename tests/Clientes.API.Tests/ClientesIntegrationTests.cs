using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using Testcontainers.MongoDb;
using MongoDB.Driver;
using System.Net.Http.Json;
using System.Net.Http.Headers;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using Xunit;

namespace Clientes.API.Tests;

public class ClientesIntegrationFixture : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly MongoDbContainer _mongo = new MongoDbBuilder()
        .WithImage("mongo:6.0").Build();

    public async Task InitializeAsync() => await _mongo.StartAsync();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureAppConfiguration((_, cfg) =>
        {
            cfg.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["JwtSettings:SecretKey"] = "pagai-chave-super-secreta-2026-minima-32chars!",
                ["JwtSettings:Issuer"]    = "pagai-api",
                ["JwtSettings:Audience"]  = "pagai-app"
            });
        });

        builder.ConfigureTestServices(services =>
        {
            services.Remove(services.Single(d => d.ServiceType == typeof(IMongoClient)));
            services.Remove(services.Single(d => d.ServiceType == typeof(IMongoDatabase)));

            var client = new MongoClient(_mongo.GetConnectionString());
            services.AddSingleton<IMongoClient>(client);
            services.AddScoped<IMongoDatabase>(_ => client.GetDatabase("clientes_test"));
        });
    }

    public new async Task DisposeAsync() => await _mongo.DisposeAsync();

    public static string GerarToken()
    {
        var key = Encoding.ASCII.GetBytes("pagai-chave-super-secreta-2026-minima-32chars!");
        var handler = new JwtSecurityTokenHandler();
        var token = handler.CreateToken(new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[] { new Claim(ClaimTypes.Name, "Teste") }),
            Expires = DateTime.UtcNow.AddHours(1),
            Issuer  = "pagai-api", Audience = "pagai-app",
            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        });
        return handler.WriteToken(token);
    }
}

public class ClientesIntegrationTests : IClassFixture<ClientesIntegrationFixture>
{
    private readonly HttpClient _client;

    public ClientesIntegrationTests(ClientesIntegrationFixture factory)
    {
        _client = factory.CreateClient();
        _client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", ClientesIntegrationFixture.GerarToken());
    }

    [Fact]
    public async Task Get_BancoDeDadosVazio_DeveRetornarListaVazia()
    {
        var response = await _client.GetAsync("/api/Clientes");
        Assert.Equal(System.Net.HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Post_ClienteValido_DeveRetornarCreated()
    {
        var cliente = new { Nome = "João Teste", Cpf = "123.456.789-00", Email = "joao@teste.com", Telefone = "(31) 99999-0000", Endereco = "Rua A, 1" };

        var response = await _client.PostAsJsonAsync("/api/Clientes", cliente);

        Assert.Equal(System.Net.HttpStatusCode.Created, response.StatusCode);
    }

    [Fact]
    public async Task FluxoCriarEBuscarCliente_DeveFuncionar()
    {
        var cliente = new { Nome = "Maria Silva", Cpf = "987.654.321-00", Email = "maria@teste.com", Telefone = "(31) 98888-0000", Endereco = "Rua B, 2" };

        var postResp = await _client.PostAsJsonAsync("/api/Clientes", cliente);
        Assert.Equal(System.Net.HttpStatusCode.Created, postResp.StatusCode);

        var getResp = await _client.GetAsync("/api/Clientes");
        Assert.Equal(System.Net.HttpStatusCode.OK, getResp.StatusCode);
    }

    [Fact]
    public async Task Delete_ClienteInexistente_DeveRetornarNotFound()
    {
        var response = await _client.DeleteAsync("/api/Clientes/99999");
        Assert.Equal(System.Net.HttpStatusCode.NotFound, response.StatusCode);
    }
}
