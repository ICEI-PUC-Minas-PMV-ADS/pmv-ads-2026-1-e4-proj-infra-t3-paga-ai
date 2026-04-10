using MongoDB.Driver;
using backend.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// 2. Configura o MongoDB usando o appsettings.json ou Variáveis de Ambiente do Azure
builder.Services.AddSingleton<IMongoClient>(s =>
    new MongoClient(builder.Configuration.GetValue<string>("MongoDbSettings:ConnectionString")));

// 3. Injeta o Database específico "pagai"
builder.Services.AddSingleton<IMongoDatabase>(s => {
    var client = s.GetRequiredService<IMongoClient>();
    var dbName = builder.Configuration.GetValue<string>("MongoDbSettings:DatabaseName");
    return client.GetDatabase(dbName);
});

// 4. Registra o ReportService
builder.Services.AddScoped<ReportService>();

var app = builder.Build();

// FORÇAR SWAGGER EM QUALQUER AMBIENTE (Inclusive Produção no Azure)
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Pagai API V1");
    c.RoutePrefix = string.Empty; // Isso faz o Swagger abrir direto na URL principal do Azure
});

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();