import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Booking progress: `<div class="steps" aria-label="Booking progress" ybSteps [active]="1" [round]="true"></div>` */
@Component({
  selector: '[ybSteps]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@for (x of items(); track $index) {@if ($index) {<span aria-hidden="true">›</span>}<span [class.on]="$index <= active()"><span class="dot">{{ $index + 1 }}</span>{{ x }}</span>}`,
})
export class StepsBarComponent {
  readonly active = input.required<number>();
  readonly round = input(false);
  readonly items = computed(() => this.round() ? ['Outbound bus', 'Return bus', 'Passenger & pay', 'E-ticket'] : ['Select bus', 'Passenger & pay', 'E-ticket']);
}
