using System.Text.Json;

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
        _logger.LogInformation("Transforming request: {Method} {Path}", context.Request.Method, context.Request.Path);

        if (context.Request.Headers.TryGetValue("X-Custom-Header", out var headerValue))
        {
            _logger.LogInformation("Custom header received: {HeaderValue}", headerValue.ToString());
        }

        await _next(context);
    }
}
