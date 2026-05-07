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

    public decimal TotalEmprestado { get; set; }
    public decimal TotalRecebido { get; set; }
    public decimal TotalPendente { get; set; }
    public decimal LucroTotal { get; set; }

    public List<RelatorioDevedor> EmprestimosPorDevedor { get; set; } = new();
    public List<PagamentoRecente> PagamentosRecentes { get; set; } = new();
}

public class RelatorioDevedor
{
    public string Devedor { get; set; } = string.Empty;
    public int Quantidade { get; set; }
    public decimal TotalEmprestado { get; set; }
    public decimal Recebido { get; set; }
    public decimal Pendente { get; set; }
    public decimal TaxaMedia { get; set; }
}

public class PagamentoRecente
{
    public DateTime Data { get; set; }
    public string Devedor { get; set; } = string.Empty;
    public decimal Valor { get; set; }
    public string Metodo { get; set; } = "PIX";
    public string Referencia { get; set; } = string.Empty;
    public string Status { get; set; } = "Recebido";
}