using ApiClientes.Settings;
using ApiClientes.Services;
using ApiClientes.Models;

var builder = WebApplication.CreateBuilder(args);

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configurações do MongoDB
builder.Services.Configure<MongoDbSettings>(
    builder.Configuration.GetSection("MongoDbSettings"));

// Serviço de clientes (MongoDB)
builder.Services.AddSingleton<ClienteService>();

var app = builder.Build();

// Swagger no desenvolvimento
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// =========================
// ROTAS DA API DE CLIENTES
// =========================

// GET - Lista todos os clientes
app.MapGet("/clientes", async (ClienteService service) =>
    await service.GetAsync());

// GET - Busca cliente por ID
app.MapGet("/cliente/{id}", async (ClienteService service, string id) =>
{
    var cliente = await service.GetByIdAsync(id);
    return cliente is not null ? Results.Ok(cliente) : Results.NotFound();
});

// POST - Cria novo cliente
app.MapPost("/cliente", async (ClienteService service, Cliente cliente) =>
{
    await service.CreateAsync(cliente);
    return Results.Created($"/cliente/{cliente.Id}", cliente);
});

// PUT - Atualiza cliente existente
app.MapPut("/cliente/{id}", async (ClienteService service, string id, Cliente update) =>
{
    var cliente = await service.GetByIdAsync(id);
    if (cliente is null) return Results.NotFound();

    update.Id = cliente.Id; // garante que o Id não muda
    await service.UpdateAsync(id, update);

    return Results.NoContent();
});

// DELETE - Remove cliente
app.MapDelete("/cliente/{id}", async (ClienteService service, string id) =>
{
    var cliente = await service.GetByIdAsync(id);
    if (cliente is null) return Results.NotFound();

    await service.DeleteAsync(id);
    return Results.Ok();
});

app.Run();
