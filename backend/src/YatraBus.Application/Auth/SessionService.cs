using Microsoft.EntityFrameworkCore;
using YatraBus.Application.Abstractions;
using YatraBus.Domain.Common;
using YatraBus.Domain.Entities;

namespace YatraBus.Application.Auth;

/// <summary>Server-side login sessions keyed by an opaque token (the API stores it in an HttpOnly cookie).</summary>
public class SessionService(IAppDbContext db, IClock clock, YatraOptions opts)
{
    public int Days => opts.SessionDays;

    public async Task<User?> Resolve(string? token)
    {
        if (string.IsNullOrEmpty(token)) return null;
        var s = await db.Sessions.FirstOrDefaultAsync(x => x.Token == token);
        if (s == null) return null;
        if (s.Expires < clock.NowMs) { db.Sessions.Remove(s); await db.SaveChangesAsync(); return null; }
        return await db.Users.FirstOrDefaultAsync(u => u.Id == s.UserId);
    }

    public async Task<string> Start(User u)
    {
        var token = Js.Hex(32);
        var now = clock.NowMs;
        db.Sessions.RemoveRange(await db.Sessions.Where(x => x.Expires < now).ToListAsync());
        db.Sessions.Add(new Session { Token = token, UserId = u.Id, Expires = now + Days * 86_400_000L });
        await db.SaveChangesAsync();
        return token;
    }

    public async Task End(string? token)
    {
        if (string.IsNullOrEmpty(token)) return;
        db.Sessions.RemoveRange(await db.Sessions.Where(x => x.Token == token).ToListAsync());
        await db.SaveChangesAsync();
    }

    /// <summary>Sign the user out everywhere except the current device (after a password change).</summary>
    public async Task RevokeOthers(string userId, string? keepToken)
    {
        db.Sessions.RemoveRange(await db.Sessions.Where(x => x.UserId == userId && x.Token != keepToken).ToListAsync());
        await db.SaveChangesAsync();
    }
}
