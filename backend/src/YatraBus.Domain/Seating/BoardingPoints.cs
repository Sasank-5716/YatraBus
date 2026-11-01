using YatraBus.Domain.Common;
using YatraBus.Domain.Entities;

namespace YatraBus.Domain.Seating;

/// <summary>Boarding/dropping stops per city and their times (15 minutes apart).</summary>
public static class BoardingPoints
{
    public static readonly Dictionary<string, string[]> ByCity = new()
    {
        ["Kathmandu"] = ["Gongabu New Bus Park", "Kalanki", "Koteshwor", "Thankot"],
        ["Pokhara"] = ["Tourist Bus Park", "Prithvi Chowk", "Lakeside"],
        ["Chitwan"] = ["Sauraha Bus Stop", "Narayangarh Pul Chowk", "Bharatpur Chowk"],
        ["Butwal"] = ["Butwal Bus Park", "Traffic Chowk", "Golpark"],
        ["Biratnagar"] = ["Biratnagar Bus Park", "Main Road", "Rani"],
        ["Janakpur"] = ["Janakpur Bus Park", "Ramanand Chowk", "Janaki Mandir Gate"],
    };

    public static (List<Point> Boarding, List<Point> Dropping) For(Schedule s, BusRoute r)
    {
        var bp = ByCity.GetValueOrDefault(r.From) ?? [r.From + " Bus Park"];
        var dp = ByCity.GetValueOrDefault(r.To) ?? [r.To + " Bus Park"];
        var B = bp.Select((name, i) => new Point { Name = name, Time = Js.AddMins(s.Departure, i * 15) }).ToList();
        var D = dp.Select((name, i) => new Point { Name = name, Time = Js.AddMins(s.Departure, s.DurationMins - (dp.Length - 1 - i) * 15) }).ToList();
        return (B, D);
    }
}
