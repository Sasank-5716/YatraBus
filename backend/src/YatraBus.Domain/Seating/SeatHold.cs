namespace YatraBus.Domain.Seating;

/// <summary>A temporary lock on seats of one trip/date while the customer checks out.</summary>
public record SeatHold(int ScheduleId, string Date, List<string> Seats, long Expires)
{
    public const int MaxSeats = 6;
    public bool IsExpired(long nowMs) => Expires < nowMs;

    /// <summary>True when this hold still covers exactly the given trip, date and seats.</summary>
    public bool Covers(int scheduleId, string? date, IEnumerable<string> seats) =>
        ScheduleId == scheduleId && Date == date && seats.All(Seats.Contains);

    /// <summary>Seats from the request that are already booked or held by someone else.</summary>
    public static List<string> Clashes(IEnumerable<string> wanted, ICollection<string> booked, ICollection<string> held) =>
        wanted.Where(x => booked.Contains(x) || held.Contains(x)).ToList();
}
