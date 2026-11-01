using Microsoft.EntityFrameworkCore;
using YatraBus.Application.Abstractions;
using YatraBus.Application.Common;

namespace YatraBus.Application.Admin;

public class AdminLoginRequest { public string? Password { get; set; } }

/// <summary>Operator console login, catalogue snapshot and demo reset.</summary>
public class AdminService(IAppDbContext db, IAdminTokenStore tokens, ISeatHoldStore holds, IDataSeeder seeder, YatraOptions opts)
{
    public AppResult Login(AdminLoginRequest d) =>
        d.Password != opts.AdminPassword ? AppResult.Fail(401, "Incorrect password") : AppResult.Ok(new { token = tokens.Issue() });

    public bool IsAuthorized(string? token) => tokens.Valid(token);

    public async Task<AppResult> Data() => AppResult.Ok(new
    {
        operators = await db.Operators.AsNoTracking().OrderBy(x => x.Id).ToListAsync(),
        buses = await db.Buses.AsNoTracking().OrderBy(x => x.Id).ToListAsync(),
        routes = await db.Routes.AsNoTracking().OrderBy(x => x.Id).ToListAsync(),
        schedules = await db.Schedules.AsNoTracking().OrderBy(x => x.Id).ToListAsync(),
        coupons = await db.Coupons.AsNoTracking().OrderBy(x => x.Id).ToListAsync(),
    });

    /// <summary>Restore the seed catalogue and delete bookings (user accounts are kept).</summary>
    public AppResult Reset() { seeder.Reseed(keepUsers: true); holds.Clear(); return AppResult.Ok(new { ok = true }); }
}
