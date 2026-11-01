using Microsoft.EntityFrameworkCore;
using YatraBus.Application.Abstractions;
using YatraBus.Application.Common;
using YatraBus.Domain.Pricing;

namespace YatraBus.Application.Search;

/// <summary>Site metadata: cities, popular routes, active offers, pricing constants.</summary>
public class MetaService(IAppDbContext db, YatraOptions opts)
{
    private static readonly string[] Popular = ["Kathmandu-Pokhara", "Kathmandu-Chitwan", "Pokhara-Chitwan", "Kathmandu-Biratnagar", "Kathmandu-Janakpur", "Chitwan-Butwal"];

    public async Task<AppResult> Get()
    {
        var routes = await db.Routes.AsNoTracking().ToListAsync();
        var schedules = await db.Schedules.AsNoTracking().ToListAsync();
        var cities = routes.SelectMany(r => new[] { r.From, r.To }).Distinct().OrderBy(x => x, StringComparer.Ordinal).ToList();
        var popular = Popular.Select(k =>
        {
            var p = k.Split('-');
            var r = routes.FirstOrDefault(x => x.From == p[0] && x.To == p[1]);
            if (r == null) return null;
            var ss = schedules.Where(s => s.RouteId == r.Id && s.Active).ToList();
            return new { from = p[0], to = p[1], km = r.Km, durationMins = r.DurationMins, minFare = ss.Count > 0 ? ss.Min(s => s.Fare) : r.BaseFare, trips = ss.Count };
        }).Where(x => x != null).ToList();
        var offers = (await db.Coupons.AsNoTracking().Where(c => c.Active).OrderBy(c => c.Id).ToListAsync())
            .Select(c => new { code = c.Code, description = c.Description, roundTripOnly = c.RoundTripOnly });
        return AppResult.Ok(new
        {
            cities, popular, offers, operators = await db.Operators.CountAsync(),
            tax = FareRules.TaxRate, service = FareRules.ServicePerSeat, holdMinutes = opts.HoldMinutes,
        });
    }
}
