using MongoDB.Bson.Serialization.Attributes;

namespace backend.Models
{
    public class Cliente
    {
        [BsonId]
        public int Id { get; set; }

        public string? Nome { get; set; }
        public string? CPF { get; set; }
        public string? Telefone { get; set; }
        public string? Endereco { get; set; }
        public string? Email { get; set; }
        public string? Descricao { get; set; }
    }
}