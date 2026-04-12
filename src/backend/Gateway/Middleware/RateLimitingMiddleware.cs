using backend.Gateway.Configuration;
using backend.Gateway.Services;
using Microsoft.Extensions.Options;

namespace backend.Gateway.Middleware;

public class RateLimitingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IRateLimitService _rateLimitService;
    private readonly RateLimitSettings _settings;
    private readonly ILogger<RateLimitingMiddleware> _logger;

    public RateLimitingMiddleware(
        RequestDelegate next,
        IRateLimitService rateLimitService,
        IOptions<RateLimitSettings> settings,
        ILogger<RateLimitingMiddleware> logger)
    {
        _next = next;
        _rateLimitService = rateLimitService;
        _settings = settings.Value;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (_settings.RequestsPerMinute > 0)
        {
            var clientKey = context.Connection.RemoteIpAddress?.ToString() ?? context.TraceIdentifier;
            if (!_rateLimitService.IsRequestAllowed(clientKey))
            {
                _logger.LogWarning("Rate limit exceeded for client {ClientKey}", clientKey);
                context.Response.StatusCode = StatusCodes.Status429TooManyRequests;
                await context.Response.WriteAsJsonAsync(new
                {
                    success = false,
                    message = "Rate limit exceeded. Try again later.",
                    timestamp = DateTime.UtcNow
                });
                return;
            }
        }

        await _next(context);
    }
}
