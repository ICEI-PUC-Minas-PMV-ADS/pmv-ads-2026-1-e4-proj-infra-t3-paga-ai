using System.Diagnostics;

namespace backend.Gateway.Middleware;

/// <summary>
/// Middleware for logging HTTP requests and responses with execution time
/// </summary>
public class LoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<LoggingMiddleware> _logger;

    public LoggingMiddleware(RequestDelegate next, ILogger<LoggingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var stopwatch = Stopwatch.StartNew();
        var request = context.Request;
        
        _logger.LogInformation(
            "Incoming Request: {Method} {Path} - Client: {RemoteIP}",
            request.Method,
            request.Path,
            context.Connection.RemoteIpAddress);

        try
        {
            await _next(context);
            stopwatch.Stop();

            _logger.LogInformation(
                "Request Completed: {Method} {Path} - Status: {StatusCode} - Duration: {ElapsedMilliseconds}ms",
                request.Method,
                request.Path,
                context.Response.StatusCode,
                stopwatch.ElapsedMilliseconds);
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            _logger.LogError(
                ex,
                "Request Failed: {Method} {Path} - Duration: {ElapsedMilliseconds}ms - Error: {Message}",
                request.Method,
                request.Path,
                stopwatch.ElapsedMilliseconds,
                ex.Message);
            throw;
        }
    }
}
