using Microsoft.EntityFrameworkCore;
using YatraBus.Application.Abstractions;
using YatraBus.Application.Bookings;
using YatraBus.Application.Common;
using YatraBus.Domain.Common;
using YatraBus.Domain.Entities;

namespace YatraBus.Application.Auth;

/// <summary>Sign-up, login and account use cases.</summary>
public class AuthService(IAppDbContext db, IPasswordHasher hasher, ProfileValidator validator, IClock clock)
{
    private static readonly AppResult LoginFirst = AppResult.Fail(401, "Please log in to continue");

    public async Task<AuthOutcome> Signup(SignupRequest d)
    {
        var (v, err) = await validator.Validate(d.Name, d.Email, d.Phone);
        if (err != null) return new(AppResult.Fail(400, err.Error, err.Field));
        var pe = Rules.PasswordError(d.Password);
        if (pe != null) return new(AppResult.Fail(400, pe, "password"));
        if (d.Password != d.Confirm) return new(AppResult.Fail(400, "Passwords do not match", "confirm"));
        var u = new User { Id = "U" + Js.Hex(6), Name = v!.Name, Email = v.Email, Phone = v.Phone, PasswordHash = hasher.Hash(d.Password!), CreatedAt = clock.IsoNow };
        db.Users.Add(u);
        await db.SaveChangesAsync();
        return new(AppResult.Ok(new { user = PublicUser.From(u) }, 201), u);
    }

    public async Task<AuthOutcome> Login(LoginRequest d)
    {
        var id = (d.Email ?? "").Trim().ToLowerInvariant();
        var u = await db.Users.FirstOrDefaultAsync(x => x.Email == id || x.Phone == id);
        if (u == null || !hasher.Verify(d.Password ?? "", u.PasswordHash)) return new(AppResult.Fail(401, "Incorrect email/phone or password"));
        return new(AppResult.Ok(new { user = PublicUser.From(u) }), u);
    }

    public async Task<AppResult> UpdateProfile(User? me, ProfileRequest d)
    {
        if (me == null) return LoginFirst;
        var (v, err) = await validator.Validate(d.Name, d.Email, d.Phone, me.Id);
        if (err != null) return AppResult.Fail(400, err.Error, err.Field);
        me.Name = v!.Name; me.Email = v.Email; me.Phone = v.Phone;
        await db.SaveChangesAsync();
        return AppResult.Ok(new { user = PublicUser.From(me) });
    }

    /// <summary>Returns ok=true when the password changed; the caller then revokes the user's other sessions.</summary>
    public async Task<AppResult> ChangePassword(User? me, PasswordRequest d)
    {
        if (me == null) return LoginFirst;
        if (!hasher.Verify(d.Current ?? "", me.PasswordHash)) return AppResult.Fail(400, "Current password is incorrect", "current");
        var pe = Rules.PasswordError(d.Password);
        if (pe != null) return AppResult.Fail(400, pe, "password");
        if (d.Password != d.Confirm) return AppResult.Fail(400, "Passwords do not match", "confirm");
        me.PasswordHash = hasher.Hash(d.Password!);
        await db.SaveChangesAsync();
        return AppResult.Ok(new { ok = true });
    }

    public async Task<AppResult> MyBookings(User? me)
    {
        if (me == null) return LoginFirst;
        var list = await db.Bookings.AsNoTracking()
            .Where(b => b.UserId == me.Id || (b.UserId == null && b.Phone == me.Phone))
            .OrderByDescending(b => b.Seq).ToListAsync();
        var now = clock.UtcNow;
        return AppResult.Ok(list.Select(b => BookingView.From(b, now)).ToList());
    }
}
