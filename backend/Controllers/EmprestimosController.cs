using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using backend.Models;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EmprestimosController : ControllerBase
{
    private readonly IMongoCollection<Emprestimo> _emprestimos;

    public EmprestimosController (IMongoDatabase database)
    {
        
        _emprestimos = database.GetCollection<Emprestimo>("emprestimos");
    }

    [HttpGet]
    public  async Task<List<Emprestimo>> Get() =>
        await _emprestimos.Find(_ => true).ToListAsync();

    [HttpPost]
    public async Task<IActionResult> Post(Emprestimo novo)
    {
        await _emprestimos.InsertOneAsync(novo);
        return CreatedAtAction(nameof(Get), new { id = novo.Id }, novo);
    }    
}