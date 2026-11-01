using Microsoft.EntityFrameworkCore;
using YatraBus.Application.Abstractions;
using YatraBus.Application.Common;

namespace YatraBus.Application.Auth;

public record ProfileInput(string Name, string Email, string Phone);
public record ValidationError(string Error, string Field);

public class ProfileValidator(IAppDbContext db)
{
    /// <summary>Same rules and messages as the original validateProfile().</summary>
    public static ValidationError? Shape(string n, string e, string p)
    {
        if (n.Length < 2 || n.Length > 60) return new("Please enter your full name (2–60 characters)", "name");
        if (!Rules.Email().IsMatch(e)) return new("Please enter a valid email address", "email");
        if (!Rules.NepaliMobile().IsMatch(p)) return new(Rules.MobileMessage, "phone");
        return null;
    }

    public async Task<(ProfileInput? Ok, ValidationError? Err)> Validate(string? name, string? email, string? phone, string? selfId = null)
    {
        var n = (name ?? "").Trim();
        var e = (email ?? "").Trim().ToLowerInvariant();
        var p = (phone ?? "").Trim();
        var shape = Shape(n, e, p);
        if (shape != null) return (null, shape);
        if (await db.Users.AnyAsync(u => u.Email == e && u.Id != selfId)) return (null, new("An account with this email already exists", "email"));
        if (await db.Users.AnyAsync(u => u.Phone == p && u.Id != selfId)) return (null, new("An account with this mobile number already exists", "phone"));
        return (new ProfileInput(n, e, p), null);
    }
}
