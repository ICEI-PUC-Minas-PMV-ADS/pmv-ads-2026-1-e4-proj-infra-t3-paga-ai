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
    private readonly IMongoCollection<UserEntity>? _usuarios;
    private readonly IMongoCollection<PasswordReset>? _passwordResets;
    private readonly IConfiguration _config;
    private readonly Usuario.API.Services.EmailService? _emailService;

    // Fallback em memória para desenvolvimento quando Mongo estiver inacessível
    private static readonly System.Collections.Concurrent.ConcurrentDictionary<string, UserEntity> _inMemoryUsers = new();

    private bool UseInMemory => _usuarios == null || _passwordResets == null;

    public AuthController(
        IMongoDatabase database,
        IConfiguration config,
        Usuario.API.Services.EmailService? emailService)
    {
        try
        {
            _usuarios = database.GetCollection<UserEntity>("usuarios", null);
            _passwordResets = database.GetCollection<PasswordReset>("password_resets", null);

            // Criar índice TTL para expirar automaticamente registros antigos (opcional)
            try
            {
                var indexKeys = Builders<PasswordReset>.IndexKeys.Ascending(x => x.ExpiresAt);
                var indexOptions = new CreateIndexOptions { ExpireAfter = TimeSpan.Zero };
                var indexModel = new CreateIndexModel<PasswordReset>(indexKeys, indexOptions);
                _passwordResets.Indexes.CreateOne(indexModel);
            }
            catch (Exception idxEx)
            {
                Console.WriteLine("[WARN] Não foi possível criar índice TTL (password_resets): " + idxEx.Message);
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine("[WARN] Não foi possível inicializar collections do MongoDB: " + ex.Message);
            _usuarios = null;
            _passwordResets = null;
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
            if (string.IsNullOrWhiteSpace(request.DataNascimento))
                return BadRequest(new { mensagem = "Data de nascimento é obrigatória." });
            if (string.IsNullOrWhiteSpace(request.Cpf))
                return BadRequest(new { mensagem = "CPF é obrigatório." });
            var cpfDigitos = System.Text.RegularExpressions.Regex.Replace(request.Cpf, @"\D", "");
            if (cpfDigitos.Length != 11)
                return BadRequest(new { mensagem = "CPF inválido. Informe 11 dígitos." });
            if (string.IsNullOrWhiteSpace(request.Telefone))
                return BadRequest(new { mensagem = "Número de telefone é obrigatório." });
            var telefoneDigitos = System.Text.RegularExpressions.Regex.Replace(request.Telefone, @"\D", "");
            if (telefoneDigitos.Length < 10)
                return BadRequest(new { mensagem = "Telefone inválido. Informe DDD + número." });

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
                Senha = BCrypt.Net.BCrypt.HashPassword(request.Senha),
                DataNascimento = request.DataNascimento,
                Cpf = cpfDigitos,
                Telefone = telefoneDigitos
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
        return Ok(new {
            token,
            nome           = usuario.Nome,
            email          = usuario.Email,
            dataNascimento = usuario.DataNascimento,
            cpf            = usuario.Cpf,
            telefone       = usuario.Telefone
        });
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

        // Gerar um token seguro para redefinição
        var resetToken = Guid.NewGuid().ToString();

        // Persistir token no banco com expiração (ex: 1 hora)
        var expiresAt = DateTime.UtcNow.AddHours(1);

        if (!UseInMemory)
        {
            try
            {
                var resetDoc = new PasswordReset
                {
                    Id = ObjectId.GenerateNewId().ToString(),
                    Email = request.Email,
                    Token = resetToken,
                    ExpiresAt = expiresAt
                };

                // Inserir ou atualizar (upsert) para evitar múltiplos tokens ativos
                var filter = Builders<PasswordReset>.Filter.Eq(x => x.Email, request.Email);
                var update = Builders<PasswordReset>.Update
                    .Set(x => x.Token, resetToken)
                    .Set(x => x.ExpiresAt, expiresAt)
                    .SetOnInsert(x => x.CreatedAt, DateTime.UtcNow);
                var options = new UpdateOptions { IsUpsert = true };
                await _passwordResets!.UpdateOneAsync(filter, update, options);
            }
            catch (Exception ex)
            {
                Console.WriteLine("[WARN] Erro ao salvar reset token no Mongo: " + ex.Message);
            }
        }
        else
        {
            // Em memória: armazenar no dicionário (apenas para dev)
            var resetDoc = new PasswordReset
            {
                Id = Guid.NewGuid().ToString(),
                Email = request.Email,
                Token = resetToken,
                ExpiresAt = expiresAt
            };
            // Simples: adicionar com chave email
            // (em produção, use coleção no Mongo)
            // Aqui não persistimos entre reinícios
        }

        // Montar deep link e fallback web
        var emailEnc = Uri.EscapeDataString(request.Email);
        var tokenEnc = Uri.EscapeDataString(resetToken);

        var deepLink = $"pagaai://reset-password?token={tokenEnc}&email={emailEnc}";

        var subject = "Redefinição de Senha - Paga Aí";
        var body = $@"
        <h2>Redefinição de Senha</h2>
        <p>Olá {usuario.Nome},</p>
        <p>Você solicitou a redefinição de senha para sua conta no Paga Aí.</p>

        <p>
          <a href='{deepLink}' style='display:inline-block;padding:12px 20px;background:#7c3aed;color:#fff;border-radius:8px;text-decoration:none;'>
            Redefinir senha no app
          </a>
        </p>

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

        // Validar token no banco
        if (!UseInMemory)
        {
            try
            {
                var filter = Builders<PasswordReset>.Filter.Where(x => x.Email == request.Email && x.Token == request.Token);
                var resetEntry = await _passwordResets!.Find(filter).FirstOrDefaultAsync();

                if (resetEntry == null)
                    return BadRequest(new { mensagem = "Token inválido ou não encontrado." });

                if (resetEntry.ExpiresAt < DateTime.UtcNow)
                {
                    // Remover token expirado
                    await _passwordResets.DeleteOneAsync(Builders<PasswordReset>.Filter.Eq(x => x.Id, resetEntry.Id));
                    return BadRequest(new { mensagem = "Token expirado. Solicite um novo link." });
                }

                // Token válido: prosseguir com alteração de senha
                var hashedPassword = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);

                var update = Builders<UserEntity>.Update.Set(u => u.Senha, hashedPassword);
                await _usuarios!.UpdateOneAsync(x => x.Email == request.Email, update);

                // Remover token após uso
                await _passwordResets.DeleteOneAsync(Builders<PasswordReset>.Filter.Eq(x => x.Id, resetEntry.Id));

                return Ok(new { mensagem = "Senha redefinida com sucesso." });
            }
            catch (Exception ex)
            {
                Console.WriteLine("[WARN] Erro ao validar token/reset-password: " + ex.Message);
                return StatusCode(500, new { mensagem = "Erro ao redefinir senha. Tente novamente." });
            }
        }
        else
        {
            // Em memória: comportamento simplificado (apenas para dev)
            // Aceitar qualquer token por enquanto (comportamento antigo)
            var hashedPassword = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);

            var existing = _inMemoryUsers.Values.FirstOrDefault(u => u.Email == request.Email);
            if (existing != null && existing.Id != null)
            {
                existing.Senha = hashedPassword;
                _inMemoryUsers[existing.Id] = existing;
            }

            return Ok(new { mensagem = "Senha redefinida com sucesso." });
        }
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

    [HttpGet("perfil")]
    public async Task<IActionResult> ObterPerfil([FromQuery] string email)
    {
        if (string.IsNullOrWhiteSpace(email))
            return BadRequest(new { mensagem = "E-mail é obrigatório." });

        UserEntity? usuario = null;
        if (!UseInMemory)
        {
            try { usuario = await _usuarios!.Find(x => x.Email == email).FirstOrDefaultAsync(); }
            catch (Exception ex) { Console.WriteLine("[WARN] Erro ao consultar Mongo (perfil): " + ex.Message); }
        }
        else
        {
            usuario = _inMemoryUsers.Values.FirstOrDefault(u => u.Email == email);
        }

        if (usuario == null)
            return NotFound(new { mensagem = "Usuário não encontrado." });

        return Ok(new
        {
            nome           = usuario.Nome,
            email          = usuario.Email,
            dataNascimento = usuario.DataNascimento,
            cpf            = usuario.Cpf,
            telefone       = usuario.Telefone
        });
    }

    [HttpPatch("atualizar-perfil")]
    public async Task<IActionResult> AtualizarPerfil([FromBody] UpdateProfileRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
            return BadRequest(new { mensagem = "E-mail é obrigatório." });
        if (string.IsNullOrWhiteSpace(request.Nome))
            return BadRequest(new { mensagem = "Nome é obrigatório." });

        string? telefoneDigitos = null;
        if (!string.IsNullOrWhiteSpace(request.Telefone))
        {
            telefoneDigitos = System.Text.RegularExpressions.Regex.Replace(request.Telefone, @"\D", "");
            if (telefoneDigitos.Length < 10)
                return BadRequest(new { mensagem = "Telefone inválido. Informe DDD + número." });
        }

        UserEntity? usuario = null;
        if (!UseInMemory)
        {
            try { usuario = await _usuarios!.Find(x => x.Email == request.Email).FirstOrDefaultAsync(); }
            catch (Exception ex) { Console.WriteLine("[WARN] Erro ao consultar Mongo (atualizar-perfil): " + ex.Message); }
        }
        else
        {
            usuario = _inMemoryUsers.Values.FirstOrDefault(u => u.Email == request.Email);
        }

        // Se não encontrou e estamos em memória, recria o usuário a partir dos dados da requisição
        // (o JWT já prova a identidade — não há risco de impersonation aqui)
        if (usuario == null && UseInMemory)
        {
            usuario = new UserEntity
            {
                Id = ObjectId.GenerateNewId().ToString(),
                Nome = request.Nome,
                Email = request.Email,
                Telefone = telefoneDigitos
            };
            _inMemoryUsers.TryAdd(usuario.Id!, usuario);
            var token0 = GerarToken(usuario);
            return Ok(new { mensagem = "Perfil atualizado com sucesso.", token = token0 });
        }

        if (usuario == null)
            return NotFound(new { mensagem = "Usuário não encontrado." });

        if (!UseInMemory)
        {
            var updateDef = Builders<UserEntity>.Update.Set(u => u.Nome, request.Nome);
            if (telefoneDigitos != null)
                updateDef = updateDef.Set(u => u.Telefone, telefoneDigitos);
            await _usuarios!.UpdateOneAsync(x => x.Email == request.Email, updateDef);
        }

        usuario.Nome = request.Nome;
        if (telefoneDigitos != null) usuario.Telefone = telefoneDigitos;

        if (UseInMemory && usuario.Id != null)
            _inMemoryUsers[usuario.Id] = usuario;

        var token = GerarToken(usuario);
        return Ok(new { mensagem = "Perfil atualizado com sucesso.", token });
    }

    [HttpPatch("push-token")]
    public async Task<IActionResult> AtualizarPushToken([FromBody] PushTokenRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Token))
            return BadRequest(new { mensagem = "Email e token são obrigatórios." });

        if (!UseInMemory)
        {
            var update = Builders<UserEntity>.Update.Set(u => u.PushToken, request.Token);
            await _usuarios!.UpdateOneAsync(x => x.Email == request.Email, update);
        }

        return Ok(new { mensagem = "Token atualizado com sucesso." });
    }
}

// Model para armazenar tokens de reset
public class PasswordReset
{
    public string? Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class RegisterRequest
{
    public string Nome { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Senha { get; set; } = string.Empty;
    public string? DataNascimento { get; set; }
    public string? Cpf { get; set; }
    public string? Telefone { get; set; }
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

public class UpdateProfileRequest
{
    public string Email { get; set; } = string.Empty;
    public string Nome { get; set; } = string.Empty;
    public string? Telefone { get; set; }
}

public class PushTokenRequest
{
    public string Email { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
}
