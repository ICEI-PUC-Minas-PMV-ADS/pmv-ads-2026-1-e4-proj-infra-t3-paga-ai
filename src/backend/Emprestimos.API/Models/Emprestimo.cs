using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace Emprestimos.API.Models
{
    [BsonIgnoreExtraElements]
    public class Parcela
    {
        public int Numero { get; set; }

        [BsonRepresentation(BsonType.Decimal128)]
        public decimal Valor { get; set; }

        public DateTime DataVencimento { get; set; }

        public bool Pago { get; set; } = false;

        public DateTime? DataPagamento { get; set; }

        public bool NotificadoAtraso { get; set; } = false;
    }

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

        public List<Parcela> Parcelas { get; set; } = new();

        public DateTime DataEmprestimo { get; set; } = DateTime.UtcNow;

        public DateTime DataVencimento { get; set; }

        public bool Pago { get; set; } = false;

        public DateTime? DataPagamento { get; set; }

        public StatusPagamento Status { get; set; } = StatusPagamento.Pendente;

        public bool NotificadoAtraso { get; set; } = false;
    }

    public enum StatusPagamento
    {
        Pendente = 0,
        Atrasado = 1,
        Pago = 2
    }
}