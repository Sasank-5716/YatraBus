using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using YatraBus.Application.Abstractions;
using YatraBus.Domain.Common;
using YatraBus.Infrastructure.Persistence;
using YatraBus.Infrastructure.Seating;
using YatraBus.Infrastructure.Security;

namespace YatraBus.Tests;

public class FakeClock(DateTimeOffset now) : IClock
{
    public DateTimeOffset Now { get; set; } = now;
    public DateTimeOffset UtcNow => Now;
    public long NowMs => Now.ToUnixTimeMilliseconds();
    public string IsoNow => Now.UtcDateTime.ToString("yyyy-MM-dd'T'HH:mm:ss.fff'Z'");
}

/// <summary>A seeded in-memory SQLite database per test.</summary>
public sealed class TestDb : IDisposable
{
    private readonly SqliteConnection _conn = new("Data Source=:memory:");
    public AppDbContext Db { get; }
    public FakeClock Clock { get; } = new(DateTimeOffset.UtcNow);
    public InMemorySeatHoldStore Holds { get; }
    public Pbkdf2PasswordHasher Hasher { get; } = new();
    public YatraOptions Options { get; } = new();

    public TestDb()
    {
        _conn.Open();
        Db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(_conn).Options);
        SeedData.EnsureSeeded(Db);
        Holds = new InMemorySeatHoldStore(Clock);
    }

    public static string Day(int offset) => DateTime.UtcNow.AddDays(offset).ToString("yyyy-MM-dd");
    public void Dispose() { Db.Dispose(); _conn.Dispose(); }
}
