using MongoDB.Driver;
using backend.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// 2. Configura o MongoDB usando o appsettings.json ou variáveis de ambiente
var mongoConnectionString = builder.Configuration.GetValue<string>("MongoDbSettings:ConnectionString")
    ?? builder.Configuration.GetValue<string>("MONGODB_CONNECTIONSTRING")
    ?? throw new InvalidOperationException("MongoDB connection string is not configured. Set MongoDbSettings:ConnectionString in appsettings.json or the environment variable MONGODB_CONNECTIONSTRING.");

var mongoDatabaseName = builder.Configuration.GetValue<string>("MongoDbSettings:DatabaseName")
    ?? throw new InvalidOperationException("MongoDB database name is not configured. Set MongoDbSettings:DatabaseName in appsettings.json.");

builder.Services.AddSingleton<IMongoClient>(s => new MongoClient(mongoConnectionString));

// 3. Injeta o Database específico
builder.Services.AddSingleton<IMongoDatabase>(s => {
    var client = s.GetRequiredService<IMongoClient>();
    return client.GetDatabase(mongoDatabaseName);
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