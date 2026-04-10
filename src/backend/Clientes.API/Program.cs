using MongoDB.Driver;
// Remova o using de Reports.API.Services se não for usar services aqui

var builder = WebApplication.CreateBuilder(args);

// 1. Isso aqui já cuida de todos os seus Controllers!
builder.Services.AddControllers();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// 2. Configuração do MongoDB (Mantenha igual)
builder.Services.AddSingleton<IMongoClient>(s =>
    new MongoClient(builder.Configuration.GetValue<string>("MongoDbSettings:ConnectionString")));

builder.Services.AddSingleton<IMongoDatabase>(s => {
    var client = s.GetRequiredService<IMongoClient>();
    var dbName = builder.Configuration.GetValue<string>("MongoDbSettings:DatabaseName");
    return client.GetDatabase(dbName);
});

// 3. SE NÃO TEM SERVICE, NÃO PRECISA ADICIONAR NADA AQUI.
// Apague a linha: builder.Services.AddScoped<Notificacoes.API.Controllers>();

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI(); 

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();
