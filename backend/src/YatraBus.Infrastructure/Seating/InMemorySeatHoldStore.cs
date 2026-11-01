using YatraBus.Application.Abstractions;
using YatraBus.Domain.Seating;

namespace YatraBus.Infrastructure.Seating;

/// <summary>Temporary seat holds during checkout (in memory, like the original). Singleton.</summary>
public class InMemorySeatHoldStore(IClock clock) : ISeatHoldStore
{
    private readonly Dictionary<string, SeatHold> _holds = new();
    private readonly object _lock = new();

    public void Clean()
    {
        var now = clock.NowMs;
        lock (_lock) foreach (var k in _holds.Where(h => h.Value.IsExpired(now)).Select(h => h.Key).ToList()) _holds.Remove(k);
    }

    public SeatHold? Get(string? id) { if (id == null) return null; lock (_lock) return _holds.GetValueOrDefault(id); }
    public void Set(string id, SeatHold h) { lock (_lock) _holds[id] = h; }
    public void Remove(string? id) { if (id == null) return; lock (_lock) _holds.Remove(id); }
    public void Clear() { lock (_lock) _holds.Clear(); }

    public List<string> HeldSeats(int scheduleId, string date, string? exceptHold)
    {
        lock (_lock) return _holds.Where(h => h.Key != exceptHold && h.Value.ScheduleId == scheduleId && h.Value.Date == date).SelectMany(h => h.Value.Seats).ToList();
    }
}
