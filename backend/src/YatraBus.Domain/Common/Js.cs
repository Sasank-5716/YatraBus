using System.Globalization;
using System.Security.Cryptography;

namespace YatraBus.Domain.Common;

/// <summary>Small helpers that reproduce the exact JavaScript semantics of the original Node server.</summary>
public static class Js
{
    /// <summary>JavaScript Math.round (half rounds towards +∞).</summary>
    public static int Round(double x) => (int)Math.Floor(x + 0.5);

    public static long NowMs() => DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();

    /// <summary>new Date().toISOString()</summary>
    public static string IsoNow() => DateTime.UtcNow.ToString("yyyy-MM-dd'T'HH:mm:ss.fff'Z'", CultureInfo.InvariantCulture);

    /// <summary>A departure in Nepal time (UTC+05:45), or null when the input is not a valid date/time.</summary>
    public static DateTimeOffset? NptDate(string? date, string? hhmm)
    {
        if (string.IsNullOrEmpty(date) || string.IsNullOrEmpty(hhmm)) return null;
        return DateTimeOffset.TryParseExact($"{date}T{hhmm}:00+05:45", "yyyy-MM-dd'T'HH:mm:sszzz", CultureInfo.InvariantCulture, DateTimeStyles.None, out var d) ? d : null;
    }

    public static int ToMin(string t)
    {
        var p = t.Split(':');
        return int.TryParse(p[0], out var h) && p.Length > 1 && int.TryParse(p[1], out var m) ? h * 60 + m : 0;
    }

    public static string AddMins(string hhmm, int m)
    {
        var t = ToMin(hhmm) + m;
        return $"{(int)Math.Floor(t / 60.0) % 24:00}:{((t % 60) + 60) % 60:00}";
    }

    public static string Hex(int bytes) => Convert.ToHexString(RandomNumberGenerator.GetBytes(bytes)).ToLowerInvariant();

    /// <summary>Ticket id like YB4F9A2C7 (no 0/1 to avoid confusion with O/I).</summary>
    public static string TicketId() => "YB" + Convert.ToHexString(RandomNumberGenerator.GetBytes(4)).Replace('0', 'X').Replace('1', 'X')[..7];
}
