namespace backend.Gateway.Services;

/// <summary>
/// Interface for rate limiting service
/// </summary>
public interface IRateLimitService
{
    /// <summary>
    /// Checks if a client has exceeded the rate limit
    /// </summary>
    Task<bool> IsRateLimitExceededAsync(string clientId, int requestsPerMinute);

    /// <summary>
    /// Records a request for rate limiting tracking
    /// </summary>
    Task RecordRequestAsync(string clientId);

    /// <summary>
    /// Gets the current request count for a client
    /// </summary>
    Task<int> GetRequestCountAsync(string clientId);
}
