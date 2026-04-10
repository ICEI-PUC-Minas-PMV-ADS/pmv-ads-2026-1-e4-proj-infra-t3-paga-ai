using MongoDB.Driver;
using Reports.API.Services; // Ajuste o namespace para o novo projeto

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configuração do MongoDB (Repita isso nos outros que usarem banco)
builder.Services.AddSingleton<IMongoClient>(s =>
    new MongoClient(builder.Configuration.GetValue<string>("MongoDbSettings:ConnectionString")));

builder.Services.AddSingleton<IMongoDatabase>(s => {
    var client = s.GetRequiredService<IMongoClient>();
    var dbName = builder.Configuration.GetValue<string>("MongoDbSettings:DatabaseName");
    return client.GetDatabase(dbName);
});

// Registra APENAS o que é deste serviço
builder.Services.AddScoped<ReportService>();

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI(); // No microserviço, pode deixar o padrão

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();
