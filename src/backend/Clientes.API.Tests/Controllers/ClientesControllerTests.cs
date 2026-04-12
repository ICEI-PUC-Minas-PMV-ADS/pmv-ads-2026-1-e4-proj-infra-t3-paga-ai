using Clientes.API.Controllers;
using Clientes.API.Models;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using Moq;
using Xunit;

namespace Clientes.API.Tests.Controllers;

public class ClientesControllerTests
{
    private readonly Mock<IMongoDatabase> _mockDatabase;
    private readonly Mock<IMongoCollection<Cliente>> _mockCollection;
    private readonly ClientesController _controller;

    public ClientesControllerTests()
    {
        _mockDatabase = new Mock<IMongoDatabase>();
        _mockCollection = new Mock<IMongoCollection<Cliente>>();

        _mockDatabase
            .Setup(d => d.GetCollection<Cliente>("clientes", null))
            .Returns(_mockCollection.Object);

        _controller = new ClientesController(_mockDatabase.Object);
    }

    // ---------- helpers ----------

    private void SetupFindFluent(IEnumerable<Cliente> results)
    {
        var cursor = CreateMockCursor(results);

        // Find() é extension method no Driver v3; a cadeia Find().ToListAsync()
        // acaba chamando FindAsync(), que é um método de interface — esse sim mockável.
        _mockCollection
            .Setup(c => c.FindAsync(
                It.IsAny<FilterDefinition<Cliente>>(),
                It.IsAny<FindOptions<Cliente, Cliente>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(cursor.Object);
    }

    private static Mock<IAsyncCursor<Cliente>> CreateMockCursor(IEnumerable<Cliente> items)
    {
        var list = new List<Cliente>(items ?? []);
        var cursor = new Mock<IAsyncCursor<Cliente>>();
        cursor.Setup(c => c.Current).Returns(list);
        cursor
            .SetupSequence(c => c.MoveNextAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(list.Count > 0)
            .ReturnsAsync(false);
        return cursor;
    }

    // ---------- GET (todos) ----------

    [Fact]
    public async Task Get_DeveRetornarOkComListaDeClientes()
    {
        var clientes = new List<Cliente>
        {
            new() { Id = 1, Nome = "Ana",   Email = "ana@email.com" },
            new() { Id = 2, Nome = "Bruno", Email = "bruno@email.com" }
        };
        SetupFindFluent(clientes);

        var result = await _controller.Get();

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var lista = Assert.IsAssignableFrom<IEnumerable<Cliente>>(ok.Value);
        Assert.Equal(2, lista.Count());
    }

    [Fact]
    public async Task Get_DeveRetornarListaVaziaQuandoNaoHaClientes()
    {
        SetupFindFluent([]);

        var result = await _controller.Get();

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var lista = Assert.IsAssignableFrom<IEnumerable<Cliente>>(ok.Value);
        Assert.Empty(lista);
    }

    // ---------- GET (por id) ----------

    [Fact]
    public async Task GetById_DeveRetornarOkQuandoClienteExiste()
    {
        var cliente = new Cliente { Id = 1, Nome = "Ana" };
        SetupFindFluent([cliente]);

        var result = await _controller.Get(1);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var retornado = Assert.IsType<Cliente>(ok.Value);
        Assert.Equal(1, retornado.Id);
        Assert.Equal("Ana", retornado.Nome);
    }

    [Fact]
    public async Task GetById_DeveRetornarNotFoundQuandoClienteNaoExiste()
    {
        SetupFindFluent([]);

        var result = await _controller.Get(99);

        Assert.IsType<NotFoundObjectResult>(result.Result);
    }

    // ---------- POST ----------

    [Fact]
    public async Task Post_DeveCriarClienteComIdAutoIncrementado()
    {
        var ultimo = new Cliente { Id = 5, Nome = "Ultimo" };
        SetupFindFluent([ultimo]);

        _mockCollection
            .Setup(c => c.InsertOneAsync(
                It.IsAny<Cliente>(),
                It.IsAny<InsertOneOptions>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var novo = new Cliente { Nome = "Carlos", Email = "carlos@email.com" };
        var result = await _controller.Post(novo);

        var created = Assert.IsType<CreatedAtActionResult>(result);
        var criado = Assert.IsType<Cliente>(created.Value);
        Assert.Equal(6, criado.Id);
    }

    [Fact]
    public async Task Post_DeveCriarClienteComId1QuandoNaoExistemClientes()
    {
        SetupFindFluent([]);

        _mockCollection
            .Setup(c => c.InsertOneAsync(
                It.IsAny<Cliente>(),
                It.IsAny<InsertOneOptions>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var novo = new Cliente { Nome = "Primeiro" };
        var result = await _controller.Post(novo);

        var created = Assert.IsType<CreatedAtActionResult>(result);
        var criado = Assert.IsType<Cliente>(created.Value);
        Assert.Equal(1, criado.Id);
    }

    [Fact]
    public async Task Post_DeveRetornarCreatedAtActionComRotaCorreta()
    {
        SetupFindFluent([]);

        _mockCollection
            .Setup(c => c.InsertOneAsync(
                It.IsAny<Cliente>(),
                It.IsAny<InsertOneOptions>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var novo = new Cliente { Nome = "Teste" };
        var result = await _controller.Post(novo);

        var created = Assert.IsType<CreatedAtActionResult>(result);
        Assert.Equal(nameof(ClientesController.Get), created.ActionName);
    }

    // ---------- PUT ----------

    [Fact]
    public async Task Update_DeveRetornarNoContentQuandoClienteExiste()
    {
        var replaceResult = new ReplaceOneResult.Acknowledged(matchedCount: 1, modifiedCount: 1, upsertedId: null);

        _mockCollection
            .Setup(c => c.ReplaceOneAsync(
                It.IsAny<FilterDefinition<Cliente>>(),
                It.IsAny<Cliente>(),
                It.IsAny<ReplaceOptions>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(replaceResult);

        var atualizado = new Cliente { Nome = "Ana Atualizada" };
        var result = await _controller.Update(1, atualizado);

        Assert.IsType<NoContentResult>(result);
    }

    [Fact]
    public async Task Update_DeveDefinirIdDoClienteAtualizadoCorretamente()
    {
        var replaceResult = new ReplaceOneResult.Acknowledged(matchedCount: 1, modifiedCount: 1, upsertedId: null);

        Cliente? capturado = null;
        _mockCollection
            .Setup(c => c.ReplaceOneAsync(
                It.IsAny<FilterDefinition<Cliente>>(),
                It.IsAny<Cliente>(),
                It.IsAny<ReplaceOptions>(),
                It.IsAny<CancellationToken>()))
            .Callback<FilterDefinition<Cliente>, Cliente, ReplaceOptions, CancellationToken>(
                (_, c, _, _) => capturado = c)
            .ReturnsAsync(replaceResult);

        await _controller.Update(42, new Cliente { Nome = "X" });

        Assert.NotNull(capturado);
        Assert.Equal(42, capturado.Id);
    }

    [Fact]
    public async Task Update_DeveRetornarNotFoundQuandoClienteNaoExiste()
    {
        var replaceResult = new ReplaceOneResult.Acknowledged(matchedCount: 0, modifiedCount: 0, upsertedId: null);

        _mockCollection
            .Setup(c => c.ReplaceOneAsync(
                It.IsAny<FilterDefinition<Cliente>>(),
                It.IsAny<Cliente>(),
                It.IsAny<ReplaceOptions>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(replaceResult);

        var result = await _controller.Update(99, new Cliente { Nome = "X" });

        Assert.IsType<NotFoundObjectResult>(result);
    }

    // ---------- DELETE ----------

    [Fact]
    public async Task Delete_DeveRetornarNoContentQuandoClienteExiste()
    {
        var deleteResult = new DeleteResult.Acknowledged(deletedCount: 1);

        _mockCollection
            .Setup(c => c.DeleteOneAsync(
                It.IsAny<FilterDefinition<Cliente>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(deleteResult);

        var result = await _controller.Delete(1);

        Assert.IsType<NoContentResult>(result);
    }

    [Fact]
    public async Task Delete_DeveRetornarNotFoundQuandoClienteNaoExiste()
    {
        var deleteResult = new DeleteResult.Acknowledged(deletedCount: 0);

        _mockCollection
            .Setup(c => c.DeleteOneAsync(
                It.IsAny<FilterDefinition<Cliente>>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(deleteResult);

        var result = await _controller.Delete(99);

        Assert.IsType<NotFoundObjectResult>(result);
    }
}
