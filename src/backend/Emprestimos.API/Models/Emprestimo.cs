using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace Emprestimos.API.Models
{
    public class Emprestimo
    {
        [BsonId] 
        public int Id { get; set; }

        public int ClienteId { get; set; }

        public string Cliente { get; set; } = null!;

        public string Cobrador { get; set; } = null!;

        [BsonRepresentation(BsonType.Decimal128)] 
        public decimal Valor { get; set; }

        [BsonRepresentation(BsonType.Decimal128)]
        public decimal TaxaJuros { get; set; }

        [BsonRepresentation(BsonType.Decimal128)]
        public decimal ValorFinal { get; set; }

        [BsonRepresentation(BsonType.Decimal128)]
        public decimal ValorParcela { get; set; }

        public int NumeroParcelas { get; set; } = 1;

        public DateTime DataEmprestimo { get; set; } = DateTime.UtcNow;

        public DateTime DataVencimento { get; set; }

        public bool Pago { get; set; } = false;

        public DateTime? DataPagamento { get; set; }

        public StatusPagamento Status { get; set; } = StatusPagamento.Pendente;
    }

    public enum StatusPagamento
    {
        Pendente = 0,
        Pago = 2
    }
}