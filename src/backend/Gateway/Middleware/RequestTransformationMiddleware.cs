using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace backend.Gateway.Middleware;

public class RequestTransformationMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestTransformationMiddleware> _logger;

    public RequestTransformationMiddleware(RequestDelegate next, ILogger<RequestTransformationMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (!context.Request.Headers.ContainsKey("X-Request-Source"))
        {
            context.Request.Headers["X-Request-Source"] = "Gateway";
        }

        _logger.LogDebug("Request transformation applied for {Path}.", context.Request.Path);
        await _next(context);
    }
}
