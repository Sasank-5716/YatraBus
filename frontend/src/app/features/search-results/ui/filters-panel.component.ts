import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { ResultsStore, BUS_TYPES, SLOTS } from '../data-access/results.store';
import { AMEN } from '../../../shared/ui/icon/icons';
import { NprPipe } from '../../../shared/pipes/format.pipes';

/** Results filter sidebar (bus type, departure slot, max price, amenities, operators). Slide-over on mobile. */
@Component({
  selector: 'aside[ybFilters]',
  imports: [NprPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'class': 'card filters', 'id': 'filters', 'aria-label': 'Filters', '[class.open]': 'open()' },
  templateUrl: './filters-panel.component.html',
})
export class FiltersPanelComponent {
  protected s = inject(ResultsStore);
  readonly open = input(false);
  readonly done = output<void>();
  protected readonly types = BUS_TYPES;
  protected readonly slots = SLOTS;
  protected readonly amenities = Object.entries(AMEN);
  protected check(key: 'types' | 'ops' | 'amen', e: Event) { const c = e.target as HTMLInputElement; this.s.toggle(key, c.value, c.checked); }
  protected slot(k: string) { this.s.toggle('slots', k, !this.s.slots().has(k)); }
  protected price(e: Event) { this.s.max.set(+(e.target as HTMLInputElement).value); }
}
