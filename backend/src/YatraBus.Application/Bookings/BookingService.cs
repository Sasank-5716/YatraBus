using Microsoft.EntityFrameworkCore;
using YatraBus.Application.Abstractions;
using YatraBus.Application.Common;
using YatraBus.Application.Pricing;
using YatraBus.Application.Trips;
using YatraBus.Domain.Bookings;
using YatraBus.Domain.Common;
using YatraBus.Domain.Entities;

namespace YatraBus.Application.Bookings;

/// <summary>Create (simulated payment), look up and cancel bookings.</summary>
public class BookingService(IAppDbContext db, ISeatHoldStore holds, PricingService pricing, TripProjector trips, IClock clock)
{
    public async Task<AppResult> Create(BookingRequest d, User? me)
    {
        var legs = d.Legs ?? new();
        if (legs.Count == 0) return AppResult.Fail(400, "Nothing to book");
        if (!Rules.NepaliMobile().IsMatch(d.Phone ?? "")) return AppResult.Fail(400, Rules.MobileMessage);
        if (!string.IsNullOrEmpty(d.Email) && !Rules.LooseEmail().IsMatch(d.Email)) return AppResult.Fail(400, "Enter a valid email address");
        var n = legs[0].Seats.Count;
        var pax = d.Passengers ?? new();
        if (pax.Count != n || pax.Any(x => string.IsNullOrEmpty(x.Name) || !(x.Age > 0 && x.Age < 120) || x.Gender is not ("M" or "F" or "O")))
            return AppResult.Fail(400, "Please complete name, age and gender for every passenger");
        if (legs.Any(l => l.Seats.Count != n)) return AppResult.Fail(400, "Return trip must have the same number of seats");
        holds.Clean();
        foreach (var l in legs)
        {
            var h = holds.Get(l.HoldId);
            if (h == null || !h.Covers(l.ScheduleId, l.Date, l.Seats)) return AppResult.Fail(410, "Your seat hold has expired. Please select seats again.");
        }
        Quote qt;
        try { qt = await pricing.Calculate(legs, d.Coupon, legs.Count > 1); }
        catch (QuoteException e) { return AppResult.Fail(400, e.Message); }
        if (!string.IsNullOrEmpty(d.Coupon) && qt.CouponError != null) return AppResult.Fail(400, qt.CouponError);

        var legsOut = new List<BookingLeg>();
        foreach (var l in qt.Legs)
        {
            var s = await db.Schedules.AsNoTracking().FirstAsync(x => x.Id == l.ScheduleId);
            var t = (await trips.Build<TripDto>(s, l.Date))!;
            var bp = t.Boarding.FirstOrDefault(x => x.Name == l.Boarding) ?? t.Boarding[0];
            var dp = t.Dropping.FirstOrDefault(x => x.Name == l.Dropping) ?? t.Dropping[^1];
            legsOut.Add(new BookingLeg
            {
                ScheduleId = l.ScheduleId, Date = l.Date!, Seats = l.Seats, SeatPrices = l.SeatPrices, Subtotal = l.Subtotal, Boarding = bp, Dropping = dp,
                Snapshot = new LegSnapshot { From = t.From, To = t.To, Departure = t.Departure, Arrival = t.Arrival, DurationMins = t.DurationMins, Operator = t.Operator.Name, BusNo = t.Bus.Number, BusType = t.Bus.Type },
            });
        }
        var now = clock.IsoNow;
        var b = new Booking
        {
            Id = Js.TicketId(), UserId = me?.Id, Status = BookingStatus.Confirmed, CreatedAt = now, TripType = legs.Count > 1 ? "round" : "oneway",
            Phone = d.Phone!, Email = d.Email ?? "",
            Passengers = pax.Select(x => new Passenger { Name = x.Name!.Trim()[..Math.Min(60, x.Name!.Trim().Length)], Age = (int)x.Age!.Value, Gender = x.Gender! }).ToList(),
            Legs = legsOut,
            Fare = new Fare { Base = qt.Base, Discount = qt.Discount, Coupon = qt.Coupon, Tax = qt.Tax, Service = qt.Service, Total = qt.Total },
            Payment = new Payment { Method = (string.IsNullOrEmpty(d.Payment) ? "eSewa" : d.Payment) + " (DEMO)", Ref = "DEMO-" + Js.Hex(3).ToUpperInvariant(), PaidAt = now },
            Seq = (await db.Bookings.MaxAsync(x => (long?)x.Seq) ?? 0) + 1,
        };
        db.Bookings.Add(b);
        await db.SaveChangesAsync();
        foreach (var l in legs) holds.Remove(l.HoldId);
        return AppResult.Ok(b, 201);
    }

    public async Task<AppResult> Lookup(string? id, string? phone)
    {
        var tid = (id ?? "").Trim().ToUpperInvariant();
        var ph = (phone ?? "").Trim();
        if (tid == "" && ph == "") return AppResult.Fail(400, "Enter a ticket ID or mobile number");
        var q = db.Bookings.AsNoTracking();
        if (tid != "") q = q.Where(b => b.Id == tid);
        if (ph != "") q = q.Where(b => b.Phone == ph);
        var list = await q.OrderByDescending(b => b.Seq).ToListAsync();
        var now = clock.UtcNow;
        return AppResult.Ok(list.Select(b => BookingView.From(b, now)).ToList());
    }

    public async Task<AppResult> CancelByCustomer(string id, CancelRequest d)
    {
        var b = await db.Bookings.FirstOrDefaultAsync(x => x.Id == id);
        if (b == null || b.Phone != (d.Phone ?? "").Trim()) return AppResult.Fail(404, "Booking not found for this mobile number");
        var err = RefundPolicy.CancelByCustomer(b, clock.UtcNow, clock.IsoNow);
        if (err != null) return AppResult.Fail(400, err);
        await db.SaveChangesAsync();
        return AppResult.Ok(b);
    }
}
