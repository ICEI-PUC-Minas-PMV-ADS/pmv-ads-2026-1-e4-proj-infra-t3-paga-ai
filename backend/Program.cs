using MongoDB.Driver;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Ocelot.DependencyInjection;
using Ocelot.Middleware;
using System.Text;
using backend.Gateway.Middleware;
using backend.Gateway.Services;
using backend.Gateway.Configuration;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddScoped<ReportService>();

// Add Authorization
builder.Services.AddAuthorization();

// Add Ocelot gateway services
builder.Services.AddOcelot();

// Add Gateway Services
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IRateLimitService, RateLimitService>();

// Configure MongoDB
var mongoConnectionString = builder.Configuration.GetValue<string>("MongoDbSettings:ConnectionString")
    ?? builder.Configuration.GetValue<string>("MONGODB_CONNECTIONSTRING")
    ?? throw new InvalidOperationException("MongoDB connection string is not configured. Set MongoDbSettings:ConnectionString in appsettings.json or the environment variable MONGODB_CONNECTIONSTRING.");

var mongoDatabaseName = builder.Configuration.GetValue<string>("MongoDbSettings:DatabaseName")
    ?? throw new InvalidOperationException("MongoDB database name is not configured. Set MongoDbSettings:DatabaseName in appsettings.json.");

builder.Services.AddSingleton<IMongoClient>(s => new MongoClient(mongoConnectionString));

builder.Services.AddScoped(s => {
    var client = s.GetRequiredService<IMongoClient>();
    return client.GetDatabase(mongoDatabaseName);
});

var app = builder.Build();

// FORÇAR SWAGGER EM QUALQUER AMBIENTE (Inclusive Produção no Azure)
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Pagai API V1");
    c.RoutePrefix = string.Empty; // Isso faz o Swagger abrir direto na URL principal do Azure
});

app.UseHttpsRedirection();
app.UseCors("AllowAll");
app.UseRouting();

// Add Gateway Middleware
app.UseMiddleware<LoggingMiddleware>();
app.UseMiddleware<RequestTransformationMiddleware>();
app.UseMiddleware<ErrorHandlingMiddleware>();

// Authentication and Authorization
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.MapGet("/health", () => Results.Ok(new
{
    status = "Backend is running",
    timestamp = DateTime.UtcNow,
    gateway = "enabled"
}))
.WithName("Health")
.WithOpenApi()
.AllowAnonymous();

app.Use(async (context, next) =>
{
    if (context.Request.Path.Equals("/health", StringComparison.OrdinalIgnoreCase))
    {
        context.Response.StatusCode = StatusCodes.Status200OK;
        await context.Response.WriteAsJsonAsync(new
        {
            status = "Backend is running",
            timestamp = DateTime.UtcNow,
            gateway = "enabled"
        });
        return;
    }

    await next();
});

await app.UseOcelot();
app.Run();
