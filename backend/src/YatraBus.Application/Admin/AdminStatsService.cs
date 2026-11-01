using Microsoft.EntityFrameworkCore;
using YatraBus.Application.Abstractions;
using YatraBus.Application.Common;

namespace YatraBus.Application.Admin;

/// <summary>Dashboard figures: totals, last 14 days, top routes, payment mix.</summary>
public class AdminStatsService(IAppDbContext db, IClock clock)
{
    public async Task<AppResult> Get()
    {
        var all = await db.Bookings.AsNoTracking().OrderBy(b => b.Seq).ToListAsync();
        var conf = all.Where(b => b.Status == "confirmed").ToList();
        var days = Enumerable.Range(0, 14).Reverse().Select(i =>
        {
            var d = clock.UtcNow.UtcDateTime.AddDays(-i).ToString("yyyy-MM-dd");
            var bs = all.Where(b => b.CreatedAt.StartsWith(d)).ToList();
            return new { date = d, bookings = bs.Count, revenue = bs.Where(b => b.Status == "confirmed").Sum(b => b.Fare.Total) };
        }).ToList();

        var routeKeys = new List<string>(); var routeSeats = new Dictionary<string, int>();
        foreach (var l in conf.SelectMany(b => b.Legs))
        {
            var k = $"{l.Snapshot.From} → {l.Snapshot.To}";
            if (!routeSeats.ContainsKey(k)) { routeKeys.Add(k); routeSeats[k] = 0; }
            routeSeats[k] += l.Seats.Count;
        }
        var topRoutes = routeKeys.OrderByDescending(k => routeSeats[k]).Take(5).Select(k => new object[] { k, routeSeats[k] }).ToList();

        var payments = new Dictionary<string, int>();
        foreach (var b in conf) { var k = b.Payment.Method.Replace(" (DEMO)", ""); payments[k] = payments.GetValueOrDefault(k) + 1; }

        return AppResult.Ok(new
        {
            bookings = all.Count, confirmed = conf.Count, cancelled = all.Count - conf.Count,
            revenue = conf.Sum(b => b.Fare.Total), refunds = all.Sum(b => b.Refund?.Amount ?? 0),
            seats = conf.Sum(b => b.Legs.Sum(l => l.Seats.Count)),
            fleet = new { buses = await db.Buses.CountAsync(), routes = await db.Routes.CountAsync(), schedules = await db.Schedules.CountAsync(), operators = await db.Operators.CountAsync() },
            days, topRoutes, payments,
        });
    }
}
