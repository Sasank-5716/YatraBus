using System.Text.Json.Serialization;

namespace YatraBus.Domain.Entities;

// Domain entities. Catalogue ids are assigned by the app (max + 1), exactly like the original JSON store.
public class Operator
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public double Rating { get; set; }
    public int Reviews { get; set; }
}

public class Bus
{
    public int Id { get; set; }
    public int OperatorId { get; set; }
    public string Number { get; set; } = "";
    public string Type { get; set; } = "";
    public string Layout { get; set; } = "seater";   // seater | sofa | sleeper | micro
    public bool Ac { get; set; }
    public List<string> Amenities { get; set; } = new();
    public double? FareMult { get; set; }   // null for buses added via admin (v5 leaves it unset)
}

public class BusRoute
{
    public int Id { get; set; }
    public string From { get; set; } = "";
    public string To { get; set; } = "";
    public int Km { get; set; }
    public int BaseFare { get; set; }
    public int DurationMins { get; set; }
}

public class Schedule
{
    public int Id { get; set; }
    public int RouteId { get; set; }
    public int BusId { get; set; }
    public string Departure { get; set; } = "06:00";  // HH:mm, Nepal time
    public int DurationMins { get; set; }
    public int Fare { get; set; }
    public bool Active { get; set; } = true;
}

public class Coupon
{
    public int Id { get; set; }
    public string Code { get; set; } = "";
    public string Description { get; set; } = "";
    public string Type { get; set; } = "percent";    // percent | flat
    public int Value { get; set; }
    public int MaxDiscount { get; set; }
    public int MinAmount { get; set; }
    public bool Active { get; set; } = true;
    public bool RoundTripOnly { get; set; }
}

public class Booking
{
    public string Id { get; set; } = "";
    public string? UserId { get; set; }
    public string Status { get; set; } = "confirmed"; // confirmed | cancelled
    public string CreatedAt { get; set; } = "";
    public string TripType { get; set; } = "oneway";
    public string Phone { get; set; } = "";
    public string Email { get; set; } = "";
    public List<Passenger> Passengers { get; set; } = new();
    public List<BookingLeg> Legs { get; set; } = new();
    public Fare Fare { get; set; } = new();
    public Payment Payment { get; set; } = new();
    public string? CancelledAt { get; set; }
    public StoredRefund? Refund { get; set; }
    [JsonIgnore] public long Seq { get; set; }                     // insertion order (the original keeps an array)
}

public class Passenger
{
    public string Name { get; set; } = "";
    public int Age { get; set; }
    public string Gender { get; set; } = "";
}

public class Point
{
    public string Name { get; set; } = "";
    public string Time { get; set; } = "";
}

public class LegSnapshot
{
    public string From { get; set; } = "";
    public string To { get; set; } = "";
    public string Departure { get; set; } = "";
    public string Arrival { get; set; } = "";
    public int DurationMins { get; set; }
    public string Operator { get; set; } = "";
    public string BusNo { get; set; } = "";
    public string BusType { get; set; } = "";
}

public class BookingLeg
{
    public int ScheduleId { get; set; }
    public string Date { get; set; } = "";
    public List<string> Seats { get; set; } = new();
    public List<int> SeatPrices { get; set; } = new();
    public int Subtotal { get; set; }
    public Point Boarding { get; set; } = new();
    public Point Dropping { get; set; } = new();
    public LegSnapshot Snapshot { get; set; } = new();
}

public class Fare
{
    public int Base { get; set; }
    public int Discount { get; set; }
    public string? Coupon { get; set; }
    public int Tax { get; set; }
    public int Service { get; set; }
    public int Total { get; set; }
}

public class Payment
{
    public string Method { get; set; } = "";
    public string Ref { get; set; } = "";
    public string PaidAt { get; set; } = "";
}

public class StoredRefund
{
    public int Percent { get; set; }
    public int Amount { get; set; }
    public string By { get; set; } = "";
}

public class User
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
    public string Phone { get; set; } = "";
    [JsonIgnore] public string PasswordHash { get; set; } = "";
    public string CreatedAt { get; set; } = "";
}

public class Session
{
    public string Token { get; set; } = "";
    public string UserId { get; set; } = "";
    public long Expires { get; set; }                 // unix ms
}

public class Subscriber
{
    public int Id { get; set; }
    public string Email { get; set; } = "";
    public string At { get; set; } = "";
}
