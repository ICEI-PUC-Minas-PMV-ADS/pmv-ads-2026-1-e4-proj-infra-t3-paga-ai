using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using MongoDB.Driver;
using BCrypt.Net;
// Criamos um alias para evitar o conflito de nomes
using UserEntity = Usuario.API.Models.Usuario; 
using MongoDB.Bson;
using Microsoft.Extensions.DependencyInjection;

namespace Usuarios.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    // Usando o alias 'UserEntity' em vez de 'Usuario'
    private readonly IMongoCollection<UserEntity>? _usuarios;
    private readonly IConfiguration _config;
    private readonly Usuario.API.Services.EmailService? _emailService;

    // Fallback em memória para desenvolvimento quando Mongo estiver inacessível
    private static readonly System.Collections.Concurrent.ConcurrentDictionary<string, UserEntity> _inMemoryUsers = new();

    private bool UseInMemory => _usuarios == null;

    public AuthController(
        IMongoDatabase database,
        IConfiguration config,
        Usuario.API.Services.EmailService? emailService)
    {
        try
        {
            // Tentar obter a collection normalmente
            _usuarios = database.GetCollection<UserEntity>("usuarios", null);
        }
        catch (Exception ex)
        {
            Console.WriteLine("[WARN] Não foi possível inicializar collection do MongoDB: " + ex.Message);
            _usuarios = null;
        }

        _config = config;
        _emailService = emailService;
    }

    [HttpPost("registrar")]
    public async Task<IActionResult> Registrar([FromBody] RegisterRequest request)
    {
        try
        {
            if (request == null)
                return BadRequest(new { mensagem = "Dados de requisição inválidos." });

            if (string.IsNullOrWhiteSpace(request.Nome))
                return BadRequest(new { mensagem = "Nome é obrigatório." });
            if (string.IsNullOrWhiteSpace(request.Email))
                return BadRequest(new { mensagem = "E-mail é obrigatório." });
            if (string.IsNullOrWhiteSpace(request.Senha))
                return BadRequest(new { mensagem = "Senha é obrigatória." });

            UserEntity? existe = null;
            if (!UseInMemory)
            {
                try
                {
                    existe = await _usuarios!.Find(x => x.Email == request.Email).FirstOrDefaultAsync();
                }
                catch (Exception ex)
                {
                    Console.WriteLine("[WARN] Erro ao consultar Mongo (registrar): " + ex.Message);
                    existe = null;
                }
            }
            else
            {
                existe = _inMemoryUsers.Values.FirstOrDefault(u => u.Email == request.Email);
            }

            if (existe != null)
                return BadRequest(new { mensagem = "E-mail já cadastrado." });

            var novoUsuario = new UserEntity
            {
                Nome = request.Nome,
                Email = request.Email,
                Senha = BCrypt.Net.BCrypt.HashPassword(request.Senha)
            };

            if (!UseInMemory)
            {
                await _usuarios!.InsertOneAsync(novoUsuario);
            }
            else
            {
                // Simular Id tipo ObjectId
                novoUsuario.Id = ObjectId.GenerateNewId().ToString();
                _inMemoryUsers.TryAdd(novoUsuario.Id!, novoUsuario);
            }

            return Created("", new { mensagem = "Usuário registrado com sucesso!", id = novoUsuario.Id });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Erro ao registrar: {ex.Message}");
            Console.WriteLine($"Stack: {ex.StackTrace}");
            return StatusCode(500, new { mensagem = $"Erro ao registrar usuário: {ex.Message}" });
        }
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        UserEntity? usuario = null;

        if (!UseInMemory)
        {
            try
            {
                usuario = await _usuarios!.Find(x => x.Email == request.Email).FirstOrDefaultAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine("[WARN] Erro ao consultar Mongo (login): " + ex.Message);
                usuario = null;
            }
        }
        else
        {
            usuario = _inMemoryUsers.Values.FirstOrDefault(u => u.Email == request.Email);
        }

        if (usuario == null || !BCrypt.Net.BCrypt.Verify(request.Senha, usuario.Senha))
            return Unauthorized(new { mensagem = "E-mail ou senha inválidos." });

        var token = GerarToken(usuario);
        return Ok(new { token });
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
            return BadRequest(new { mensagem = "E-mail é obrigatório." });

        if (!IsValidEmail(request.Email))
            return BadRequest(new { mensagem = "E-mail inválido." });

        UserEntity? usuario = null;
        if (!UseInMemory)
        {
            try
            {
                usuario = await _usuarios!.Find(x => x.Email == request.Email).FirstOrDefaultAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine("[WARN] Erro ao consultar Mongo (forgot-password): " + ex.Message);
                usuario = null;
            }
        }
        else
        {
            usuario = _inMemoryUsers.Values.FirstOrDefault(u => u.Email == request.Email);
        }

        if (usuario == null)
        {
            // Não vazamos se o e-mail existe.
            return Ok(new { mensagem = "Se o e-mail existir, você receberá instruções em breve." });
        }

        // Gerar um token simples para redefinição (em produção, usar JWT ou GUID)
        var resetToken = Guid.NewGuid().ToString();
        // Aqui poderia salvar o token no banco com expiração

        var frontendUrl = _config["FrontendSettings:Url"] ?? "http://localhost:5173";
        var resetLink = $"{frontendUrl.TrimEnd('/')}/#/reset-password?token={Uri.EscapeDataString(resetToken)}&email={Uri.EscapeDataString(request.Email)}";

        var subject = "Redefinição de Senha - Paga Aí";
        var body = $@"
        <h2>Redefinição de Senha</h2>
        <p>Olá {usuario.Nome},</p>
        <p>Você solicitou a redefinição de senha para sua conta no Paga Aí.</p>
        <p>Clique no link abaixo para redefinir sua senha:</p>
        <a href='{resetLink}'>Redefinir Senha</a>
        <p>Se você não solicitou isso, ignore este email.</p>
        <p>Atenciosamente,<br>Equipe Paga Aí</p>
        ";

        try
        {
            await _emailService.SendEmailAsync(request.Email, subject, body);
            return Ok(new { mensagem = "Instruções enviadas para o e-mail." });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Erro ao enviar email: {ex.Message}");
            return StatusCode(500, new { mensagem = "Erro ao enviar e-mail. Tente novamente." });
        }
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Token) || string.IsNullOrWhiteSpace(request.NewPassword))
            return BadRequest(new { mensagem = "Todos os campos são obrigatórios." });

        if (request.NewPassword.Length < 6)
            return BadRequest(new { mensagem = "A senha deve ter ao menos 6 caracteres." });

        UserEntity? usuario = null;
        if (!UseInMemory)
        {
            try
            {
                usuario = await _usuarios!.Find(x => x.Email == request.Email).FirstOrDefaultAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine("[WARN] Erro ao consultar Mongo (reset-password): " + ex.Message);
                usuario = null;
            }
        }
        else
        {
            usuario = _inMemoryUsers.Values.FirstOrDefault(u => u.Email == request.Email);
        }

        if (usuario == null)
            return BadRequest(new { mensagem = "Usuário não encontrado." });

        // Aqui, validar o token (simples, apenas verificar se existe; em produção, verificar expiração)
        // Por simplicidade, aceitamos qualquer token por enquanto

        var hashedPassword = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);

        if (!UseInMemory)
        {
            var update = Builders<UserEntity>.Update.Set(u => u.Senha, hashedPassword);
            await _usuarios!.UpdateOneAsync(x => x.Email == request.Email, update);
        }
        else
        {
            var existing = _inMemoryUsers.Values.FirstOrDefault(u => u.Email == request.Email);
            if (existing != null && existing.Id != null)
            {
                existing.Senha = hashedPassword;
                _inMemoryUsers[existing.Id] = existing;
            }
        }

        return Ok(new { mensagem = "Senha redefinida com sucesso." });
    }

    private bool IsValidEmail(string email)
    {
        try
        {
            var addr = new System.Net.Mail.MailAddress(email);
            return addr.Address == email;
        }
        catch
        {
            return false;
        }
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

public class RegisterRequest
{
    public string Nome { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Senha { get; set; } = string.Empty;
}

public class LoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Senha { get; set; } = string.Empty;
}

public class ForgotPasswordRequest
{
    public string Email { get; set; } = string.Empty;
}

public class ResetPasswordRequest
{
    public string Email { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}
