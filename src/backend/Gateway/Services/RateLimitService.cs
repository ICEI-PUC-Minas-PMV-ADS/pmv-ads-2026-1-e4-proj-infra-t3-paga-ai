using backend.Gateway.Configuration;
using System.Collections.Generic;

namespace backend.Gateway.Services;

public class RateLimitService : IRateLimitService
{
    private readonly RateLimitSettings _settings;
    private readonly Dictionary<string, (int Count, DateTime WindowStart)> _requests = new();

    public RateLimitService(RateLimitSettings settings)
    {
        _settings = settings;
    }

    public bool IsRequestAllowed(string key)
    {
        if (_settings.RequestsPerMinute <= 0)
        {
            return true;
        }

        var now = DateTime.UtcNow;

        if (!_requests.TryGetValue(key, out var entry) || (now - entry.WindowStart).TotalMinutes >= 1)
        {
            _requests[key] = (1, now);
            return true;
        }

        if (entry.Count < _settings.RequestsPerMinute)
        {
            _requests[key] = (entry.Count + 1, entry.WindowStart);
            return true;
        }

        return false;
    }
}
