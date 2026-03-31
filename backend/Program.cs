using MongoDB.Driver;


var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// 2. Configura o MongoDB usando o appsenttings.json
builder.Services.AddSingleton<IMongoClient>(s => 
    new MongoClient(builder.Configuration.GetValue<string>("MongoDbSettings:ConnectionString")));


// 3. Injeta o Database específico "pagai" para facilitar o uso nos Controllers
builder.Services.AddSingleton(s => {
    var client = s.GetRequiredService<IMongoClient>();
    var dbName = builder.Configuration.GetValue<string>("MongoDBSettings:DatabaseName");
    return client.GetDatabase(dbName);
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.MapControllers();

app.Run();