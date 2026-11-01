using YatraBus.Domain.Common;
using YatraBus.Domain.Entities;

namespace YatraBus.Domain.Pricing;

public record CouponOutcome(int Discount, string? Code, string? Error);
public record FareTotals(int Tax, int Service, int Total);

/// <summary>Coupon rules, 13% VAT on the discounted fare and Rs. 25 service charge per seat per leg.</summary>
public static class FareRules
{
    public const double TaxRate = 0.13;
    public const int ServicePerSeat = 25;

    public static CouponOutcome ApplyCoupon(Coupon? c, int baseFare, bool roundTrip)
    {
        if (c == null || !c.Active) return new(0, null, "Invalid or expired coupon code");
        if (baseFare < c.MinAmount) return new(0, null, $"Minimum booking of Rs. {c.MinAmount} required");
        if (c.RoundTripOnly && !roundTrip) return new(0, null, "This code is valid on round trips only");
        var discount = c.Type == "percent"
            ? Math.Min(Js.Round(baseFare * c.Value / 100.0), c.MaxDiscount > 0 ? c.MaxDiscount : int.MaxValue)
            : Math.Min(c.Value, baseFare);
        return new(discount, c.Code, null);
    }

    public static FareTotals Totals(int baseFare, int discount, int seats)
    {
        var service = ServicePerSeat * seats;
        var tax = Js.Round((baseFare - discount) * TaxRate);
        return new(tax, service, baseFare - discount + tax + service);
    }
}
