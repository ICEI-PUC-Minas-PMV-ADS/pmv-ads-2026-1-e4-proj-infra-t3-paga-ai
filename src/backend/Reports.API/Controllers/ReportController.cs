using Microsoft.AspNetCore.Mvc;
using Reports.API.Models;
using Reports.API.Services;

namespace Reports.API.Controllers;

[ApiController]
<<<<<<< HEAD
[Route("api/[controller]")]
=======
[Route("api/report")]
>>>>>>> 70f559d076e9b20e675a271cfb76afd57b2413f0
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