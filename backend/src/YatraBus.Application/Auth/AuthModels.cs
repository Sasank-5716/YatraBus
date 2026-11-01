using YatraBus.Domain.Entities;

namespace YatraBus.Application.Auth;

public class SignupRequest { public string? Name { get; set; } public string? Email { get; set; } public string? Phone { get; set; } public string? Password { get; set; } public string? Confirm { get; set; } }
public class LoginRequest { public string? Email { get; set; } public string? Password { get; set; } }
public class ProfileRequest { public string? Name { get; set; } public string? Email { get; set; } public string? Phone { get; set; } }
public class PasswordRequest { public string? Current { get; set; } public string? Password { get; set; } public string? Confirm { get; set; } }

public record PublicUser(string Id, string Name, string Email, string Phone, string CreatedAt)
{
    public static PublicUser? From(User? u) => u == null ? null : new(u.Id, u.Name, u.Email, u.Phone, u.CreatedAt);
}

/// <summary>Result of an auth use case plus the user to sign in (the API layer sets the cookie).</summary>
public record AuthOutcome(Common.AppResult Result, User? SignIn = null);
