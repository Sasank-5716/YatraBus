using Microsoft.EntityFrameworkCore;
using YatraBus.Application.Abstractions;
using YatraBus.Domain.Common;
using YatraBus.Domain.Entities;

namespace YatraBus.Infrastructure.Persistence;

/// <summary>Seed data — identical to the original Node demo (fictional operators).</summary>
public static class SeedData
{
    private record BusType(string Type, string Layout, bool Ac, double Mult, string[] Amenities);

    public static (List<Operator>, List<Bus>, List<BusRoute>, List<Schedule>, List<Coupon>) Build()
    {
        var operators = new (string, double, int)[]
        {
            ("Himalayan Sapana Travels", 4.6, 1284), ("Gandaki Swift Yatayat", 4.3, 862), ("Terai Express Deluxe", 4.1, 640),
            ("Everest Comfort Lines", 4.8, 2031), ("Mithila Rath Sewa", 3.9, 417), ("Lumbini Star Coaches", 4.4, 958),
        }.Select((o, i) => new Operator { Id = i + 1, Name = o.Item1, Rating = o.Item2, Reviews = o.Item3 }).ToList();

        var T = new BusType[]
        {
            new("AC Deluxe", "seater", true, 1, ["wifi", "charging", "water"]),
            new("Tourist Sofa (AC)", "sofa", true, 1.35, ["wifi", "charging", "water", "blanket"]),
            new("Micro Hiace", "micro", true, 0.95, ["charging"]),
            new("AC Sleeper", "sleeper", true, 1.6, ["wifi", "charging", "water", "blanket"]),
            new("Deluxe (Non-AC)", "seater", false, 0.8, ["water"]),
        };
        var buses = new List<Bus>();
        for (var i = 0; i < operators.Count; i++)
            for (var k = 0; k < 2; k++)
            {
                var t = T[(i * 2 + k) % T.Length];
                buses.Add(new Bus
                {
                    Id = buses.Count + 1, OperatorId = operators[i].Id, Number = $"Ba {i + 1} Kha {1100 + buses.Count * 173}",
                    Type = t.Type, Layout = t.Layout, Ac = t.Ac, Amenities = t.Amenities.ToList(), FareMult = t.Mult,
                });
            }

        var R = new (string, string, int, int, int)[]
        {
            ("Kathmandu", "Pokhara", 200, 1100, 420), ("Kathmandu", "Chitwan", 160, 800, 330), ("Kathmandu", "Butwal", 260, 1200, 480),
            ("Kathmandu", "Biratnagar", 400, 1800, 660), ("Kathmandu", "Janakpur", 225, 1300, 450), ("Pokhara", "Chitwan", 125, 700, 270),
            ("Pokhara", "Butwal", 160, 800, 330), ("Chitwan", "Butwal", 115, 600, 210), ("Biratnagar", "Janakpur", 180, 900, 330),
        };
        var routes = new List<BusRoute>();
        foreach (var (a, b, km, f, m) in R)
        {
            routes.Add(new BusRoute { Id = routes.Count + 1, From = a, To = b, Km = km, BaseFare = f, DurationMins = m });
            routes.Add(new BusRoute { Id = routes.Count + 1, From = b, To = a, Km = km, BaseFare = f, DurationMins = m });
        }

        string[] times = ["05:45", "06:30", "07:15", "08:00", "10:30", "13:00", "17:00", "19:00", "20:30"];
        var schedules = new List<Schedule>();
        for (var ri = 0; ri < routes.Count; ri++)
        {
            var r = routes[ri];
            for (var k = 0; k < 5; k++)
            {
                var bus = buses[(ri * 5 + k) % buses.Count];
                var dep = times[(ri + k * 2) % times.Length];
                if (bus.Layout == "sleeper") dep = new[] { "19:00", "20:30" }[k % 2];
                var factor = bus.Layout == "micro" ? 0.9 : bus.Layout == "sleeper" ? 1.1 : 1;
                var dur = Js.Round(r.DurationMins * factor / 15) * 15;
                schedules.Add(new Schedule
                {
                    Id = schedules.Count + 1, RouteId = r.Id, BusId = bus.Id, Departure = dep, DurationMins = dur,
                    Fare = Js.Round(r.BaseFare * (bus.FareMult ?? 1) / 50) * 50, Active = true,
                });
            }
        }

        var coupons = new List<Coupon>
        {
            new() { Id = 1, Code = "YATRA10", Description = "10% off any trip (max Rs. 300)", Type = "percent", Value = 10, MaxDiscount = 300, MinAmount = 0, Active = true },
            new() { Id = 2, Code = "DASHAIN500", Description = "Rs. 500 off on bookings above Rs. 3,000", Type = "flat", Value = 500, MaxDiscount = 500, MinAmount = 3000, Active = true },
            new() { Id = 3, Code = "FIRST100", Description = "Rs. 100 off your first ride", Type = "flat", Value = 100, MaxDiscount = 100, MinAmount = 500, Active = true },
            new() { Id = 4, Code = "ROUND15", Description = "15% off round trips (max Rs. 600)", Type = "percent", Value = 15, MaxDiscount = 600, MinAmount = 1500, Active = true, RoundTripOnly = true },
        };
        return (operators, buses, routes, schedules, coupons);
    }

    /// <summary>Create the database on first run and fill the catalogue.</summary>
    public static void EnsureSeeded(AppDbContext db)
    {
        db.Database.EnsureCreated();
        if (!db.Operators.Any()) Reseed(db, keepUsers: true);
    }

    /// <summary>Restore the original catalogue and delete bookings/subscribers. Users and sessions are kept (same as the Node demo).</summary>
    public static void Reseed(AppDbContext db, bool keepUsers)
    {
        db.Bookings.ExecuteDelete();
        db.Subscribers.ExecuteDelete();
        db.Schedules.ExecuteDelete();
        db.Buses.ExecuteDelete();
        db.Routes.ExecuteDelete();
        db.Operators.ExecuteDelete();
        db.Coupons.ExecuteDelete();
        if (!keepUsers) { db.Sessions.ExecuteDelete(); db.Users.ExecuteDelete(); }
        var (ops, buses, routes, schedules, coupons) = Build();
        db.Operators.AddRange(ops); db.Buses.AddRange(buses); db.Routes.AddRange(routes);
        db.Schedules.AddRange(schedules); db.Coupons.AddRange(coupons);
        db.SaveChanges();
        db.ChangeTracker.Clear();
    }
}

/// <summary>IDataSeeder over the EF context.</summary>
public class DataSeeder(AppDbContext db) : IDataSeeder
{
    public void EnsureSeeded() => SeedData.EnsureSeeded(db);
    public void Reseed(bool keepUsers) => SeedData.Reseed(db, keepUsers);
}
