import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IconDirective } from '../icon/icon.directive';

/** Empty / error state body: `<div class="card empty" ybEmpty icon="bus"><h3>…</h3>…</div>` */
@Component({
  selector: '[ybEmpty]',
  imports: [IconDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="art-ic"><svg [ybIcon]="icon()"></svg></div><ng-content />`,
})
export class EmptyStateComponent { readonly icon = input.required<string>(); }
