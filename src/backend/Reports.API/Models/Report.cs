using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace Reports.API.Models;
public class Report
{
    public int Id { get; set; }

    public DateTime DataInicio { get; set; }

    public DateTime DataFim { get; set; }

    public string Tipo { get; set; } = string.Empty;
    public string Formato { get; set; } = string.Empty;

    public DateTime GeradoEm { get; set; }

    public string Cobrador { get; set; } = string.Empty;
}