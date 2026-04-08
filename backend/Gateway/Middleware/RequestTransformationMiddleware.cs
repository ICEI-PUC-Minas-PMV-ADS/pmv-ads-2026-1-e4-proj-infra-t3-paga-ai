namespace backend.Gateway.Middleware;

/// <summary>
/// Middleware for transforming requests (e.g., adding custom headers, request validation)
/// </summary>
public class RequestTransformationMiddleware
{
    private readonly RequestDelegate _next;

    public RequestTransformationMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Add correlation ID if not present
        if (!context.Request.Headers.ContainsKey("X-Correlation-ID"))
        {
            context.Request.Headers["X-Correlation-ID"] = context.TraceIdentifier;
        }

        // Add request timestamp
        context.Items["RequestStartTime"] = DateTime.UtcNow;

        await _next(context);
    }
}
