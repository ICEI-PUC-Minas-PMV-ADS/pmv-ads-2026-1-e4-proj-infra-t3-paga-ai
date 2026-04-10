using MongoDB.Driver;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using backend.Gateway.Middleware;
using backend.Gateway.Services;
using backend.Gateway.Configuration;
using backend.Services;

var builder = WebApplication.CreateBuilder(args);

// Load Ocelot configuration
builder.Configuration.AddJsonFile("ocelot.json", optional: false, reloadOnChange: true);

var jwtSettings = builder.Configuration.GetSection("GatewaySettings");
var jwtSecret = jwtSettings["JwtSecret"] ?? throw new InvalidOperationException("JWT Secret is not configured. Set it in appsettings.json");
var jwtIssuer = jwtSettings["JwtIssuer"] ?? "paga-ai-gateway";
var jwtAudience = jwtSettings["JwtAudience"] ?? "paga-ai-clients";

var gatewaySettings = builder.Configuration.GetSection("GatewaySettings").Get<GatewaySettings>()
    ?? throw new InvalidOperationException("Gateway settings are not configured. Set GatewaySettings in appsettings.json.");

var rateLimitSettings = builder.Configuration.GetSection("RateLimiting").Get<RateLimitSettings>()
    ?? throw new InvalidOperationException("Rate limiting settings are not configured. Set RateLimiting in appsettings.json.");

builder.Services.AddSingleton(gatewaySettings);
builder.Services.AddSingleton(rateLimitSettings);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add JWT Authentication
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(JwtBearerDefaults.AuthenticationScheme, options =>
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

// Add Authorization
builder.Services.AddAuthorization();

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

// 4. Registra o ReportService
builder.Services.AddScoped<ReportService>();

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", cors =>
    {
        cors
            .AllowAnyOrigin()
            .AllowAnyMethod()
            .AllowAnyHeader();
    });
});

// Add HttpClient
builder.Services.AddHttpClient();

var app = builder.Build();

// Configure Swagger
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Pagai API V1");
    c.RoutePrefix = string.Empty;
});

app.UseHttpsRedirection();
app.UseCors("AllowAll");

// Add Gateway Middleware
app.UseMiddleware<LoggingMiddleware>();
app.UseMiddleware<RequestTransformationMiddleware>();
app.UseMiddleware<ErrorHandlingMiddleware>();

// Authentication and Authorization
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Health Check Endpoint
app.MapGet("/health", () => Results.Ok(new 
{ 
    status = "Backend is running", 
    timestamp = DateTime.UtcNow,
    gateway = "enabled"
}))
.WithName("Health")
.WithOpenApi()
.AllowAnonymous();

app.Run();