using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using backend.Models;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace backend.Controllers;

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

    private string GetCobradorId() =>
        User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? string.Empty;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Cliente>>> Get()
    {
        var clientes = await _clientes.Find(_ => true).ToListAsync();
        return Ok(clientes);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Cliente>> Get(string id)
    {
        var cliente = await _clientes.Find(c => c.Id == id).FirstOrDefaultAsync();

        if (cliente is null)
            return NotFound(new { mensagem = $"Cliente com ID {id} não encontrado." });

        return Ok(cliente);
    }

    [HttpPost]
    public async Task<IActionResult> Post(Cliente novoCliente)
    {
        novoCliente.CobradorId = GetCobradorId();
        await _clientes.InsertOneAsync(novoCliente);
        return CreatedAtAction(nameof(Get), new { id = novoCliente.Id }, novoCliente);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, Cliente clienteAtualizado)
    {
        clienteAtualizado.Id = id;

        var result = await _clientes.ReplaceOneAsync(c => c.Id == id, clienteAtualizado);

        if (result.MatchedCount == 0)
            return NotFound(new { mensagem = $"Cliente com ID {id} não encontrado." });

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var result = await _clientes.DeleteOneAsync(c => c.Id == id);

        if (result.DeletedCount == 0)
            return NotFound(new { mensagem = $"Cliente com ID {id} não encontrado." });

        return NoContent();
    }
}