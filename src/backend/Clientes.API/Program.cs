using MongoDB.Driver;
using Microsoft.AspNetCore.Authentication.JwtBearer; // Adicionado
using Microsoft.IdentityModel.Tokens; // Adicionado
using System.Text; // Adicionado

var builder = WebApplication.CreateBuilder(args);

// 1. SERVIÇOS BÁSICOS
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// 2. MONGODB
builder.Services.AddSingleton<IMongoClient>(s =>
    new MongoClient(builder.Configuration.GetValue<string>("MongoDbSettings:ConnectionString")));

builder.Services.AddSingleton<IMongoDatabase>(s => {
    var client = s.GetRequiredService<IMongoClient>();
    var dbName = builder.Configuration.GetValue<string>("MongoDbSettings:DatabaseName");
    return client.GetDatabase(dbName);
});

// 3. AUTENTICAÇÃO JWT (Obrigatório para validar o login vindo do Gateway)
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

// 4. CORS (Essencial para o Gateway/Frontend não ser bloqueado)
builder.Services.AddCors(options => {
    options.AddPolicy("AllowAll", b => b.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

var app = builder.Build();

// 5. PIPELINE (A ORDEM IMPORTA!)
app.UseSwagger();
app.UseSwaggerUI(c => {
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Clientes API V1");
    c.RoutePrefix = string.Empty; // Swagger na raiz da URL
});

app.UseCors("AllowAll"); // Deve vir antes da autenticação
app.UseHttpsRedirection();

app.UseAuthentication(); // Adicionado
app.UseAuthorization();

app.MapControllers();
app.Run();
