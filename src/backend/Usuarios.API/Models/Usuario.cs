using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace Usuario.API.Models
{
    public class Usuario
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Senha { get; set; } = string.Empty; // hash bcrypt
        public string? DataNascimento { get; set; }
        public string? Cpf { get; set; }
        public string? Telefone { get; set; }
        public string? PushToken { get; set; }
    }
}