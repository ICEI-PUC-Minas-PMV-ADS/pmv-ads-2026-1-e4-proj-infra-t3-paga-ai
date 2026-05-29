using System.ComponentModel.DataAnnotations;
using MongoDB.Bson.Serialization.Attributes;

namespace Clientes.API.Models
{
    [BsonIgnoreExtraElements]
    public class Cliente
    {
        [BsonId]
        public int Id { get; set; }
        [Required]
        public string? Nome { get; set; }
        public string? CPF { get; set; }
        public string? Telefone { get; set; }
        public string? Endereco { get; set; }
        public string? Email { get; set; }
        public string? Descricao { get; set; }
        public string? Cobrador { get; set; }
    }
}