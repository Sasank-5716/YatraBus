using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

using YatraBus.Application.Abstractions;
using YatraBus.Domain.Entities;

namespace YatraBus.Infrastructure.Persistence;

/// <summary>EF Core SQLite store. Nested documents (legs, passengers, fare …) are JSON text columns.</summary>
public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options), IAppDbContext
{
    void IAppDbContext.AddEntity(object entity) => Add(entity);
    void IAppDbContext.RemoveEntity(object entity) => Remove(entity);
    ValueTask<object?> IAppDbContext.FindEntityAsync(Type type, int id) => FindAsync(type, id);

    public DbSet<Operator> Operators => Set<Operator>();
    public DbSet<Bus> Buses => Set<Bus>();
    public DbSet<BusRoute> Routes => Set<BusRoute>();
    public DbSet<Schedule> Schedules => Set<Schedule>();
    public DbSet<Coupon> Coupons => Set<Coupon>();
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Session> Sessions => Set<Session>();
    public DbSet<Subscriber> Subscribers => Set<Subscriber>();

    private static readonly JsonSerializerOptions J = new(JsonSerializerDefaults.Web);

    // Store small nested documents (legs, passengers, fare …) as JSON text columns.
    private static void Json<TEntity, TProp>(ModelBuilder mb, System.Linq.Expressions.Expression<Func<TEntity, TProp>> prop)
        where TEntity : class
    {
        var conv = new ValueConverter<TProp, string>(v => JsonSerializer.Serialize(v, J), v => JsonSerializer.Deserialize<TProp>(v, J)!);
        var cmp = new ValueComparer<TProp>((a, b) => JsonSerializer.Serialize(a, J) == JsonSerializer.Serialize(b, J),
            v => JsonSerializer.Serialize(v, J).GetHashCode(), v => JsonSerializer.Deserialize<TProp>(JsonSerializer.Serialize(v, J), J)!);
        mb.Entity<TEntity>().Property(prop).HasConversion(conv, cmp);
    }

    protected override void OnModelCreating(ModelBuilder mb)
    {
        mb.Entity<Operator>().Property(x => x.Id).ValueGeneratedNever();
        mb.Entity<Bus>().Property(x => x.Id).ValueGeneratedNever();
        mb.Entity<BusRoute>().ToTable("Routes").Property(x => x.Id).ValueGeneratedNever();
        mb.Entity<Schedule>().Property(x => x.Id).ValueGeneratedNever();
        mb.Entity<Coupon>().Property(x => x.Id).ValueGeneratedNever();
        mb.Entity<Coupon>().HasIndex(x => x.Code);
        mb.Entity<Booking>().HasKey(x => x.Id);
        mb.Entity<Booking>().HasIndex(x => x.Phone);
        mb.Entity<Booking>().HasIndex(x => x.UserId);
        mb.Entity<User>().HasKey(x => x.Id);
        mb.Entity<User>().HasIndex(x => x.Email).IsUnique();
        mb.Entity<User>().HasIndex(x => x.Phone).IsUnique();
        mb.Entity<Session>().HasKey(x => x.Token);
        mb.Entity<Subscriber>().HasIndex(x => x.Email).IsUnique();

        Json<Bus, List<string>>(mb, x => x.Amenities);
        Json<Booking, List<Passenger>>(mb, x => x.Passengers);
        Json<Booking, List<BookingLeg>>(mb, x => x.Legs);
        Json<Booking, Fare>(mb, x => x.Fare);
        Json<Booking, Payment>(mb, x => x.Payment);
        Json<Booking, StoredRefund?>(mb, x => x.Refund);
    }
}
