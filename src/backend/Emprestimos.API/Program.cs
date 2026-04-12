using MongoDB.Driver;
using Microsoft.AspNetCore.Authentication.JwtBearer; // Adicionado
using Microsoft.IdentityModel.Tokens; // Adicionado
using System.Text; // Adicionado

var builder = WebApplication.CreateBuilder(args);

// --- SERVIÇOS ---
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// --- MONGODB ---
builder.Services.AddSingleton<IMongoClient>(s =>
    new MongoClient(builder.Configuration.GetValue<string>("MongoDbSettings:ConnectionString")));

builder.Services.AddSingleton<IMongoDatabase>(s => {
    var client = s.GetRequiredService<IMongoClient>();
    var dbName = builder.Configuration.GetValue<string>("MongoDbSettings:DatabaseName");
    return client.GetDatabase(dbName);
});

// --- AUTENTICAÇÃO JWT (Obrigatório para validar o token vindo do Gateway) ---
var chaveJwt = builder.Configuration["JwtSettings:SecretKey"]!;
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["JwtSettings:Issuer"],
            ValidAudience = builder.Configuration["JwtSettings:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(chaveJwt))
        };
    });

builder.Services.AddAuthorization();

// --- CORS (Para o Gateway conseguir acessar) ---
builder.Services.AddCors(options => {
    options.AddPolicy("AllowAll", b => b.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});
builder.Services.AddHttpClient();
var app = builder.Build();

// --- PIPELINE ---
app.UseSwagger();
app.UseSwaggerUI(c => {
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "API V1");
    c.RoutePrefix = string.Empty; // Facilita ver o Swagger na Azure
});

app.UseCors("AllowAll"); // Antes da Autenticação
app.UseHttpsRedirection();

app.UseAuthentication(); // Obrigatório para validar quem está logado
app.UseAuthorization();

app.MapControllers();
app.Run();
public partial class Program { }
