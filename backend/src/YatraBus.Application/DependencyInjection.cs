using Microsoft.Extensions.DependencyInjection;
using YatraBus.Application.Admin;
using YatraBus.Application.Auth;
using YatraBus.Application.Bookings;
using YatraBus.Application.Newsletter;
using YatraBus.Application.Pricing;
using YatraBus.Application.Search;
using YatraBus.Application.Seats;
using YatraBus.Application.Trips;

namespace YatraBus.Application;

public static class DependencyInjection
{
    /// <summary>Registers every use-case service (scoped per request).</summary>
    public static IServiceCollection AddApplication(this IServiceCollection s) => s
        .AddScoped<TripProjector>().AddScoped<PricingService>().AddScoped<ProfileValidator>().AddScoped<SessionService>()
        .AddScoped<AuthService>().AddScoped<MetaService>().AddScoped<TripService>().AddScoped<HoldService>()
        .AddScoped<BookingService>().AddScoped<NewsletterService>()
        .AddScoped<AdminService>().AddScoped<AdminStatsService>().AddScoped<AdminBookingsService>().AddScoped<OccupancyService>().AddScoped<CatalogService>();
}
