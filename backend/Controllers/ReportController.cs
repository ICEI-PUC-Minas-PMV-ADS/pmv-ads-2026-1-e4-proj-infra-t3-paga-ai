using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using backend.Models;


[ApiController]
[Route("api/[controller]")]
public class ReportController : ControllerBase
{
    private readonly ReportService _reportService;

    public ReportController(ReportService reportService)
    {
        _reportService = reportService;
    }

    [HttpGet]
    public IActionResult GetReport(DateTime dataInicio, DateTime dataFim)
    {
        var report = _reportService.GerarRelatorio(dataInicio, dataFim);
        return Ok(report);
    }

    [HttpPost("export-pdf")]
    public IActionResult ExportPdf([FromBody] Report report)
    {
        var pdf = _reportService.GerarPdf(report.DataInicio, report.DataFim);
        return File(pdf, "application/pdf", "relatorio.pdf");
    }
}