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

// Load Ocelot gateway configuration
builder.Configuration.AddJsonFile("ocelot.json", optional: false, reloadOnChange: true);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var jwtSettingsSection = builder.Configuration.GetSection("GatewaySettings");
var jwtSecret = jwtSettingsSection["JwtSecret"] ?? throw new InvalidOperationException("JWT Secret is not configured.");
var jwtIssuer = jwtSettingsSection["JwtIssuer"] ?? "paga-ai-gateway";
var jwtAudience = jwtSettingsSection["JwtAudience"] ?? "paga-ai-clients";

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

builder.Services.Configure<GatewaySettings>(jwtSettingsSection);
builder.Services.Configure<RateLimitSettings>(builder.Configuration.GetSection("RateLimiting"));

builder.Services.AddSingleton(s => s.GetRequiredService<IOptions<GatewaySettings>>().Value);
builder.Services.AddSingleton(s => s.GetRequiredService<IOptions<RateLimitSettings>>().Value);

builder.Services.AddSingleton<ITokenService, TokenService>();
builder.Services.AddSingleton<IRateLimitService, RateLimitService>();

builder.Services.AddOcelot();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

app.UseHttpsRedirection();
app.UseCors();
app.UseRouting();

app.UseMiddleware<ErrorHandlingMiddleware>();
app.UseMiddleware<LoggingMiddleware>();
app.UseMiddleware<RequestTransformationMiddleware>();
app.UseMiddleware<RateLimitingMiddleware>();

app.UseAuthentication();
app.UseAuthorization();

app.UseEndpoints(endpoints =>
{
    endpoints.MapControllers();

    endpoints.MapGet("/", () => Results.Ok(new
    {
        status = "Gateway is running",
        timestamp = DateTime.UtcNow,
        version = "1.0.0",
        message = "Welcome to the PagaAi gateway"
    }))
    .WithName("Root")
    .WithOpenApi()
    .AllowAnonymous();

    endpoints.MapGet("/health", () => Results.Ok(new
    {
        status = "Gateway is running",
        timestamp = DateTime.UtcNow,
        version = "1.0.0"
    }))
    .WithName("Health")
    .WithOpenApi()
    .AllowAnonymous();
});

await app.UseOcelot();
app.Run();
