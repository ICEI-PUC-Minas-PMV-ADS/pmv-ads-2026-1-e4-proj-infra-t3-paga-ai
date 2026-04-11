using System.Text;
using backend.Gateway.Configuration;
using backend.Gateway.Middleware;
using backend.Gateway.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Ocelot.DependencyInjection;
using Ocelot.Middleware;

var builder = WebApplication.CreateBuilder(args);

// 1. CARREGAMENTO DE CONFIGURAÇÃO (Suporta ocelot.json e ocelot.Development.json)
builder.Configuration
    .SetBasePath(builder.Environment.ContentRootPath)
    .AddJsonFile("ocelot.json", optional: false, reloadOnChange: true)
    .AddJsonFile($"ocelot.{builder.Environment.EnvironmentName}.json", optional: true, reloadOnChange: true);

// 2. SERVIÇOS BÁSICOS
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// 3. CONFIGURAÇÃO JWT (Deve ser igual ao das outras APIs)
var jwtSettingsSection = builder.Configuration.GetSection("GatewaySettings");
var jwtSecret = jwtSettingsSection["JwtSecret"] ?? "chave_mestra_paga_ai_2026_secreta";
var jwtIssuer = jwtSettingsSection["JwtIssuer"] ?? "pagai-api";
var jwtAudience = jwtSettingsSection["JwtAudience"] ?? "pagai-app";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

// 4. INJEÇÃO DE DEPENDÊNCIAS PERSONALIZADAS
builder.Services.Configure<GatewaySettings>(jwtSettingsSection);
builder.Services.Configure<RateLimitSettings>(builder.Configuration.GetSection("RateLimiting"));

builder.Services.AddSingleton<ITokenService, TokenService>();
builder.Services.AddSingleton<IRateLimitService, RateLimitService>();

// 5. REGISTRO DO OCELOT
builder.Services.AddOcelot(builder.Configuration);

// 6. CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    });
});

var app = builder.Build();

// 7. PIPELINE (A ORDEM É CRUCIAL)

app.UseSwagger();
app.UseSwaggerUI(c => 
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "PagaAi Gateway V1");
    c.RoutePrefix = string.Empty; // <-- ISSO faz abrir direto na home da Azure
});

app.UseHttpsRedirection();
app.UseCors();
app.UseRouting();

// Seus middlewares personalizados
app.UseMiddleware<ErrorHandlingMiddleware>();
app.UseMiddleware<LoggingMiddleware>();

app.UseAuthentication();
app.UseAuthorization();

// Health check simplificado antes do Ocelot
app.MapGet("/health", () => Results.Ok(new { status = "Gateway is running", version = "1.0.0" }));

app.MapControllers();

// Ocelot deve ser a última peça do pipeline
await app.UseOcelot();

app.Run();
