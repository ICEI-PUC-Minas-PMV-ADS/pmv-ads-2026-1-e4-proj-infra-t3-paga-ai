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
    public  async Task<ActionResult<Emprestimo>> Get(int id)
    {
        var emprestimo = await _emprestimos.Find(x => x.Id == id).FirstOrDefaultAsync();
        return emprestimo is null ? NotFound() : emprestimo;
    }
    [HttpPost]
    public async Task<IActionResult> Post(Emprestimo novo)
    {
        
        await _emprestimos.InsertOneAsync(novo);
        return CreatedAtAction(nameof(Get), new { id = novo.Id }, novo);
    }

    [HttpPut]
    public async Task<IActionResult> Update(int id,  Emprestimo emprestimoAtualizado)
    {
        var emprestimo = await _emprestimos.Find(x => x.Id == id).FirstOrDefaultAsync();
        
        if (emprestimo is null) return NotFound();

        emprestimoAtualizado.Id = emprestimo.Id;

        await _emprestimos.ReplaceOneAsync(x => x.Id == id, emprestimoAtualizado);

        return NoContent();
    } 

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _emprestimos.DeleteOneAsync(x => x.Id == id);

        if (result.DeletedCount == 0) return NotFound();

        return NoContent();
    }   
}