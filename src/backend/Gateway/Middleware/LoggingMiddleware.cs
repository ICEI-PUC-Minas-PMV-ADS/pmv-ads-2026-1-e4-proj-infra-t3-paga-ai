using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace backend.Gateway.Middleware;

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
        _logger.LogInformation("Request {Method} {Path} started.", context.Request.Method, context.Request.Path);
        var start = DateTime.UtcNow;

        await _next(context);

        var elapsed = DateTime.UtcNow - start;
        _logger.LogInformation("Request {Method} {Path} completed in {ElapsedMilliseconds}ms with status {StatusCode}.",
            context.Request.Method,
            context.Request.Path,
            elapsed.TotalMilliseconds,
            context.Response.StatusCode);
    }
}
