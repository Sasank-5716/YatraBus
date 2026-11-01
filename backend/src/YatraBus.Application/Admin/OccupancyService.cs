using Microsoft.EntityFrameworkCore;
using YatraBus.Application.Abstractions;
using YatraBus.Application.Common;
using YatraBus.Application.Trips;
using YatraBus.Domain.Entities;
using YatraBus.Domain.Seating;

namespace YatraBus.Application.Admin;

/// <summary>Seat map of one trip/date with the passenger on every booked seat (manifest).</summary>
public class OccupancyService(IAppDbContext db, TripProjector trips)
{
    public async Task<AppResult> Get(int? scheduleId, string? date)
    {
        var s = scheduleId == null ? null : await db.Schedules.AsNoTracking().FirstOrDefaultAsync(x => x.Id == scheduleId);
        if (s == null || string.IsNullOrEmpty(date)) return AppResult.Fail(400, "Choose a trip and date");
        var bus = await db.Buses.AsNoTracking().FirstAsync(x => x.Id == s.BusId);
        var seatInfo = new Dictionary<string, Dictionary<string, object>>();
        foreach (var b in (await db.Bookings.AsNoTracking().Where(b => b.Status == "confirmed").OrderBy(b => b.Seq).ToListAsync()))
            foreach (var l in b.Legs.Where(l => l.ScheduleId == s.Id && l.Date == date))
                for (var i = 0; i < l.Seats.Count; i++)
                {
                    var p = i < b.Passengers.Count ? b.Passengers[i] : new Passenger();
                    seatInfo[l.Seats[i]] = new() { ["id"] = b.Id, ["phone"] = b.Phone, ["name"] = p.Name, ["age"] = p.Age, ["gender"] = p.Gender, ["boarding"] = l.Boarding.Name };
                }
        var (booked, held) = await trips.Occupied(s.Id, date);
        var t = (await trips.Build<TripDto>(s, date))!;
        return AppResult.Ok(TripProjector.Extend<TripDetailDto>(t, x => { x.Layout = SeatLayout.For(bus, s.Fare).Decks; x.Booked = booked; x.Held = held; x.SeatInfo = seatInfo; }));
    }
}
