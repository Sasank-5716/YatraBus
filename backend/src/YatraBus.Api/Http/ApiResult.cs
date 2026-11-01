using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.Json.Serialization;

using YatraBus.Application.Common;

namespace YatraBus.Api.Http;

/// <summary>Response helpers that keep the original API contract: JSON bodies, { error, field? } on failure, no caching.</summary>
public static class ApiResult
{
    public static readonly JsonSerializerOptions JsonOpts = Configure(new JsonSerializerOptions(JsonSerializerDefaults.Web));

    public static JsonSerializerOptions Configure(JsonSerializerOptions o)
    {
        o.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        o.NumberHandling = JsonNumberHandling.AllowReadingFromString;
        o.DefaultIgnoreCondition = JsonIgnoreCondition.Never;
        o.Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping;
        return o;
    }

    /// <summary>Map a use-case result to HTTP (JSON payload, { error, field? }, or a file download).</summary>
    public static IResult From(AppResult r, HttpContext? ctx = null)
    {
        if (r.IsError) return Error(r.Status, r.Error!, r.Field);
        if (r.Value is FileResult f)
        {
            if (ctx != null) ctx.Response.Headers.ContentDisposition = $"attachment; filename=\"{f.FileName}\"";
            return Results.Bytes(f.Content, f.ContentType);
        }
        return Ok(r.Value, r.Status);
    }

    public static IResult Ok(object? value, int status = 200) => Results.Json(value, JsonOpts, statusCode: status);
    public static IResult Error(int status, string error, string? field = null) =>
        Results.Json(field == null ? new { error } : (object)new { error, field }, JsonOpts, statusCode: status);

    /// <summary>Lenient body reader: invalid or missing JSON becomes an empty object (as in the original readBody()).</summary>
    public static async Task<T> Body<T>(HttpRequest req) where T : new()
    {
        try
        {
            if (req.ContentLength == 0) return new T();
            return await JsonSerializer.DeserializeAsync<T>(req.Body, JsonOpts) ?? new T();
        }
        catch (JsonException) { return new T(); }
        catch (NotSupportedException) { return new T(); }
    }

    public static async Task<JsonObject> BodyObject(HttpRequest req)
    {
        try { return (await JsonNode.ParseAsync(req.Body)) as JsonObject ?? new JsonObject(); }
        catch (JsonException) { return new JsonObject(); }
    }

    /// <summary>Serialize an object to a mutable JSON tree (used to override fields such as "refund").</summary>
    public static JsonObject Node(object value) => JsonSerializer.SerializeToNode(value, value.GetType(), JsonOpts)!.AsObject();
}
