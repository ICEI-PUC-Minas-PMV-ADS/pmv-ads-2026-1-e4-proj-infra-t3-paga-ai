using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using Clientes.API.Models;
using Microsoft.AspNetCore.Authorization;

namespace Clientes.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ClientesController : ControllerBase
{
    private readonly IMongoCollection<Cliente> _clientes;

    public ClientesController(IMongoDatabase database)
    {
        _clientes = database.GetCollection<Cliente>("clientes");
    }

    [HttpGet]
public async Task<ActionResult<IEnumerable<Cliente>>> Get()
{
    var cobrador = User.Identity?.Name;
    var clientes = cobrador != null
        ? await _clientes.Find(c => c.Cobrador == cobrador).ToListAsync()
        : await _clientes.Find(_ => true).ToListAsync();
    return Ok(clientes);
}

    [HttpGet("{id}")]
    public async Task<ActionResult<Cliente>> Get(int id)
    {
        var cliente = await _clientes.Find(c => c.Id == id).FirstOrDefaultAsync();

        if (cliente is null)
            return NotFound(new { mensagem = $"Cliente com ID {id} não encontrado." });

        return Ok(cliente);
    }

    [HttpPost]
public async Task<IActionResult> Post(Cliente novoCliente)
{
    novoCliente.Cobrador = User.Identity?.Name;

    var ultimoCliente = await _clientes.Find(_ => true)
        .SortByDescending(c => c.Id)
        .Limit(1)
        .FirstOrDefaultAsync();

    novoCliente.Id = (ultimoCliente?.Id ?? 0) + 1;

    await _clientes.InsertOneAsync(novoCliente);
    return CreatedAtAction(nameof(Get), new { id = novoCliente.Id }, novoCliente);
}

    [HttpPut("{id}")]
public async Task<IActionResult> Update(int id, Cliente clienteAtualizado)
{
    var clienteExistente = await _clientes.Find(c => c.Id == id).FirstOrDefaultAsync();
    
    if (clienteExistente is null)
        return NotFound(new { mensagem = $"Cliente com ID {id} não encontrado." });

    clienteAtualizado.Id = id;
    clienteAtualizado.Cobrador = clienteExistente.Cobrador; // preserva o cobrador

    var result = await _clientes.ReplaceOneAsync(c => c.Id == id, clienteAtualizado);

    if (result.MatchedCount == 0)
        return NotFound(new { mensagem = $"Cliente com ID {id} não encontrado." });

    return NoContent();
}
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _clientes.DeleteOneAsync(c => c.Id == id);

        if (result.DeletedCount == 0)
            return NotFound(new { mensagem = $"Cliente com ID {id} não encontrado." });

        return NoContent();
    }
}