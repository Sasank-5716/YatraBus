using YatraBus.Application.Pricing;
using YatraBus.Domain.Bookings;
using YatraBus.Domain.Entities;

namespace YatraBus.Application.Bookings;

public class PassengerInput { public string? Name { get; set; } public double? Age { get; set; } public string? Gender { get; set; } }
public class BookingRequest
{
    public List<LegInput>? Legs { get; set; }
    public string? Coupon { get; set; }
    public List<PassengerInput>? Passengers { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Payment { get; set; }
}
public class CancelRequest { public string? Phone { get; set; } }

/// <summary>A booking as returned by lookups: "refund" is the live refund quote (same as the original API).</summary>
public class BookingView
{
    public string Id { get; set; } = "";
    public string? UserId { get; set; }
    public string Status { get; set; } = "";
    public string CreatedAt { get; set; } = "";
    public string TripType { get; set; } = "";
    public string Phone { get; set; } = "";
    public string Email { get; set; } = "";
    public List<Passenger> Passengers { get; set; } = new();
    public List<BookingLeg> Legs { get; set; } = new();
    public Fare Fare { get; set; } = new();
    public Payment Payment { get; set; } = new();
    public string? CancelledAt { get; set; }
    public RefundInfo Refund { get; set; } = null!;

    public static BookingView From(Booking b, DateTimeOffset now) => new()
    {
        Id = b.Id, UserId = b.UserId, Status = b.Status, CreatedAt = b.CreatedAt, TripType = b.TripType, Phone = b.Phone, Email = b.Email,
        Passengers = b.Passengers, Legs = b.Legs, Fare = b.Fare, Payment = b.Payment, CancelledAt = b.CancelledAt, Refund = RefundPolicy.For(b, now),
    };
}
