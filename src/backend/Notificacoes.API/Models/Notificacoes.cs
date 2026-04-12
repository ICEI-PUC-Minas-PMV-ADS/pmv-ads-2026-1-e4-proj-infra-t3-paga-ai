using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace Notificacoes.API.Models;


public class Notificacao
{

    [BsonId]
    public int Id { get; set; }
    public int ClienteId {get; set; }
    public string ClienteNome {get; set; } = null!;
    public string Cobrador {get; set; } = null!;

    public string? Mensagem { get; set; }

    public bool Lida { get; set; } = false;
    public DateTime Data { get; set;} = DateTime.UtcNow;

    public DateTime DataCriacao { get; set; } = DateTime.UtcNow;

    public int? EmprestimoId { get; set; }
    public string Tipo {get; set; } = "Cobranca";
    public decimal Valor { get; set; }
    public DateTime DataVencimento {get; set;}
}

