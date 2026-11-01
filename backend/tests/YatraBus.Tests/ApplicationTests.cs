using Microsoft.EntityFrameworkCore;
using YatraBus.Application.Admin;
using YatraBus.Application.Auth;
using YatraBus.Application.Bookings;
using YatraBus.Application.Pricing;
using YatraBus.Application.Seats;
using YatraBus.Application.Trips;
using YatraBus.Domain.Bookings;
using YatraBus.Infrastructure.Persistence;
using YatraBus.Infrastructure.Security;

namespace YatraBus.Tests;

public class AuthServiceTests : IDisposable
{
    private readonly TestDb t = new();
    private AuthService Svc => new(t.Db, t.Hasher, new ProfileValidator(t.Db), t.Clock);
    private static SignupRequest Sita => new() { Name = "Sita Thapa", Email = "Sita@Example.com", Phone = "9841234567", Password = "Namaste2026", Confirm = "Namaste2026" };

    [Fact]
    public async Task Signup_normalises_email_hashes_password_and_signs_in()
    {
        var o = await Svc.Signup(Sita);
        Assert.Equal(201, o.Result.Status); Assert.NotNull(o.SignIn);
        Assert.Equal("sita@example.com", o.SignIn!.Email);
        Assert.StartsWith("pbkdf2-sha512$", o.SignIn.PasswordHash);
    }

    [Fact]
    public async Task Signup_rejects_duplicates_and_weak_passwords_with_field()
    {
        await Svc.Signup(Sita);
        var dup = await Svc.Signup(Sita);
        Assert.Equal(("An account with this email already exists", "email"), (dup.Result.Error, dup.Result.Field));
        var weak = await Svc.Signup(new SignupRequest { Name = "Ram", Email = "ram@x.com", Phone = "9812345678", Password = "abcdefgh", Confirm = "abcdefgh" });
        Assert.Equal(("Password must include letters and numbers", "password"), (weak.Result.Error, weak.Result.Field));
        var phone = await Svc.Signup(new SignupRequest { Name = "Ram", Email = "ram@x.com", Phone = "1234", Password = "abc12345", Confirm = "abc12345" });
        Assert.Equal("phone", phone.Result.Field);
    }

    [Fact]
    public async Task Login_by_email_or_phone()
    {
        await Svc.Signup(Sita);
        Assert.NotNull((await Svc.Login(new LoginRequest { Email = "SITA@example.com", Password = "Namaste2026" })).SignIn);
        Assert.NotNull((await Svc.Login(new LoginRequest { Email = "9841234567", Password = "Namaste2026" })).SignIn);
        Assert.Equal(401, (await Svc.Login(new LoginRequest { Email = "9841234567", Password = "nope" })).Result.Status);
    }

    [Fact]
    public async Task Change_password_requires_current_one()
    {
        var u = (await Svc.Signup(Sita)).SignIn!;
        Assert.Equal("current", (await Svc.ChangePassword(u, new PasswordRequest { Current = "bad", Password = "New12345", Confirm = "New12345" })).Field);
        Assert.False((await Svc.ChangePassword(u, new PasswordRequest { Current = "Namaste2026", Password = "New12345", Confirm = "New12345" })).IsError);
        Assert.True(t.Hasher.Verify("New12345", u.PasswordHash));
    }

    [Fact]
    public async Task Sessions_expire()
    {
        var u = (await Svc.Signup(Sita)).SignIn!;
        var sessions = new SessionService(t.Db, t.Clock, t.Options);
        var token = await sessions.Start(u);
        Assert.Equal(u.Id, (await sessions.Resolve(token))!.Id);
        t.Clock.Now = t.Clock.Now.AddDays(31);
        Assert.Null(await sessions.Resolve(token));
    }

    public void Dispose() => t.Dispose();
}

public class BookingFlowTests : IDisposable
{
    private readonly TestDb t = new();
    private TripProjector Trips => new(t.Db, t.Holds);
    private HoldService Holds => new(t.Db, t.Holds, Trips, t.Clock, t.Options);
    private BookingService Bookings => new(t.Db, t.Holds, new PricingService(t.Db), Trips, t.Clock);

    private async Task<string> Hold(int sched, string date, params string[] seats)
    {
        var r = await Holds.Hold(new HoldRequest { ScheduleId = sched, Date = date, Seats = seats.ToList() });
        Assert.Equal(201, r.Status);
        return (string)r.Value!.GetType().GetProperty("holdId")!.GetValue(r.Value)!;
    }

    [Fact]
    public async Task Held_seats_cannot_be_held_again_and_holds_are_required_to_book()
    {
        var date = TestDb.Day(5);
        await Hold(1, date, "A1");
        var clash = await Holds.Hold(new HoldRequest { ScheduleId = 1, Date = date, Seats = ["A1", "A2"] });
        Assert.Equal(409, clash.Status);
        var noHold = await Bookings.Create(new BookingRequest { Phone = "9841234567", Legs = [new LegInput { ScheduleId = 1, Date = date, Seats = ["A2"], HoldId = "nope" }], Passengers = [new() { Name = "A", Age = 30, Gender = "M" }] }, null);
        Assert.Equal(410, noHold.Status);
    }

    [Fact]
    public async Task Max_six_seats_and_departed_buses()
    {
        Assert.Equal("Maximum 6 seats per booking", (await Holds.Hold(new HoldRequest { ScheduleId = 1, Date = TestDb.Day(5), Seats = ["A1", "A2", "A3", "A4", "B1", "B2", "B3"] })).Error);
        Assert.Equal("This bus has already departed", (await Holds.Hold(new HoldRequest { ScheduleId = 1, Date = TestDb.Day(-2), Seats = ["A1"] })).Error);
    }

