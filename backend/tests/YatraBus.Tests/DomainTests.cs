using YatraBus.Domain.Bookings;
using YatraBus.Domain.Common;
using YatraBus.Domain.Entities;
using YatraBus.Domain.Pricing;
using YatraBus.Domain.Seating;

namespace YatraBus.Tests;

public class RefundPolicyTests
{
    private static Booking BookingDeparting(DateTimeOffset now, double hoursAhead, int total = 2000)
    {
        var dep = now.AddHours(hoursAhead).ToOffset(TimeSpan.FromMinutes(345));
        return new Booking
        {
            Status = BookingStatus.Confirmed, Fare = new Fare { Total = total },
            Legs = [new BookingLeg { Date = dep.ToString("yyyy-MM-dd"), Snapshot = new LegSnapshot { Departure = dep.ToString("HH:mm") } }],
        };
    }

    [Theory]
    [InlineData(72, 90)]
    [InlineData(30, 75)]
    [InlineData(12, 50)]
    [InlineData(3, 0)]
    public void Percent_follows_the_published_tiers(double hours, int pct) => Assert.Equal(pct, RefundPolicy.PercentFor(hours));

    [Fact]
    public void Quote_is_rounded_and_allowed_more_than_6h_out()
    {
        var now = new DateTimeOffset(2026, 10, 13, 6, 0, 0, TimeSpan.Zero);
        var r = RefundPolicy.For(BookingDeparting(now, 50, 3045), now);
        Assert.Equal(90, r.Percent); Assert.Equal(Js.Round(3045 * 0.9), r.Amount); Assert.True(r.Allowed);
    }

    [Fact]
    public void Customer_cannot_cancel_within_6_hours_or_twice()
    {
        var now = DateTimeOffset.UtcNow;
        var late = BookingDeparting(now, 2);
        Assert.Equal("Cancellation closes 6 hours before departure", RefundPolicy.CancelByCustomer(late, now, "t"));
        var ok = BookingDeparting(now, 30);
        Assert.Null(RefundPolicy.CancelByCustomer(ok, now, "t"));
        Assert.Equal(BookingStatus.Cancelled, ok.Status); Assert.Equal(75, ok.Refund!.Percent); Assert.Equal("customer", ok.Refund.By);
        Assert.Equal("Booking is already cancelled", RefundPolicy.CancelByCustomer(ok, now, "t"));
    }

    [Fact]
    public void Operator_cancellation_refunds_everything()
    {
        var b = BookingDeparting(DateTimeOffset.UtcNow, 1, 1234);
        Assert.Null(RefundPolicy.CancelByOperator(b, "t"));
        Assert.Equal(100, b.Refund!.Percent); Assert.Equal(1234, b.Refund.Amount);
        Assert.Equal("Already cancelled", RefundPolicy.CancelByOperator(b, "t"));
    }
}

public class FareRulesTests
{
    private static Coupon Pct(int v, int max = 0, int min = 0, bool round = false) => new() { Code = "X", Type = "percent", Value = v, MaxDiscount = max, MinAmount = min, RoundTripOnly = round, Active = true };

    [Fact] public void Percent_coupon_is_capped() => Assert.Equal(300, FareRules.ApplyCoupon(Pct(10, 300), 5000, false).Discount);
    [Fact] public void Percent_coupon_without_cap() => Assert.Equal(500, FareRules.ApplyCoupon(Pct(10), 5000, false).Discount);
    [Fact] public void Flat_coupon_never_exceeds_fare() => Assert.Equal(400, FareRules.ApplyCoupon(new Coupon { Code = "F", Type = "flat", Value = 500, Active = true }, 400, false).Discount);
    [Fact] public void Minimum_amount_is_enforced() => Assert.Equal("Minimum booking of Rs. 1500 required", FareRules.ApplyCoupon(Pct(15, 600, 1500), 1000, true).Error);
    [Fact] public void Round_trip_only_codes() => Assert.Equal("This code is valid on round trips only", FareRules.ApplyCoupon(Pct(15, 600, 0, true), 3000, false).Error);
    [Fact] public void Missing_or_inactive_coupon() { Assert.Equal("Invalid or expired coupon code", FareRules.ApplyCoupon(null, 100, false).Error); var c = Pct(5); c.Active = false; Assert.Equal("Invalid or expired coupon code", FareRules.ApplyCoupon(c, 100, false).Error); }

    [Fact]
    public void Totals_add_13_percent_vat_and_25_per_seat()
    {
        var t = FareRules.Totals(2650, 0, 2);
        Assert.Equal(345, t.Tax); Assert.Equal(50, t.Service); Assert.Equal(3045, t.Total);
    }
}

public class SeatingTests
{
    [Fact]
    public void Sleeper_has_two_decks_of_18_berths_with_lower_premium()
    {
        var l = SeatLayout.For(new Bus { Layout = "sleeper" }, 1900);
        Assert.Equal(2, l.Decks.Count); Assert.Equal(36, l.Total);
        Assert.Equal(2050, l.Seats.First(s => s.Id == "L1").Price); Assert.Equal(1900, l.Seats.First(s => s.Id == "U1").Price);
        Assert.True(l.Seats.First(s => s.Id == "L1").Ladies);
    }

    [Theory]
    [InlineData("seater", 41)]
    [InlineData("sofa", 28)]
    [InlineData("micro", 16)]
    public void Layout_sizes(string layout, int seats) => Assert.Equal(seats, SeatLayout.For(new Bus { Layout = layout }, 1000).Total);

    [Fact]
    public void Hold_covers_and_expires()
    {
        var h = new SeatHold(3, "2026-10-20", ["A1", "A2"], 1000);
        Assert.True(h.Covers(3, "2026-10-20", ["A2"])); Assert.False(h.Covers(3, "2026-10-21", ["A2"])); Assert.False(h.Covers(3, "2026-10-20", ["B1"]));
        Assert.True(h.IsExpired(1001)); Assert.False(h.IsExpired(999));
    }

    [Fact] public void Clashes_lists_taken_seats() => Assert.Equal(["A1", "B2"], SeatHold.Clashes(["A1", "A3", "B2"], ["A1"], ["B2"]));

    [Fact]
    public void Boarding_points_are_15_minutes_apart_and_dropping_ends_on_arrival()
    {
        var (b, d) = BoardingPoints.For(new Schedule { Departure = "06:30", DurationMins = 420 }, new BusRoute { From = "Kathmandu", To = "Pokhara" });
        Assert.Equal(["06:30", "06:45", "07:00", "07:15"], b.Select(x => x.Time));
        Assert.Equal("13:30", d[^1].Time); Assert.Equal("Lakeside", d[^1].Name);
    }

    [Fact] public void Js_round_matches_javascript() { Assert.Equal(3, Js.Round(2.5)); Assert.Equal(-2, Js.Round(-2.5)); Assert.Equal("01:15", Js.AddMins("23:45", 90)); }
    [Fact] public void Ticket_ids_avoid_0_and_1() { for (var i = 0; i < 200; i++) { var t = Js.TicketId(); Assert.Equal(9, t.Length); Assert.DoesNotContain('0', t[2..]); Assert.DoesNotContain('1', t[2..]); } }
}
