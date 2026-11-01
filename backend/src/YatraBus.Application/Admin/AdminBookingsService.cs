using System.Text;
using Microsoft.EntityFrameworkCore;
using YatraBus.Application.Abstractions;
using YatraBus.Application.Common;
using YatraBus.Domain.Bookings;
using YatraBus.Domain.Entities;

namespace YatraBus.Application.Admin;

/// <summary>Operator booking list/search, CSV export (one row per leg) and full-refund cancellation.</summary>
public class AdminBookingsService(IAppDbContext db, IClock clock)
{
    private static string Cell(object? v)
    {
        var s = v?.ToString() ?? "";
        return s.IndexOfAny(['"', ',', '\n']) >= 0 ? "\"" + s.Replace("\"", "\"\"") + "\"" : s;
    }

    public async Task<List<Booking>> Search(string? q, string? status, string? date)
    {
        var s = (q ?? "").ToLowerInvariant();
        var list = (await db.Bookings.AsNoTracking().OrderByDescending(b => b.Seq).ToListAsync())
            .Where(b => (string.IsNullOrEmpty(status) || b.Status == status) && (string.IsNullOrEmpty(date) || b.Legs.Any(l => l.Date == date)) &&
                (s == "" || string.Join(' ', new[] { b.Id, b.Phone, b.Email }.Concat(b.Passengers.Select(x => x.Name)).Concat(b.Legs.Select(l => l.Snapshot.From + " " + l.Snapshot.To + " " + l.Snapshot.Operator))).ToLowerInvariant().Contains(s)))
            .ToList();
        return list;
    }

    public async Task<AppResult> List(string? q, string? status, string? date, string? format)
    {
        var list = await Search(q, status, date);
        if (format != "csv") return AppResult.Ok(list);
        return AppResult.Ok(Csv(list, clock.UtcNow.UtcDateTime));
    }

    public static FileResult Csv(List<Booking> list, DateTime today)
    {
        var rows = new List<object?[]> { new object?[] { "Ticket ID", "Status", "Booked at", "Trip type", "Travel date", "Route", "Departure", "Operator", "Bus", "Seats", "Passengers", "Phone", "Email", "Base", "Discount", "Coupon", "Tax", "Service", "Total", "Payment", "Refund" } };
        foreach (var b in list)
            for (var i = 0; i < b.Legs.Count; i++)
            {
                var l = b.Legs[i]; var first = i == 0;
                rows.Add([b.Id, b.Status, b.CreatedAt, first ? b.TripType : "return", l.Date, $"{l.Snapshot.From}-{l.Snapshot.To}", l.Snapshot.Departure, l.Snapshot.Operator, l.Snapshot.BusNo, string.Join(' ', l.Seats),
                    string.Join("; ", b.Passengers.Select(x => $"{x.Name} ({x.Age}{x.Gender})")), b.Phone, b.Email,
                    first ? b.Fare.Base : "", first ? b.Fare.Discount : "", first ? b.Fare.Coupon ?? "" : "", first ? b.Fare.Tax : "", first ? b.Fare.Service : "", first ? b.Fare.Total : "",
                    b.Payment.Method, first && (b.Refund?.Amount ?? 0) != 0 ? b.Refund!.Amount : ""]);
            }
        var csv = "\uFEFF" + string.Join("\r\n", rows.Select(r => string.Join(',', r.Select(Cell))));
        return new FileResult($"yatra-bookings-{today:yyyy-MM-dd}.csv", "text/csv; charset=utf-8", Encoding.UTF8.GetBytes(csv));
    }

    public async Task<AppResult> Cancel(string id)
    {
        var b = await db.Bookings.FirstOrDefaultAsync(x => x.Id == id);
        if (b == null) return AppResult.Fail(404, "Not found");
        var err = RefundPolicy.CancelByOperator(b, clock.IsoNow);
        if (err != null) return AppResult.Fail(400, err);
        await db.SaveChangesAsync();
        return AppResult.Ok(b);
    }
}
