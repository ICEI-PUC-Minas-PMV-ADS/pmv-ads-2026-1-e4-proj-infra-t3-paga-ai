namespace backend.Gateway.Services;

/// <summary>
/// Service for implementing rate limiting logic
/// </summary>
public class RateLimitService : IRateLimitService
{
    private readonly Dictionary<string, RequestTracker> _clientTrackers = new();
    private readonly object _lockObject = new();

    public Task<bool> IsRateLimitExceededAsync(string clientId, int requestsPerMinute)
    {
        lock (_lockObject)
        {
            if (!_clientTrackers.TryGetValue(clientId, out var tracker))
            {
                tracker = new RequestTracker();
                _clientTrackers[clientId] = tracker;
            }

            // Clean old requests outside the current minute
            tracker.CleanOldRequests();

            // Check if limit exceeded
            return Task.FromResult(tracker.RequestCount >= requestsPerMinute);
        }
    }

    public Task RecordRequestAsync(string clientId)
    {
        lock (_lockObject)
        {
            if (!_clientTrackers.TryGetValue(clientId, out var tracker))
            {
                tracker = new RequestTracker();
                _clientTrackers[clientId] = tracker;
            }

            tracker.AddRequest();
        }

        return Task.CompletedTask;
    }

    public Task<int> GetRequestCountAsync(string clientId)
    {
        lock (_lockObject)
        {
            if (!_clientTrackers.TryGetValue(clientId, out var tracker))
            {
                return Task.FromResult(0);
            }

            tracker.CleanOldRequests();
            return Task.FromResult(tracker.RequestCount);
        }
    }

    private class RequestTracker
    {
        private readonly List<DateTime> _requests = new();

        public int RequestCount => _requests.Count;

        public void AddRequest()
        {
            _requests.Add(DateTime.UtcNow);
        }

        public void CleanOldRequests()
        {
            var oneMinuteAgo = DateTime.UtcNow.AddMinutes(-1);
            _requests.RemoveAll(r => r < oneMinuteAgo);
        }
    }
}
