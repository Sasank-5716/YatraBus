using System.Text.RegularExpressions;

namespace YatraBus.Application.Common;

/// <summary>Input validation rules (same regexes and messages as the original server).</summary>
public static partial class Rules
{
    [GeneratedRegex(@"^[^\s@]+@[^\s@]+\.[^\s@]{2,}\z")] public static partial Regex Email();
    [GeneratedRegex(@"^9[678][0-9]{8}\z")] public static partial Regex NepaliMobile();
    [GeneratedRegex(@"^\S+@\S+\.\S+\z")] public static partial Regex LooseEmail();
    [GeneratedRegex(@"[A-Za-z]")] private static partial Regex Letter();
    [GeneratedRegex(@"[0-9]")] private static partial Regex Digit();

    public const string MobileMessage = "Enter a valid 10-digit Nepali mobile number (98XXXXXXXX)";

    public static string? PasswordError(string? pw) =>
        pw == null || pw.Length < 8 ? "Password must be at least 8 characters"
        : !Letter().IsMatch(pw) || !Digit().IsMatch(pw) ? "Password must include letters and numbers" : null;
}
