using Microsoft.EntityFrameworkCore;
using YatraBus.Application.Abstractions;
using YatraBus.Application.Common;
using YatraBus.Application.Trips;
using YatraBus.Domain.Common;
using YatraBus.Domain.Seating;

namespace YatraBus.Application.Seats;

public class HoldRequest
{
    public int ScheduleId { get; set; }
    public string? Date { get; set; }
    public List<string>? Seats { get; set; }
    public string? Previous { get; set; }
}

/// <summary>Lock seats for the configured hold time (default 10 minutes) while the customer checks out.</summary>
public class HoldService(IAppDbContext db, ISeatHoldStore holds, TripProjector trips, IClock clock, YatraOptions opts)
{
    public async Task<AppResult> Hold(HoldRequest d)
    {
        var s = await db.Schedules.AsNoTracking().FirstOrDefaultAsync(x => x.Id == d.ScheduleId);
        if (s == null || string.IsNullOrEmpty(d.Date) || d.Seats == null || d.Seats.Count == 0) return AppResult.Fail(400, "Select at least one seat");
        if (d.Seats.Count > SeatHold.MaxSeats) return AppResult.Fail(400, "Maximum 6 seats per booking");
        var dep = Js.NptDate(d.Date, s.Departure);
        if (dep != null && dep < clock.UtcNow) return AppResult.Fail(400, "This bus has already departed");
        if (!string.IsNullOrEmpty(d.Previous)) holds.Remove(d.Previous);
        var (booked, held) = await trips.Occupied(s.Id, d.Date);
        var clash = SeatHold.Clashes(d.Seats, booked, held);
        if (clash.Count > 0) return AppResult.Ok(new { error = $"Seat {string.Join(", ", clash)} was just taken. Please pick another.", clash }, 409);
        var id = Js.Hex(8);
        var expires = clock.NowMs + opts.HoldMinutes * 60_000L;
        holds.Set(id, new SeatHold(s.Id, d.Date, d.Seats, expires));
        return AppResult.Ok(new { holdId = id, expiresAt = expires }, 201);
    }

    public AppResult Release(string id) { holds.Remove(id); return AppResult.Ok(new { ok = true }); }
}
