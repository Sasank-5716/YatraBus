using Microsoft.EntityFrameworkCore;
using YatraBus.Application.Abstractions;
using YatraBus.Application.Common;
using YatraBus.Domain.Common;
using YatraBus.Domain.Seating;

namespace YatraBus.Application.Trips;

/// <summary>Search departures and load one trip with its seat map.</summary>
public class TripService(IAppDbContext db, TripProjector trips, IClock clock)
{
    public async Task<AppResult> Search(string? from, string? to, string? date)
    {
        var rids = await db.Routes.AsNoTracking().Where(r => r.From == from && r.To == to).Select(r => r.Id).ToListAsync();
        var ss = await db.Schedules.AsNoTracking().Where(s => rids.Contains(s.RouteId) && s.Active).ToListAsync();
        var now = clock.UtcNow;
        var list = new List<SearchTripDto>();
        foreach (var s in ss)
        {
            var t = await trips.Build<TripDto>(s, date);
            if (t == null) continue;
            var dep = Js.NptDate(date, t.Departure);
            list.Add(TripProjector.Extend<SearchTripDto>(t, x => x.Departed = dep != null && dep < now));
        }
        return AppResult.Ok(list.OrderBy(x => x.Departure, StringComparer.Ordinal).ThenBy(x => x.Id).ToList());
    }

    public async Task<AppResult> Detail(int id, string? date, string? hold)
    {
        var s = await db.Schedules.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
        if (s == null || string.IsNullOrEmpty(date)) return AppResult.Fail(404, "Trip not found");
        var bus = await db.Buses.AsNoTracking().FirstAsync(x => x.Id == s.BusId);
        var (booked, held) = await trips.Occupied(s.Id, date, hold);
        var t = await trips.Build<TripDto>(s, date);
        if (t == null) return AppResult.Fail(404, "Trip not found");
        return AppResult.Ok(TripProjector.Extend<TripDetailDto>(t, x => { x.Layout = SeatLayout.For(bus, s.Fare).Decks; x.Booked = booked; x.Held = held; }));
    }
}
