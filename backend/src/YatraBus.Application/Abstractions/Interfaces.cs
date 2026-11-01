using Microsoft.EntityFrameworkCore;
using YatraBus.Domain.Entities;
using YatraBus.Domain.Seating;

namespace YatraBus.Application.Abstractions;

/// <summary>Unit of work over the persisted aggregates (implemented by EF Core in Infrastructure).</summary>
public interface IAppDbContext
{
    DbSet<Operator> Operators { get; }
    DbSet<Bus> Buses { get; }
    DbSet<BusRoute> Routes { get; }
    DbSet<Schedule> Schedules { get; }
    DbSet<Coupon> Coupons { get; }
    DbSet<Booking> Bookings { get; }
    DbSet<User> Users { get; }
    DbSet<Session> Sessions { get; }
    DbSet<Subscriber> Subscribers { get; }
    Task<int> SaveChangesAsync(CancellationToken ct = default);
    void AddEntity(object entity);
    void RemoveEntity(object entity);
    ValueTask<object?> FindEntityAsync(Type type, int id);
}

public interface IPasswordHasher { string Hash(string password); bool Verify(string password, string stored); }

/// <summary>Temporary seat holds (in memory, like the original server).</summary>
public interface ISeatHoldStore
{
    void Clean();
    SeatHold? Get(string? id);
    void Set(string id, SeatHold hold);
    void Remove(string? id);
    void Clear();
    List<string> HeldSeats(int scheduleId, string date, string? exceptHold);
}

/// <summary>Operator console tokens.</summary>
public interface IAdminTokenStore { string Issue(); bool Valid(string? token); }

/// <summary>Restores the demo catalogue.</summary>
public interface IDataSeeder { void EnsureSeeded(); void Reseed(bool keepUsers); }

public interface IClock { DateTimeOffset UtcNow { get; } long NowMs { get; } string IsoNow { get; } }

/// <summary>Bound from configuration section "Yatra" (ADMIN_PASSWORD overrides AdminPassword).</summary>
public class YatraOptions
{
    public string AdminPassword { get; set; } = "admin";
    public int HoldMinutes { get; set; } = 10;
    public int SessionDays { get; set; } = 30;
}
