using Microsoft.EntityFrameworkCore;
using ApiClientes.Data;
using ApiClientes.Models;


var builder = WebApplication.CreateBuilder(args);

// Configura o EF Core com banco em memória
builder.Services.AddDbContext<AppDb>(options =>
    options.UseInMemoryDatabase("ClientesDb"));

// Configura Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Ativa Swagger no ambiente de desenvolvimento
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
app.MapGet("/clientes", async (AppDb db) =>
    await db.Clientes.ToListAsync());

// GET - Busca cliente por ID
app.MapGet("/cliente/{id}", async (AppDb db, int id) =>
{
    var cliente = await db.Clientes.FindAsync(id);
    return cliente is not null ? Results.Ok(cliente) : Results.NotFound();
});

// POST - Cria novo cliente
app.MapPost("/cliente", async (AppDb db, Cliente cliente) =>
{
    await db.Clientes.AddAsync(cliente);
    await db.SaveChangesAsync();
    return Results.Created($"/cliente/{cliente.Id}", cliente);
});

// PUT - Atualiza cliente existente
app.MapPut("/cliente/{id}", async (AppDb db, Cliente update, int id) =>
{
    var cliente = await db.Clientes.FindAsync(id);
    if (cliente is null) return Results.NotFound();

    cliente.Nome = update.Nome;
    cliente.CPF = update.CPF;
    cliente.Telefone = update.Telefone;
    cliente.Endereco = update.Endereco;
    cliente.Email = update.Email;

    await db.SaveChangesAsync();
    return Results.NoContent();
});

// DELETE - Remove cliente
app.MapDelete("/cliente/{id}", async (AppDb db, int id) =>
{
    var cliente = await db.Clientes.FindAsync(id);
    if (cliente is null) return Results.NotFound();

    db.Clientes.Remove(cliente);
    await db.SaveChangesAsync();
    return Results.Ok();
});


app.Run();
