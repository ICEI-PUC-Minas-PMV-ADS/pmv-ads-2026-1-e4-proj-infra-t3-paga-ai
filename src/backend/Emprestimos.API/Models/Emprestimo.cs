using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace Empretimos.API.Models;

public class Emprestimo
{
    [BsonId] 
    public int Id { get; set; }
    public int ClienteId {get; set; }
    public string Cliente { get; set; } = null!;
    public string Cobrador { get; set; } = null!;
    [BsonRepresentation(BsonType.Decimal128)] // Garante precisão centavos no MongoDB
    public decimal Valor { get; set; }

    [BsonRepresentation(BsonType.Decimal128)]
    public decimal TaxaJuros { get; set; }

    [BsonRepresentation(BsonType.Decimal128)]
    public decimal ValorFinal { get; set; }

    public DateTime DataEmprestimo { get; set; } = DateTime.UtcNow;

    public DateTime DataVencimento { get; set; }

    public bool Pago { get; set; } = false;

    // Novo: Para sabermos QUANDO o dinheiro entrou
    public DateTime? DataPagamento { get; set; }

    // Novo: Para usar o seu Enum e saber o status exato
    public StatusPagamento Status { get; set; } = StatusPagamento.Pendente;
}

public enum StatusPagamento
{
    Pendente = 0,
    Pago = 2
}