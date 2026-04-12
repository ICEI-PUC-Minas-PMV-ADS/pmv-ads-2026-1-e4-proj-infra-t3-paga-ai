using Clientes.API.Models;
using MongoDB.Bson.Serialization.Attributes;
using System.ComponentModel.DataAnnotations;
using Xunit;

namespace Clientes.API.Tests.Models;

public class ClienteTests
{
    [Fact]
    public void Cliente_DeveCriarComTodasAsPropriedades()
    {
        var cliente = new Cliente
        {
            Id = 1,
            Nome = "Ana Silva",
            CPF = "123.456.789-00",
            Telefone = "(11) 99999-0000",
            Endereco = "Rua das Flores, 100",
            Email = "ana@email.com",
            Descricao = "Cliente VIP"
        };

        Assert.Equal(1, cliente.Id);
        Assert.Equal("Ana Silva", cliente.Nome);
        Assert.Equal("123.456.789-00", cliente.CPF);
        Assert.Equal("(11) 99999-0000", cliente.Telefone);
        Assert.Equal("Rua das Flores, 100", cliente.Endereco);
        Assert.Equal("ana@email.com", cliente.Email);
        Assert.Equal("Cliente VIP", cliente.Descricao);
    }

    [Fact]
    public void Cliente_PropriedadesOpcionaisDevemSerNulasNaCriacao()
    {
        var cliente = new Cliente();

        Assert.Null(cliente.Nome);
        Assert.Null(cliente.CPF);
        Assert.Null(cliente.Telefone);
        Assert.Null(cliente.Endereco);
        Assert.Null(cliente.Email);
        Assert.Null(cliente.Descricao);
    }

    [Fact]
    public void Cliente_IdDeveSerZeroPorPadrao()
    {
        var cliente = new Cliente();

        Assert.Equal(0, cliente.Id);
    }

    [Fact]
    public void Cliente_DevePossuirAtributoBsonIdNoId()
    {
        var property = typeof(Cliente).GetProperty(nameof(Cliente.Id));

        Assert.NotNull(property);
        Assert.True(
            property.IsDefined(typeof(BsonIdAttribute), inherit: false),
            "A propriedade Id deve ter o atributo [BsonId]."
        );
    }

    [Fact]
    public void Cliente_DevePossuirAtributoRequiredNoNome()
    {
        var property = typeof(Cliente).GetProperty(nameof(Cliente.Nome));

        Assert.NotNull(property);
        Assert.True(
            property.IsDefined(typeof(RequiredAttribute), inherit: false),
            "A propriedade Nome deve ter o atributo [Required]."
        );
    }

    [Fact]
    public void Cliente_DevePermitirAlteracaoDasPropriedades()
    {
        var cliente = new Cliente { Nome = "Original" };

        cliente.Nome = "Atualizado";
        cliente.Email = "novo@email.com";

        Assert.Equal("Atualizado", cliente.Nome);
        Assert.Equal("novo@email.com", cliente.Email);
    }
}
