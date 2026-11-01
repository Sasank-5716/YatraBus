using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using YatraBus.Application.Abstractions;
using YatraBus.Domain.Common;
using YatraBus.Domain.Entities;
using YatraBus.Domain.Seating;

namespace YatraBus.Application.Trips;

public record BusInfo(int Id, string Number, string Type, string Layout, bool Ac, List<string> Amenities);
public record OperatorInfo(int Id, string Name, double Rating, int Reviews);

/// <summary>Public view of a scheduled trip on a date (same JSON as the Node server's trip()).</summary>
public class TripDto
{
    public int Id { get; set; }
    public int RouteId { get; set; }
    public string From { get; set; } = "";
    public string To { get; set; } = "";
    public int Km { get; set; }
    public string Departure { get; set; } = "";
    public string Arrival { get; set; } = "";
    public int DurationMins { get; set; }
    public bool NextDay { get; set; }
    public int Fare { get; set; }
    public int MinFare { get; set; }
    public BusInfo Bus { get; set; } = null!;
    public OperatorInfo Operator { get; set; } = null!;
    public int TotalSeats { get; set; }
    public int SeatsLeft { get; set; }
    public List<Point> Boarding { get; set; } = new();
    public List<Point> Dropping { get; set; } = new();
}

public class SearchTripDto : TripDto { public bool Departed { get; set; } }

public class TripDetailDto : TripDto
{
    public List<Deck> Layout { get; set; } = new();
    public List<string> Booked { get; set; } = new();
    public List<string> Held { get; set; } = new();
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public Dictionary<string, Dictionary<string, object>>? SeatInfo { get; set; }
}

/// <summary>Builds trip views, boarding/dropping points and seat occupancy.</summary>
public class TripProjector(IAppDbContext db, ISeatHoldStore holds)
{
    public static (List<Point> Boarding, List<Point> Dropping) Points(Schedule s, BusRoute r) => BoardingPoints.For(s, r);

    /// <summary>Seats taken by confirmed bookings and by other people's holds.</summary>
    public async Task<(List<string> Booked, List<string> Held)> Occupied(int scheduleId, string date, string? exceptHold = null)
    {
        holds.Clean();
        var confirmed = await db.Bookings.AsNoTracking().Where(b => b.Status == YatraBus.Domain.Bookings.BookingStatus.Confirmed).ToListAsync();
        var booked = confirmed.SelectMany(b => b.Legs.Where(l => l.ScheduleId == scheduleId && l.Date == date).SelectMany(l => l.Seats)).ToList();
        return (booked, holds.HeldSeats(scheduleId, date, exceptHold));
    }

    public async Task<T?> Build<T>(Schedule s, string? date, Func<TripDto, T>? extend = null) where T : TripDto
    {
        var r = await db.Routes.AsNoTracking().FirstOrDefaultAsync(x => x.Id == s.RouteId);
        var bus = await db.Buses.AsNoTracking().FirstOrDefaultAsync(x => x.Id == s.BusId);
        if (r == null || bus == null) return null;
        var op = await db.Operators.AsNoTracking().FirstOrDefaultAsync(x => x.Id == bus.OperatorId) ?? new Operator { Name = "Unknown" };
        var lay = SeatLayout.For(bus, s.Fare);
        var (booked, held) = string.IsNullOrEmpty(date) ? (new List<string>(), new List<string>()) : await Occupied(s.Id, date);
        var (bp, dp) = Points(s, r);
        var t = new TripDto
        {
            Id = s.Id, RouteId = r.Id, From = r.From, To = r.To, Km = r.Km, Departure = s.Departure, Arrival = Js.AddMins(s.Departure, s.DurationMins),
            DurationMins = s.DurationMins, NextDay = Js.ToMin(s.Departure) + s.DurationMins >= 1440, Fare = s.Fare, MinFare = lay.Seats.Min(x => x.Price),
            Bus = new BusInfo(bus.Id, bus.Number, bus.Type, bus.Layout, bus.Ac, bus.Amenities),
            Operator = new OperatorInfo(op.Id, op.Name, op.Rating, op.Reviews),
            TotalSeats = lay.Total, SeatsLeft = lay.Total - booked.Concat(held).Distinct().Count(), Boarding = bp, Dropping = dp,
        };
        return extend != null ? extend(t) : t as T;
    }

    /// <summary>Copy the base trip fields into a derived DTO.</summary>
    public static T Extend<T>(TripDto t, Action<T>? more = null) where T : TripDto, new()
    {
        var x = new T
        {
            Id = t.Id, RouteId = t.RouteId, From = t.From, To = t.To, Km = t.Km, Departure = t.Departure, Arrival = t.Arrival, DurationMins = t.DurationMins,
            NextDay = t.NextDay, Fare = t.Fare, MinFare = t.MinFare, Bus = t.Bus, Operator = t.Operator, TotalSeats = t.TotalSeats, SeatsLeft = t.SeatsLeft,
            Boarding = t.Boarding, Dropping = t.Dropping,
        };
        more?.Invoke(x);
        return x;
    }
}
