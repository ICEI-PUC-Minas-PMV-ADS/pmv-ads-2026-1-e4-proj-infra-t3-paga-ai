using Xunit;
using Moq;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using MongoDB.Driver;
using Usuarios.API.Controllers;
using UserEntity = Usuario.API.Models.Usuario;

namespace backend.Usuarios.Tests;

public class AuthControllerTests
{
    private readonly Mock<IMongoCollection<UserEntity>> _mockCollection;
    private readonly Mock<IMongoDatabase> _mockDatabase;
    private readonly Mock<IConfiguration> _mockConfig;
    private readonly AuthController _controller;

    public AuthControllerTests()
    {
        _mockCollection = new Mock<IMongoCollection<UserEntity>>();
        _mockDatabase = new Mock<IMongoDatabase>();
        _mockConfig = new Mock<IConfiguration>();

        _mockConfig.Setup(c => c["JwtSettings:SecretKey"])
            .Returns("chave-super-secreta-teste-2026-minima-32chars!");
        _mockConfig.Setup(c => c["JwtSettings:Issuer"]).Returns("pagai-api");
        _mockConfig.Setup(c => c["JwtSettings:Audience"]).Returns("pagai-app");

        _mockDatabase.Setup(d => d.GetCollection<UserEntity>("usuarios", null))
            .Returns(_mockCollection.Object);

        _controller = new AuthController(_mockDatabase.Object, _mockConfig.Object);
    }

    [Fact]
    public async Task Registrar_DeveRetornar201_QuandoEmailNaoExiste()
    {
        var novoUsuario = new UserEntity
        {
            Nome = "Renata Teste",
            Email = "renata@teste.com",
            Senha = "senha123"
        };

        var mockCursor = CriarCursorVazio();
        _mockCollection.Setup(c => c.FindAsync(
            It.IsAny<FilterDefinition<UserEntity>>(),
            It.IsAny<FindOptions<UserEntity, UserEntity>>(),
            default))
            .ReturnsAsync(mockCursor.Object);

        _mockCollection.Setup(c => c.InsertOneAsync(
            It.IsAny<UserEntity>(), null, default))
            .Returns(Task.CompletedTask);

        var resultado = await _controller.Registrar(novoUsuario);

        resultado.Should().BeOfType<CreatedResult>();
    }

    [Fact]
    public async Task Registrar_DeveRetornar400_QuandoEmailJaExiste()
    {
        var usuarioExistente = new UserEntity
        {
            Email = "renata@teste.com",
            Nome = "Renata",
            Senha = BCrypt.Net.BCrypt.HashPassword("senha123")
        };

        var mockCursor = CriarCursorComUsuario(usuarioExistente);
        _mockCollection.Setup(c => c.FindAsync(
            It.IsAny<FilterDefinition<UserEntity>>(),
            It.IsAny<FindOptions<UserEntity, UserEntity>>(),
            default))
            .ReturnsAsync(mockCursor.Object);

        var resultado = await _controller.Registrar(new UserEntity
        {
            Email = "renata@teste.com",
            Nome = "Outro",
            Senha = "outrasenha"
        });

        resultado.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task Login_DeveRetornarToken_QuandoCredenciaisCorretas()
    {
        var senhaHash = BCrypt.Net.BCrypt.HashPassword("senha123");
        var usuario = new UserEntity
        {
            Id = "507f1f77bcf86cd799439011",
            Nome = "Renata",
            Email = "renata@teste.com",
            Senha = senhaHash
        };

        var mockCursor = CriarCursorComUsuario(usuario);
        _mockCollection.Setup(c => c.FindAsync(
            It.IsAny<FilterDefinition<UserEntity>>(),
            It.IsAny<FindOptions<UserEntity, UserEntity>>(),
            default))
            .ReturnsAsync(mockCursor.Object);

        var resultado = await _controller.Login(new LoginRequest
        {
            Email = "renata@teste.com",
            Senha = "senha123"
        });

        resultado.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task Login_DeveRetornar401_QuandoSenhaErrada()
    {
        var usuario = new UserEntity
        {
            Email = "renata@teste.com",
            Senha = BCrypt.Net.BCrypt.HashPassword("senha123")
        };

        var mockCursor = CriarCursorComUsuario(usuario);
        _mockCollection.Setup(c => c.FindAsync(
            It.IsAny<FilterDefinition<UserEntity>>(),
            It.IsAny<FindOptions<UserEntity, UserEntity>>(),
            default))
            .ReturnsAsync(mockCursor.Object);

        var resultado = await _controller.Login(new LoginRequest
        {
            Email = "renata@teste.com",
            Senha = "senhaerrada"
        });

        resultado.Should().BeOfType<UnauthorizedObjectResult>();
    }

    [Fact]
    public async Task Login_DeveRetornar401_QuandoUsuarioNaoExiste()
    {
        var mockCursor = CriarCursorVazio();
        _mockCollection.Setup(c => c.FindAsync(
            It.IsAny<FilterDefinition<UserEntity>>(),
            It.IsAny<FindOptions<UserEntity, UserEntity>>(),
            default))
            .ReturnsAsync(mockCursor.Object);

        var resultado = await _controller.Login(new LoginRequest
        {
            Email = "naoexiste@teste.com",
            Senha = "qualquer"
        });

        resultado.Should().BeOfType<UnauthorizedObjectResult>();
    }

    private Mock<IAsyncCursor<UserEntity>> CriarCursorVazio()
    {
        var cursor = new Mock<IAsyncCursor<UserEntity>>();
        cursor.SetupSequence(c => c.MoveNextAsync(default))
            .ReturnsAsync(false);
        cursor.Setup(c => c.Current)
            .Returns(new List<UserEntity>());
        return cursor;
    }

    private Mock<IAsyncCursor<UserEntity>> CriarCursorComUsuario(UserEntity usuario)
    {
        var cursor = new Mock<IAsyncCursor<UserEntity>>();
        cursor.SetupSequence(c => c.MoveNextAsync(default))
            .ReturnsAsync(true)
            .ReturnsAsync(false);
        cursor.Setup(c => c.Current)
            .Returns(new List<UserEntity> { usuario });
        return cursor;
    }
}

