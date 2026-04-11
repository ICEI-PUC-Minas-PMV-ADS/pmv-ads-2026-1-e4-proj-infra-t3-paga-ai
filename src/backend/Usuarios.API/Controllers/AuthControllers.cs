using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using MongoDB.Driver;
using BCrypt.Net;
// Criamos um alias para evitar o conflito de nomes
using UserEntity = Usuario.API.Models.Usuario; 

namespace Usuarios.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    // Usando o alias 'UserEntity' em vez de 'Usuario'
    private readonly IMongoCollection<UserEntity> _usuarios;
    private readonly IConfiguration _config;

    public AuthController(IMongoDatabase database, IConfiguration config)
    {
        _usuarios = database.GetCollection<UserEntity>("usuarios");
        _config = config;
    }

    [HttpPost("registrar")]
    public async Task<IActionResult> Registrar(UserEntity novo)
    {
        var existe = await _usuarios.Find(x => x.Email == novo.Email).FirstOrDefaultAsync();
        if (existe != null)
            return BadRequest(new { mensagem = "E-mail já cadastrado." });

        novo.Senha = BCrypt.Net.BCrypt.HashPassword(novo.Senha);

        await _usuarios.InsertOneAsync(novo);
        return Created("", new { mensagem = "Usuário registrado com sucesso!" });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var usuario = await _usuarios.Find(x => x.Email == request.Email).FirstOrDefaultAsync();

        if (usuario == null || !BCrypt.Net.BCrypt.Verify(request.Senha, usuario.Senha))
            return Unauthorized(new { mensagem = "E-mail ou senha inválidos." });

        var token = GerarToken(usuario);
        return Ok(new { token });
    }

    private string GerarToken(UserEntity usuario)
    {
        var secretKey = _config["JwtSettings:SecretKey"] ?? "Chave_Super_Secreta_Com_Mais_De_32_Chars";
        var chave = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));

        var credenciais = new SigningCredentials(chave, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, usuario.Id?.ToString() ?? ""),
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

public class LoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Senha { get; set; } = string.Empty;
}
