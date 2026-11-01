using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using YatraBus.Application.Abstractions;
using YatraBus.Infrastructure.Persistence;
using YatraBus.Infrastructure.Seating;
using YatraBus.Infrastructure.Security;

namespace YatraBus.Infrastructure;

public static class DependencyInjection
{
    /// <summary>SQLite persistence, seeding, hashing, in-memory holds/tokens and options.</summary>
    public static IServiceCollection AddInfrastructure(this IServiceCollection s, IConfiguration cfg)
    {
        var opts = cfg.GetSection("Yatra").Get<YatraOptions>() ?? new YatraOptions();
        if (!string.IsNullOrEmpty(cfg["ADMIN_PASSWORD"])) opts.AdminPassword = cfg["ADMIN_PASSWORD"]!;
        s.AddSingleton(opts);
        s.AddDbContext<AppDbContext>(o => o.UseSqlite(cfg.GetConnectionString("Default") ?? "Data Source=yatra.db"));
        s.AddScoped<IAppDbContext>(sp => sp.GetRequiredService<AppDbContext>());
        s.AddScoped<IDataSeeder, DataSeeder>();
        s.AddSingleton<IClock, SystemClock>();
        s.AddSingleton<IPasswordHasher, Pbkdf2PasswordHasher>();
        s.AddSingleton<ISeatHoldStore, InMemorySeatHoldStore>();
        s.AddSingleton<IAdminTokenStore, InMemoryAdminTokenStore>();
        return s;
    }
}
