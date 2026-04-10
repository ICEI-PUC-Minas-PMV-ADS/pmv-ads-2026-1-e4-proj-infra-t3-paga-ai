namespace backend.Gateway.Services;

public interface IRateLimitService
{
    bool IsRequestAllowed(string key);
}
