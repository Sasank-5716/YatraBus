using System.Globalization;
using System.Reflection;
using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.EntityFrameworkCore;
using YatraBus.Application.Abstractions;
using YatraBus.Application.Common;
using YatraBus.Domain.Entities;

namespace YatraBus.Application.Admin;

/// <summary>Generic create/update/delete for routes, buses, schedules, operators and coupons.</summary>
public class CatalogService(IAppDbContext db)
{
    // field -> type: s = string, n = number, b = boolean, a = string list (same map as the original server)
    private static readonly Dictionary<string, Dictionary<string, char>> Fields = new()
    {
        ["routes"] = new() { ["from"] = 's', ["to"] = 's', ["km"] = 'n', ["baseFare"] = 'n', ["durationMins"] = 'n' },
        ["buses"] = new() { ["operatorId"] = 'n', ["number"] = 's', ["type"] = 's', ["layout"] = 's', ["ac"] = 'b', ["amenities"] = 'a' },
        ["schedules"] = new() { ["routeId"] = 'n', ["busId"] = 'n', ["departure"] = 's', ["durationMins"] = 'n', ["fare"] = 'n', ["active"] = 'b' },
        ["operators"] = new() { ["name"] = 's', ["rating"] = 'n', ["reviews"] = 'n' },
        ["coupons"] = new() { ["code"] = 's', ["description"] = 's', ["type"] = 's', ["value"] = 'n', ["maxDiscount"] = 'n', ["minAmount"] = 'n', ["active"] = 'b', ["roundTripOnly"] = 'b' },
    };

    private static readonly Dictionary<string, Type> Types = new()
    {
        ["routes"] = typeof(BusRoute), ["buses"] = typeof(Bus), ["schedules"] = typeof(Schedule), ["operators"] = typeof(Operator), ["coupons"] = typeof(Coupon),
    };

    private static string Str(JsonNode? v) => v switch
    {
        null => "null",
        JsonValue jv when jv.TryGetValue<string>(out var s) => s,
        JsonValue jv when jv.TryGetValue<bool>(out var b) => b ? "true" : "false",
        _ => v.ToJsonString(),
    };

    // JavaScript Number(v) || 0
    private static double Num(JsonNode? v)
    {
        if (v is JsonValue jv)
        {
            if (jv.TryGetValue<double>(out var d)) return double.IsFinite(d) ? d : 0;
            if (jv.TryGetValue<bool>(out var b)) return b ? 1 : 0;
            if (jv.TryGetValue<string>(out var s))
                return string.IsNullOrWhiteSpace(s) ? 0 : double.TryParse(s.Trim(), NumberStyles.Float, CultureInfo.InvariantCulture, out var p) && double.IsFinite(p) ? p : 0;
        }
        return 0;
    }

    private static bool Bool(JsonNode? v) => v is JsonValue jv &&
        ((jv.TryGetValue<bool>(out var b) && b) || (jv.TryGetValue<string>(out var s) && (s == "true" || s == "on")));

    private static List<string> List(JsonNode? v) => v is JsonArray arr
        ? arr.Select(Str).ToList()
        : Str(v).Split(',').Select(x => x.Trim()).Where(x => x != "").ToList();

    /// <summary>Copy the allowed, type-coerced fields from the request body onto the entity.</summary>
    private static void Apply(string coll, object entity, JsonObject d)
    {
        foreach (var (key, t) in Fields[coll])
        {
            if (!d.ContainsKey(key)) continue;
            var prop = entity.GetType().GetProperty(char.ToUpperInvariant(key[0]) + key[1..], BindingFlags.Public | BindingFlags.Instance)!;
            var v = d[key];
            object value = t switch
            {
                'n' when prop.PropertyType == typeof(double) => Num(v),
                'n' => (int)Math.Round(Num(v), MidpointRounding.AwayFromZero),
                'b' => Bool(v),
                'a' => List(v),
                _ => Str(v).Trim(),
            };
            if (coll == "coupons" && key == "code") value = ((string)value).ToUpperInvariant();
            prop.SetValue(entity, value);
        }
    }

    private IQueryable<object> Set(string coll) => coll switch
    {
        "routes" => db.Routes, "buses" => db.Buses, "schedules" => db.Schedules, "operators" => db.Operators, _ => db.Coupons,
    };

    private static int IdOf(object e) => (int)e.GetType().GetProperty("Id")!.GetValue(e)!;

    public async Task<AppResult> Create(string coll, JsonObject d)
    {
        if (!Fields.ContainsKey(coll)) return AppResult.Fail(404, "Unknown collection");
        var item = Activator.CreateInstance(Types[coll])!;
        Apply(coll, item, d);
        if (item is Coupon c && await db.Coupons.AnyAsync(x => x.Code == c.Code)) return AppResult.Fail(400, "Coupon code already exists");
        var all = await Set(coll).ToListAsync();
        item.GetType().GetProperty("Id")!.SetValue(item, all.Count == 0 ? 1 : all.Max(IdOf) + 1);
        db.AddEntity(item);
        await db.SaveChangesAsync();
        return AppResult.Ok(item, 201);
    }

    public async Task<AppResult> Update(string coll, string id, JsonObject d)
    {
        if (!Fields.ContainsKey(coll)) return AppResult.Fail(404, "Unknown collection");
        var item = int.TryParse(id, out var n) ? await db.FindEntityAsync(Types[coll], n) : null;
        if (item == null) return AppResult.Fail(404, "Not found");
        Apply(coll, item, d);
        await db.SaveChangesAsync();
        return AppResult.Ok(item);
    }

    public async Task<AppResult> Delete(string coll, string id)
    {
        if (!Fields.ContainsKey(coll)) return AppResult.Fail(404, "Unknown collection");
        var item = int.TryParse(id, out var n) ? await db.FindEntityAsync(Types[coll], n) : null;
        if (item == null) return AppResult.Fail(404, "Not found");
        var inUse = coll switch
        {
            "routes" => await db.Schedules.AnyAsync(x => x.RouteId == n),
            "buses" => await db.Schedules.AnyAsync(x => x.BusId == n),
            "operators" => await db.Buses.AnyAsync(x => x.OperatorId == n),
            _ => false,
        };
        if (inUse) return AppResult.Fail(400, "In use — remove dependent schedules/buses first");
        db.RemoveEntity(item);
        await db.SaveChangesAsync();
        return AppResult.Ok(new { ok = true });
    }
}
