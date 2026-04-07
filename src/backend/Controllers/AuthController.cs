using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using MongoDB.Driver;
using backend.Models;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IMongoCollection<Usuario> _usuarios;
    private readonly IConfiguration _config;

    public AuthController(IMongoDatabase database, IConfiguration config)
    {
        _usuarios = database.GetCollection<Usuario>("usuarios");
        _config = config;
    }

    // POST api/auth/registrar
    [HttpPost("registrar")]
    public async Task<IActionResult> Registrar(Usuario novo)
    {
        var existe = await _usuarios.Find(x => x.Email == novo.Email).FirstOrDefaultAsync();
        if (existe != null)
            return BadRequest(new { mensagem = "E-mail já cadastrado." });

        // Hash da senha
        novo.Senha = BCrypt.Net.BCrypt.HashPassword(novo.Senha);

        await _usuarios.InsertOneAsync(novo);
        return Created("", new { mensagem = "Usuário registrado com sucesso!" });
    }

    // POST api/auth/login
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var usuario = await _usuarios.Find(x => x.Email == request.Email).FirstOrDefaultAsync();

        if (usuario == null || !BCrypt.Net.BCrypt.Verify(request.Senha, usuario.Senha))
            return Unauthorized(new { mensagem = "E-mail ou senha inválidos." });

        var token = GerarToken(usuario);
        return Ok(new { token });
    }

    private string GerarToken(Usuario usuario)
    {
        var chave = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_config["JwtSettings:SecretKey"]!));

        var credenciais = new SigningCredentials(chave, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, usuario.Id!),
            new Claim(ClaimTypes.Email, usuario.Email),
            new Claim(ClaimTypes.Name, usuario.Nome)
        };

        var token = new JwtSecurityToken(
            issuer: _config["JwtSettings:Issuer"],
            audience: _config["JwtSettings:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: credenciais
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

// DTO simples para o login
public class LoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Senha { get; set; } = string.Empty;
}