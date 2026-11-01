using YatraBus.Api.Http;
using YatraBus.Application.Auth;
using YatraBus.Application.Bookings;
using YatraBus.Application.Newsletter;
using YatraBus.Application.Pricing;
using YatraBus.Application.Search;
using YatraBus.Application.Seats;
using YatraBus.Application.Trips;

namespace YatraBus.Api.Endpoints;

/// <summary>Thin HTTP adapters: read the request, call a use case, map the result.</summary>
public static class PublicEndpoints
{
    public static void MapAuth(this IEndpointRouteBuilder app)
    {
        var auth = app.MapGroup("/api/auth").WithTags("Auth");
        auth.MapGet("/me", async (HttpContext ctx, CookieSession s) => ApiResult.Ok(new { user = PublicUser.From(await s.CurrentUser(ctx)) }));
        auth.MapPost("/signup", async (HttpContext ctx, AuthService auth, CookieSession s) =>
        {
            var o = await auth.Signup(await ApiResult.Body<SignupRequest>(ctx.Request));
            if (o.SignIn != null) await s.SignIn(ctx, o.SignIn);
            return ApiResult.From(o.Result);
        });
        auth.MapPost("/login", async (HttpContext ctx, AuthService auth, CookieSession s) =>
        {
            var o = await auth.Login(await ApiResult.Body<LoginRequest>(ctx.Request));
            if (o.SignIn != null) await s.SignIn(ctx, o.SignIn);
            return ApiResult.From(o.Result);
        });
        auth.MapPost("/logout", async (HttpContext ctx, CookieSession s) => { await s.SignOut(ctx); return ApiResult.Ok(new { ok = true }); });

        var account = app.MapGroup("/api/account").WithTags("Account");
        account.MapPut("", async (HttpContext ctx, AuthService auth, CookieSession s) =>
            ApiResult.From(await auth.UpdateProfile(await s.CurrentUser(ctx), await ApiResult.Body<ProfileRequest>(ctx.Request))));
        account.MapPost("/password", async (HttpContext ctx, AuthService auth, CookieSession s) =>
        {
            var me = await s.CurrentUser(ctx);
            var r = await auth.ChangePassword(me, await ApiResult.Body<PasswordRequest>(ctx.Request));
            if (!r.IsError) await s.RevokeOthers(ctx, me!.Id);
            return ApiResult.From(r);
        });
        account.MapGet("/bookings", async (HttpContext ctx, AuthService auth, CookieSession s) => ApiResult.From(await auth.MyBookings(await s.CurrentUser(ctx))));
    }

    public static void MapCatalogue(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/meta", async (MetaService m) => ApiResult.From(await m.Get())).WithTags("Search");
        app.MapGet("/api/search", async (string? from, string? to, string? date, TripService t) => ApiResult.From(await t.Search(from, to, date))).WithTags("Search");
        app.MapGet("/api/trip/{id:int}", async (int id, string? date, string? hold, TripService t) => ApiResult.From(await t.Detail(id, date, hold))).WithTags("Trips");
        app.MapPost("/api/hold", async (HttpContext ctx, HoldService h) => ApiResult.From(await h.Hold(await ApiResult.Body<HoldRequest>(ctx.Request)))).WithTags("Seats");
        app.MapDelete("/api/hold/{id}", (string id, HoldService h) => ApiResult.From(h.Release(id))).WithTags("Seats");
        app.MapPost("/api/quote", async (HttpContext ctx, PricingService p) =>
        {
            var d = await ApiResult.Body<QuoteRequest>(ctx.Request);
            var legs = d.Legs ?? new();
            try { return ApiResult.Ok(await p.Calculate(legs, d.Coupon, legs.Count > 1)); }
            catch (QuoteException e) { return ApiResult.Error(400, e.Message); }
        }).WithTags("Coupons");
        app.MapPost("/api/newsletter", async (HttpContext ctx, NewsletterService n) => ApiResult.From(await n.Subscribe(await ApiResult.Body<SubscribeRequest>(ctx.Request)))).WithTags("Newsletter");
    }

    public static void MapBookings(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api").WithTags("Bookings");
        g.MapPost("/bookings", async (HttpContext ctx, BookingService b, CookieSession s) =>
            ApiResult.From(await b.Create(await ApiResult.Body<BookingRequest>(ctx.Request), await s.CurrentUser(ctx))));
        g.MapGet("/lookup", async (string? id, string? phone, BookingService b) => ApiResult.From(await b.Lookup(id, phone)));
        g.MapPost("/bookings/{id}/cancel", async (string id, HttpContext ctx, BookingService b) =>
            ApiResult.From(await b.CancelByCustomer(id, await ApiResult.Body<CancelRequest>(ctx.Request))));
    }
}
