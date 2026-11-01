using YatraBus.Domain.Entities;

namespace YatraBus.Domain.Seating;

public record Seat(string Id, string Kind, int Price, bool Ladies);
public record Deck(string Name, List<List<Seat?>> Rows);
public record LayoutResult(List<Deck> Decks, List<Seat> Seats, int Total);

/// <summary>Seat maps per bus layout. null cells are aisles/gaps.</summary>
public static class SeatLayout
{
    public static LayoutResult For(Bus bus, int fare)
    {
        var decks = new List<Deck>();
        Seat S(string id, string kind = "seat", int? price = null, bool ladies = false) => new(id, kind, price ?? fare, ladies);

        if (bus.Layout == "sleeper")
        {
            string[] names = ["Lower", "Upper"];
            for (var d = 0; d < 2; d++)
            {
                var rows = new List<List<Seat?>>();
                var p = d == 0 ? "L" : "U";
                var price = fare + (d == 0 ? 150 : 0);
                for (var r = 0; r < 6; r++)
                {
                    var n = r * 3;
                    rows.Add([S($"{p}{n + 1}", "berth", price, d == 0 && r == 0), null, S($"{p}{n + 2}", "berth", price), S($"{p}{n + 3}", "berth", price)]);
                }
                decks.Add(new Deck(names[d] + " deck", rows));
            }
        }
        else if (bus.Layout == "micro")
        {
            var rows = new List<List<Seat?>>();
            var n = 1;
            for (var r = 0; r < 4; r++)
            {
                var a = S($"S{n++}", ladies: r == 0); var b = S($"S{n++}", ladies: r == 0); var c = S($"S{n++}");
                rows.Add([a, null, b, c]);
            }
            rows.Add([S($"S{n++}"), S($"S{n++}"), S($"S{n++}"), S($"S{n++}")]);
            decks.Add(new Deck("Seats", rows));
        }
        else
        {
            var sofa = bus.Layout == "sofa";
            var nrows = sofa ? 8 : 9;
            var rows = new List<List<Seat?>>();
            for (var r = 0; r < nrows; r++)
            {
                var L = (char)(65 + r);
                var pr = r < 3 ? fare + (sofa ? 0 : 50) : fare;
                rows.Add(sofa
                    ? [S($"{L}1", price: pr, ladies: r == 0), null, S($"{L}2", price: pr), S($"{L}3", price: pr)]
                    : [S($"{L}1", price: pr, ladies: r == 0), S($"{L}2", price: pr, ladies: r == 0), null, S($"{L}3", price: pr), S($"{L}4", price: pr)]);
            }
            var last = (char)(65 + nrows);
            rows.Add(sofa
                ? [S($"{last}1"), S($"{last}2"), S($"{last}3"), S($"{last}4")]
                : [S($"{last}1"), S($"{last}2"), S($"{last}3"), S($"{last}4"), S($"{last}5")]);
            decks.Add(new Deck("Seats", rows));
        }
        var all = decks.SelectMany(d => d.Rows.SelectMany(r => r)).Where(s => s != null).Select(s => s!).ToList();
        return new LayoutResult(decks, all, all.Count);
    }
}
