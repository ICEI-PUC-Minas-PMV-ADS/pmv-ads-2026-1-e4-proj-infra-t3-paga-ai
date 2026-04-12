using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using Testcontainers.MongoDb;
using MongoDB.Driver;

namespace Emprestimos.API.Tests;

public class IntegrationTestFixture : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly MongoDbContainer _mongoContainer = new MongoDbBuilder()
        .WithImage("mongo:6.0")
        .Build();

    public async Task InitializeAsync() => await _mongoContainer.StartAsync();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureAppConfiguration((context, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["JwtSettings:SecretKey"] = "pagai-chave-super-secreta-2026-minima-32chars!",
                ["JwtSettings:Issuer"] = "pagai-api",
                ["JwtSettings:Audience"] = "pagai-app"
            });
        });

        builder.ConfigureTestServices(services =>
        {
            // Remove as configurações reais
            var clientDescriptor = services.SingleOrDefault(d => d.ServiceType == typeof(IMongoClient));
            if (clientDescriptor != null) services.Remove(clientDescriptor);
            
            var dbDescriptor = services.SingleOrDefault(d => d.ServiceType == typeof(IMongoDatabase));
            if (dbDescriptor != null) services.Remove(dbDescriptor);

            // Injeta o MongoDB do Container
            var client = new MongoClient(_mongoContainer.GetConnectionString());
            var database = client.GetDatabase("teste_db");

            services.AddSingleton<IMongoClient>(client);
            services.AddScoped<IMongoDatabase>(_ => database);
        });
    }

    public new async Task DisposeAsync() => await _mongoContainer.DisposeAsync();
}
