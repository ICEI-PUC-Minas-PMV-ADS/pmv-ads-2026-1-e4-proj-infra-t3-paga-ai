using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace backend.Models;

public class Emprestimo
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }
    public string Cliente { get; set; } = null!;
    public decimal Valor { get; set; }
    public bool Pago { get; set; } = false;
}