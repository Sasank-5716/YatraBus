namespace YatraBus.Application.Common;

/// <summary>Outcome of a use case: an HTTP-like status with either a payload or an { error, field? }.</summary>
public sealed record AppResult(int Status, object? Value, string? Error = null, string? Field = null)
{
    public bool IsError => Error != null;
    public static AppResult Ok(object? value, int status = 200) => new(status, value);
    public static AppResult Fail(int status, string error, string? field = null) => new(status, null, error, field);
}

/// <summary>A downloadable file produced by a use case (e.g. the bookings CSV).</summary>
public sealed record FileResult(string FileName, string ContentType, byte[] Content);
