using YatraBus.Application.Abstractions;
using YatraBus.Domain.Common;

namespace YatraBus.Infrastructure.Security;

/// <summary>Operator console tokens, kept in memory (restart = log in again), like the original.</summary>
public class InMemoryAdminTokenStore : IAdminTokenStore
{
    private readonly HashSet<string> _tokens = new();
    public string Issue() { var t = Js.Hex(16); lock (_tokens) _tokens.Add(t); return t; }
    public bool Valid(string? t) { if (string.IsNullOrEmpty(t)) return false; lock (_tokens) return _tokens.Contains(t); }
}
