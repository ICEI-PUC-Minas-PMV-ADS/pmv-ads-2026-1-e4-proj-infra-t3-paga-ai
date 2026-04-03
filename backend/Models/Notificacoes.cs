using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace backend.Models;


public class Notificacao
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    public string? Mensagem { get; set; }

    public bool Lida { get; set; } = false;

    public DateTime DataCriacao { get; set; } = DateTime.UtcNow;

    public int? EmprestimoId { get; set; }
}

