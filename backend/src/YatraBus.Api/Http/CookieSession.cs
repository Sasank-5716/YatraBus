using YatraBus.Application.Auth;
using YatraBus.Domain.Entities;

namespace YatraBus.Api.Http;

/// <summary>HttpOnly cookie "yb_sid" (SameSite=Lax, 30 days) over the application's SessionService.</summary>
public class CookieSession(SessionService sessions)
{
    public const string Cookie = "yb_sid";
    public static string? Token(HttpContext ctx) => ctx.Request.Cookies[Cookie];

    public Task<User?> CurrentUser(HttpContext ctx) => sessions.Resolve(Token(ctx));

    public async Task SignIn(HttpContext ctx, User u) =>
        ctx.Response.Cookies.Append(Cookie, await sessions.Start(u), Options(TimeSpan.FromDays(sessions.Days)));

    public async Task SignOut(HttpContext ctx)
    {
        await sessions.End(Token(ctx));
        ctx.Response.Cookies.Append(Cookie, "", Options(TimeSpan.Zero));
    }

    public Task RevokeOthers(HttpContext ctx, string userId) => sessions.RevokeOthers(userId, Token(ctx));

    private static CookieOptions Options(TimeSpan maxAge) => new() { HttpOnly = true, SameSite = SameSiteMode.Lax, Path = "/", MaxAge = maxAge, IsEssential = true };
}

/// <summary>Endpoint filter guarding /api/admin/* (token in x-token header, or ?token= for CSV downloads).</summary>
public class AdminOnly(YatraBus.Application.Abstractions.IAdminTokenStore tokens) : IEndpointFilter
{
    public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext ctx, EndpointFilterDelegate next)
    {
        var req = ctx.HttpContext.Request;
        var token = req.Headers["x-token"].FirstOrDefault();
        if (string.IsNullOrEmpty(token)) token = req.Query["token"].FirstOrDefault();
        if (!tokens.Valid(token)) return ApiResult.Error(401, "Please log in again");
        return await next(ctx);
    }
}
