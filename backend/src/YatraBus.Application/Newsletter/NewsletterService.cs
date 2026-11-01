using Microsoft.EntityFrameworkCore;
using YatraBus.Application.Abstractions;
using YatraBus.Application.Common;
using YatraBus.Domain.Entities;

namespace YatraBus.Application.Newsletter;

public class SubscribeRequest { public string? Email { get; set; } }

public class NewsletterService(IAppDbContext db, IClock clock)
{
    public async Task<AppResult> Subscribe(SubscribeRequest d)
    {
        var email = (d.Email ?? "").Trim().ToLowerInvariant();
        if (!Rules.Email().IsMatch(email)) return AppResult.Fail(400, "Please enter a valid email address");
        if (await db.Subscribers.AnyAsync(x => x.Email == email)) return AppResult.Ok(new { ok = true, already = true });
        var id = (await db.Subscribers.MaxAsync(x => (int?)x.Id) ?? 0) + 1;
        db.Subscribers.Add(new Subscriber { Id = id, Email = email, At = clock.IsoNow });
        await db.SaveChangesAsync();
        return AppResult.Ok(new { ok = true }, 201);
    }
}
