using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using backend.Models;
using backend.Services;

namespace Reports.API.Controllers;

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
    public IActionResult GetReport(DateTime dataInicio, DateTime dataFim, string? cobrador = null)
    {
        var report = _reportService.GerarRelatorio(dataInicio, dataFim, cobrador);
        return Ok(report);
    }

    [HttpPost("export-pdf")]
    public IActionResult ExportPdf([FromBody] Report report)
    {
        var pdf = _reportService.GerarPdf(report.DataInicio, report.DataFim, report.Cobrador);
        return File(pdf, "application/pdf", "relatorio.pdf");
    }
}