using YatraBus.Application.Abstractions;
using YatraBus.Domain.Common;

namespace YatraBus.Infrastructure;

public class SystemClock : IClock
{
    public DateTimeOffset UtcNow => DateTimeOffset.UtcNow;
    public long NowMs => Js.NowMs();
    public string IsoNow => Js.IsoNow();
}
