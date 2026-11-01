import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

/** Labelled input bound to a FormControl, with the v5 inline error slot (`span.err-text[data-err]`). */
@Component({
  selector: 'yb-text-field',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display:contents', '[attr.id]': 'null' },
  template: `<div class="field"><label [for]="id()">{{ label() }}</label><input class="input" [id]="id()" [type]="type()" [attr.autocomplete]="autocomplete()" [formControl]="control()" [class.invalid]="!!error()" [attr.aria-invalid]="error() === undefined ? null : !!error()" [attr.inputmode]="inputmode()" [attr.maxlength]="maxlength()" [attr.placeholder]="placeholder()" required><span class="err-text" [attr.data-err]="id()">{{ error() }}</span></div>`,
})
export class TextFieldComponent {
  readonly id = input.required<string>();
  readonly label = input.required<string>();
  readonly control = input.required<FormControl<string>>();
  readonly type = input('text');
  readonly autocomplete = input<string | null>(null);
  readonly error = input<string | undefined>(undefined);
  readonly inputmode = input<string | null>(null);
  readonly maxlength = input<number | null>(null);
  readonly placeholder = input<string | null>(null);
}
