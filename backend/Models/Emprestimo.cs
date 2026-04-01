using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace backend.Models;

public class Emprestimo
{
    [BsonId] 
    public int Id { get; set; }
    public string Cliente { get; set; } = null!;
    public string Cobrador { get; set; } = null!;
    public decimal Valor { get; set; }
    public decimal TaxaJuros {get; set; }
    public decimal ValorFinal {get; set; }
    public  DateTime DataEmprestimo {get; set; } = DateTime.Now;
    public  DateTime DataVencimento {get; set; }
    public bool Pago { get; set; } = false;
    public DateTime? DataPagamento { get; set; }
}

public enum StatusPagamento
{
    Pendente = 0,
    ParcialmentePago = 1,
    Pago = 2
}