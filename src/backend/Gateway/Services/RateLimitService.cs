using backend.Gateway.Configuration;

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
        var now = DateTime.UtcNow;

        if (!_requests.ContainsKey(key))
        {
            _requests[key] = (1, now);
            return true;
        }

        var (count, windowStart) = _requests[key];
        if ((now - windowStart).TotalMinutes >= 1)
        {
            _requests[key] = (1, now);
            return true;
        }

        if (count < _settings.RequestsPerMinute)
        {
            _requests[key] = (count + 1, windowStart);
            return true;
        }

        return false;
    }
}
