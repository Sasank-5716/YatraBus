import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { Deck, Seat, SeatInfo } from '../../../core/models/api.models';
import { npr } from '../../../core/utils/format';
import { IconDirective } from '../icon/icon.directive';

export interface SeatToggle { seat: Seat; el: HTMLButtonElement; }

/** Bus seat map (decks + legend). Interactive on the seat page; read-only with passenger names in the admin occupancy view. */
@Component({
  selector: 'yb-seat-map',
  imports: [IconDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display:contents' },
  templateUrl: './seat-map.component.html',
})
export class SeatMapComponent {
  readonly layout = input.required<Deck[]>();
  readonly selected = input<string[]>([]);
  readonly booked = input<string[]>([]);
  readonly held = input<string[]>([]);
  readonly info = input<Record<string, SeatInfo> | null>(null);
  readonly interactive = input(true);
  readonly toggle = output<SeatToggle>();

  protected readonly decks = computed(() => this.layout().map(d => ({ name: d.name, cols: `repeat(${d.rows[0].length},auto)`, cells: d.rows.flat() })));
  private readonly sets = computed(() => ({ b: new Set(this.booked()), h: new Set(this.held()), s: new Set(this.selected()) }));

  protected state(s: Seat) {
    const { b, h, s: sel } = this.sets(), info = this.info(), isB = b.has(s.id), isH = h.has(s.id), isS = sel.has(s.id), x = info?.[s.id];
    const tip = x ? `${x.name} (${x.age}${x.gender}) · ${x.id}` : `${s.kind === 'berth' ? 'Berth' : 'Seat'} ${s.id}, ${npr(s.price)}${s.ladies ? ', ladies seat' : ''}${isB ? ', booked' : isH ? ', on hold' : ''}`;
    const small = info ? (x ? x.name.split(' ')[0].slice(0, 6) : '') : isB ? '' : String(s.price);
    return { isB, isH, isS, tip, small };
  }
  protected click(s: Seat, e: MouseEvent) {
    if (!this.interactive()) return;
    const el = e.currentTarget as HTMLButtonElement;
    this.toggle.emit({ seat: s, el });
  }
}
