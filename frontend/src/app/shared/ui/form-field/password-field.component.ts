import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { PasswordToggleDirective } from '../../directives/password-toggle.directive';

/** Password input with Show/Hide toggle and inline error slot. */
@Component({
  selector: 'yb-password-field',
  imports: [ReactiveFormsModule, PasswordToggleDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display:contents', '[attr.id]': 'null' },
  template: `<div class="field"><label [for]="id()">{{ label() }}</label><div class="pw-wrap"><input #inp class="input" [id]="id()" type="password" [attr.autocomplete]="autocomplete()" [formControl]="control()" [class.invalid]="!!error()" [attr.aria-invalid]="error() === undefined ? null : !!error()" required><button type="button" class="pw-toggle" [attr.data-pw]="id()" [ybPwToggle]="inp"></button></div><span class="err-text" [attr.data-err]="id()">{{ error() }}</span></div>`,
})
export class PasswordFieldComponent {
  readonly id = input.required<string>();
  readonly label = input.required<string>();
  readonly control = input.required<FormControl<string>>();
  readonly autocomplete = input<string | null>(null);
  readonly error = input<string | undefined>(undefined);
}
