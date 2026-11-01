using Microsoft.EntityFrameworkCore;
using YatraBus.Application.Abstractions;
using YatraBus.Domain.Entities;
using YatraBus.Domain.Pricing;
using YatraBus.Domain.Seating;

namespace YatraBus.Application.Pricing;

public class LegInput
{
    public int ScheduleId { get; set; }
    public string? Date { get; set; }
    public List<string> Seats { get; set; } = new();
    public string? HoldId { get; set; }
    public string? Boarding { get; set; }
    public string? Dropping { get; set; }
}

public class QuotedLeg : LegInput
{
    public List<int> SeatPrices { get; set; } = new();
    public int Subtotal { get; set; }
}

public class Quote
{
    public List<QuotedLeg> Legs { get; set; } = new();
    public int Base { get; set; }
    public int Discount { get; set; }
    public string? Coupon { get; set; }
    public string? CouponError { get; set; }
    public int Tax { get; set; }
    public int Service { get; set; }
    public int Total { get; set; }
}

public class QuoteRequest { public List<LegInput>? Legs { get; set; } public string? Coupon { get; set; } }

public class QuoteException(string message) : Exception(message);

/// <summary>Fare calculation: seat prices, coupon rules, 13% VAT on the discounted fare, Rs. 25 service per seat per leg.</summary>
public class PricingService(IAppDbContext db)
{
    public const double Tax = FareRules.TaxRate;
    public const int Service = FareRules.ServicePerSeat;

    public async Task<Quote> Calculate(List<LegInput> legs, string? code, bool roundTrip)
    {
        var q = new Quote();
        int seats = 0;
        foreach (var l in legs)
        {
            var s = await db.Schedules.AsNoTracking().FirstOrDefaultAsync(x => x.Id == l.ScheduleId) ?? throw new QuoteException("Trip not found");
            var bus = await db.Buses.AsNoTracking().FirstAsync(x => x.Id == s.BusId);
            var lay = SeatLayout.For(bus, s.Fare);
            var prices = l.Seats.Select(id => (lay.Seats.FirstOrDefault(z => z.Id == id) ?? throw new QuoteException("Invalid seat " + id)).Price).ToList();
            var sub = prices.Sum();
            q.Base += sub; seats += l.Seats.Count;
            q.Legs.Add(new QuotedLeg { ScheduleId = l.ScheduleId, Date = l.Date, Seats = l.Seats, HoldId = l.HoldId, Boarding = l.Boarding, Dropping = l.Dropping, SeatPrices = prices, Subtotal = sub });
        }
        if (!string.IsNullOrEmpty(code))
        {
            var wanted = code.Trim().ToUpperInvariant();
            var c = (await db.Coupons.AsNoTracking().Where(x => x.Active).OrderBy(x => x.Id).ToListAsync()).FirstOrDefault(x => x.Code.ToUpperInvariant() == wanted);
            var o = FareRules.ApplyCoupon(c, q.Base, roundTrip);
            if (o.Error != null) q.CouponError = o.Error; else { q.Discount = o.Discount; q.Coupon = o.Code; }
        }
        var t = FareRules.Totals(q.Base, q.Discount, seats);
        q.Service = t.Service; q.Tax = t.Tax; q.Total = t.Total;
        return q;
    }
}
