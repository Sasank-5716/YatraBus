using YatraBus.Domain.Common;
using YatraBus.Domain.Entities;

namespace YatraBus.Domain.Bookings;

public record RefundInfo(int HoursLeft, int Percent, int Amount, bool Allowed);

/// <summary>&gt;48h: 90% · 24–48h: 75% · 6–24h: 50% · &lt;6h: not cancellable. Operators always refund 100%.</summary>
public static class RefundPolicy
{
    public const int CustomerCutoffHours = 6, OperatorPercent = 100;

    public static int PercentFor(double hoursLeft) => hoursLeft > 48 ? 90 : hoursLeft > 24 ? 75 : hoursLeft > 6 ? 50 : 0;

    public static RefundInfo For(Booking b, DateTimeOffset now)
    {
        var dep = Js.NptDate(b.Legs[0].Date, b.Legs[0].Snapshot.Departure) ?? now;
        var hrs = (dep - now).TotalMilliseconds / 36e5;
        var pct = PercentFor(hrs);
        return new RefundInfo(Js.Round(hrs), pct, Js.Round(b.Fare.Total * pct / 100.0), hrs > CustomerCutoffHours && b.Status == BookingStatus.Confirmed);
    }

    /// <summary>Customer cancellation: returns an error message, or null after marking the booking cancelled.</summary>
    public static string? CancelByCustomer(Booking b, DateTimeOffset now, string isoNow)
    {
        var r = For(b, now);
        if (!r.Allowed) return b.Status != BookingStatus.Confirmed ? "Booking is already cancelled" : "Cancellation closes 6 hours before departure";
        b.Status = BookingStatus.Cancelled; b.CancelledAt = isoNow; b.Refund = new StoredRefund { Percent = r.Percent, Amount = r.Amount, By = "customer" };
        return null;
    }

    /// <summary>Operator cancellation (full refund).</summary>
    public static string? CancelByOperator(Booking b, string isoNow)
    {
        if (b.Status != BookingStatus.Confirmed) return "Already cancelled";
        b.Status = BookingStatus.Cancelled; b.CancelledAt = isoNow; b.Refund = new StoredRefund { Percent = OperatorPercent, Amount = b.Fare.Total, By = "admin" };
        return null;
    }
}

public static class BookingStatus { public const string Confirmed = "confirmed", Cancelled = "cancelled"; }
