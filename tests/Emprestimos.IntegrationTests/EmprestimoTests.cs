using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using FluentAssertions;
using Xunit;

namespace Emprestimos.API.Tests;

public class EmprestimoTests : IClassFixture<IntegrationTestFixture>
{
    private readonly HttpClient _client;

    public EmprestimoTests(IntegrationTestFixture factory)
    {
        _client = factory.CreateClient();
        
        var token = GerarTokenTeste();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
    }

    [Fact]
    public async Task Get_Carteira_DeveRetornarSucesso()
    {
        // Rota corrigida: /api/Emprestimos/carteira/{nomeCobrador}
        var response = await _client.GetAsync("/api/Emprestimos/carteira/Luan");
        
        if (!response.IsSuccessStatusCode)
        {
            var content = await response.Content.ReadAsStringAsync();
            throw new Xunit.Sdk.XunitException($"Falhou com status {response.StatusCode}. Conteúdo: {content}");
        }
        
        response.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);
    }

    private string GerarTokenTeste()
    {
        var key = Encoding.ASCII.GetBytes("pagai-chave-super-secreta-2026-minima-32chars!");
        var tokenHandler = new JwtSecurityTokenHandler();
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[] { 
                new Claim(ClaimTypes.Name, "UsuarioTeste"),
                new Claim(ClaimTypes.Role, "Admin") 
            }),
            Expires = DateTime.UtcNow.AddHours(1),
            Issuer = "pagai-api",
            Audience = "pagai-app",
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }
    [Fact]
public async Task Fluxo_CriarEmprestimoEVerificarRelatorio_DeveCalcularLucroCorretamente()
{
    // 1. Arrange: Dados do novo empréstimo
    var novoEmprestimo = new {
        Cliente = "Luan Silva",
        ClienteId = 123,
        Cobrador = "Luan",
        Valor = 1000m,       // Emprestou 1000
        TaxaJuros = 0.30m    // Juros de 30%
    };

    // 2. Act: Criar o empréstimo via POST
    var postResponse = await _client.PostAsJsonAsync("/api/Emprestimos", novoEmprestimo);
    postResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.Created);

    // 3. Act: Buscar o relatório de lucro do cobrador
    var reportResponse = await _client.GetAsync("/api/Emprestimos/relatorio-lucro/Luan");
    reportResponse.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);

    // 4. Assert: Verificar se o lucro projetado é de 300 (1300 - 1000)
    var resultado = await reportResponse.Content.ReadFromJsonAsync<dynamic>();
    decimal lucro = resultado!.resumoGeral.lucroTotalProjetado;
    
    lucro.Should().Be(300m);
}

}
