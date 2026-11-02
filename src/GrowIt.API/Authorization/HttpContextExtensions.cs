using System.Security.Claims;

namespace GrowIt.API.Authorization;

public static class HttpContextExtensions
{
    public static Guid GetUserId(this HttpContext context)
    {
        // JwtBearer's default inbound claim mapping renames Cognito's `sub` to NameIdentifier;
        // the integration-test auth handler issues a raw `sub`.
        var sub = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? context.User.FindFirst("sub")?.Value;

        if (sub is null || !Guid.TryParse(sub, out var userId))
        {
            throw new UnauthorizedAccessException("User ID (sub) claim missing or invalid in JWT");
        }

        return userId;
    }
}