    [Fact]
    public async Task Booking_prices_with_coupon_releases_hold_and_can_be_cancelled_with_refund()
    {
        var date = TestDb.Day(5);
        var hold = await Hold(1, date, "A1", "A2");
        var r = await Bookings.Create(new BookingRequest
        {
            Phone = "9852222222", Coupon = "yatra10", Payment = "Khalti",
            Legs = [new LegInput { ScheduleId = 1, Date = date, Seats = ["A1", "A2"], HoldId = hold }],
            Passengers = [new() { Name = "Hari", Age = 40, Gender = "M" }, new() { Name = "Gita", Age = 38, Gender = "F" }],
        }, null);
        Assert.Equal(201, r.Status);
        var b = Assert.IsType<YatraBus.Domain.Entities.Booking>(r.Value);
        Assert.Equal("YATRA10", b.Fare.Coupon); Assert.True(b.Fare.Discount > 0); Assert.Equal(50, b.Fare.Service);
        Assert.Equal(b.Fare.Base - b.Fare.Discount + b.Fare.Tax + b.Fare.Service, b.Fare.Total);
        Assert.Equal("Khalti (DEMO)", b.Payment.Method);
        Assert.Null(t.Holds.Get(hold));

        var trip = await Trips.Occupied(1, date);
        Assert.Contains("A1", trip.Booked);

        Assert.Equal(404, (await Bookings.CancelByCustomer(b.Id, new CancelRequest { Phone = "9800000000" })).Status);
        var c = await Bookings.CancelByCustomer(b.Id, new CancelRequest { Phone = "9852222222" });
        Assert.False(c.IsError); Assert.Equal(90, b.Refund!.Percent);

        var looked = (List<BookingView>)(await Bookings.Lookup(b.Id.ToLowerInvariant(), null)).Value!;
        Assert.Single(looked); Assert.Equal(BookingStatus.Cancelled, looked[0].Status); Assert.False(looked[0].Refund.Allowed);
    }

    [Fact]
    public async Task Admin_csv_has_bom_crlf_and_one_row_per_leg()
    {
        var date = TestDb.Day(5);
        var h1 = await Hold(1, date, "A1"); var h2 = await Hold(2, TestDb.Day(8), "A1");
        await Bookings.Create(new BookingRequest { Phone = "9852222222", Legs = [new LegInput { ScheduleId = 1, Date = date, Seats = ["A1"], HoldId = h1 }, new LegInput { ScheduleId = 2, Date = TestDb.Day(8), Seats = ["A1"], HoldId = h2 }], Passengers = [new() { Name = "Hari, Jr", Age = 40, Gender = "O" }] }, null);
        var list = await new AdminBookingsService(t.Db, t.Clock).Search(null, null, null);
        var csv = System.Text.Encoding.UTF8.GetString(AdminBookingsService.Csv(list, DateTime.UtcNow).Content);
        Assert.StartsWith("\uFEFFTicket ID,", csv);
        var lines = csv.Split("\r\n"); Assert.Equal(3, lines.Length);
        Assert.Contains("\"Hari, Jr (40O)\"", lines[1]); Assert.Contains(",return,", lines[2]);
    }

    [Fact]
    public async Task Catalog_coerces_like_the_original_and_protects_references()
    {
        var cat = new CatalogService(t.Db);
        var created = await cat.Create("coupons", System.Text.Json.Nodes.JsonNode.Parse("""{"code":"tihar200","type":"flat","value":"200","active":"on"}""")!.AsObject());
        var c = Assert.IsType<YatraBus.Domain.Entities.Coupon>(created.Value);
        Assert.Equal(("TIHAR200", 200, true), (c.Code, c.Value, c.Active));
        Assert.Equal("Coupon code already exists", (await cat.Create("coupons", System.Text.Json.Nodes.JsonNode.Parse("""{"code":"TIHAR200"}""")!.AsObject())).Error);
        Assert.Equal("In use — remove dependent schedules/buses first", (await cat.Delete("routes", "1")).Error);
        Assert.Equal(404, (await cat.Delete("nope", "1")).Status);
    }

    [Fact]
    public async Task Reset_restores_catalogue_and_keeps_users()
    {
        t.Db.Users.Add(new YatraBus.Domain.Entities.User { Id = "U1", Email = "a@b.co", Phone = "9800000001" });
        t.Db.Coupons.RemoveRange(t.Db.Coupons); await t.Db.SaveChangesAsync();
        new AdminService(t.Db, new InMemoryAdminTokenStore(), t.Holds, new DataSeeder(t.Db), t.Options).Reset();
        Assert.Equal(4, await t.Db.Coupons.CountAsync()); Assert.Equal(1, await t.Db.Users.CountAsync());
    }

    [Fact]
    public void Admin_login_uses_configured_password()
    {
        var a = new AdminService(t.Db, new InMemoryAdminTokenStore(), t.Holds, new DataSeeder(t.Db), new() { AdminPassword = "s3cret" });
        Assert.Equal(401, a.Login(new AdminLoginRequest { Password = "admin" }).Status);
        var ok = a.Login(new AdminLoginRequest { Password = "s3cret" });
        Assert.True(a.IsAuthorized((string)ok.Value!.GetType().GetProperty("token")!.GetValue(ok.Value)!));
    }

    public void Dispose() => t.Dispose();
}
