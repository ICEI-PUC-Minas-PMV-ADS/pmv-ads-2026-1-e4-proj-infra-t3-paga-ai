using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace backend.Models;
public class Report
{
    public string Id { get; set; }

    public DateTime DataInicio { get; set; }

    public DateTime DataFim { get; set; }

    public string Tipo { get; set; }

    public string Formato { get; set; }

    public DateTime GeradoEm { get; set; }

    public string UsuarioId { get; set; }
}