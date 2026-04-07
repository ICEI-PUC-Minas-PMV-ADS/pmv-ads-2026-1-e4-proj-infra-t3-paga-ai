using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace backend.Models;


public class Notificacao
{
    // No Swagger/POST deve-se apagar a linha Id no Request Body, para que o MongoDb crie sua própria id
    [BsonId]
    public int Id { get; set; }
    public int ClienteId {get; set; }
    public string Cobrador {get; set; } = null!;

    public string? Mensagem { get; set; }

    public bool Lida { get; set; } = false;

    public DateTime DataCriacao { get; set; } = DateTime.UtcNow;

    public int? EmprestimoId { get; set; }
}

