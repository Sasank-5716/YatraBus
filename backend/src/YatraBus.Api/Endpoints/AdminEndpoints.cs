using YatraBus.Api.Http;
using YatraBus.Application.Admin;

namespace YatraBus.Api.Endpoints;

public static class AdminEndpoints
{
    public static void MapAdmin(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/admin/login", async (HttpContext ctx, AdminService a) => ApiResult.From(a.Login(await ApiResult.Body<AdminLoginRequest>(ctx.Request)))).WithTags("Admin");

        var g = app.MapGroup("/api/admin").WithTags("Admin").AddEndpointFilter<AdminOnly>();
        g.MapGet("/data", async (AdminService a) => ApiResult.From(await a.Data()));
        g.MapPost("/reset", (AdminService a) => ApiResult.From(a.Reset()));
        g.MapGet("/stats", async (AdminStatsService s) => ApiResult.From(await s.Get()));
        g.MapGet("/bookings", async (string? q, string? status, string? date, string? format, AdminBookingsService b, HttpContext ctx) => ApiResult.From(await b.List(q, status, date, format), ctx));
        g.MapPost("/bookings/{id}/cancel", async (string id, AdminBookingsService b) => ApiResult.From(await b.Cancel(id)));
        g.MapGet("/occupancy", async (int? scheduleId, string? date, OccupancyService o) => ApiResult.From(await o.Get(scheduleId, date)));
        g.MapPost("/{coll}", async (string coll, HttpContext ctx, CatalogService c) => ApiResult.From(await c.Create(coll, await ApiResult.BodyObject(ctx.Request))));
        g.MapPut("/{coll}/{id}", async (string coll, string id, HttpContext ctx, CatalogService c) => ApiResult.From(await c.Update(coll, id, await ApiResult.BodyObject(ctx.Request))));
        g.MapDelete("/{coll}/{id}", async (string coll, string id, CatalogService c) => ApiResult.From(await c.Delete(coll, id)));
    }
}
