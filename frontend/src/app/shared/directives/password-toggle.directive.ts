import { Directive, Input, signal } from '@angular/core';

/** Show/Hide button for a password input: `<button type="button" class="pw-toggle" [ybPwToggle]="input">`. */
@Directive({
  selector: 'button[ybPwToggle]',
  exportAs: 'pw',
  host: { '(click)': 'toggle()', '[attr.aria-label]': 'shown() ? "Hide password" : "Show password"', '[textContent]': 'shown() ? "Hide" : "Show"' },
})
export class PasswordToggleDirective {
  @Input({ required: true }) ybPwToggle!: HTMLInputElement;
  readonly shown = signal(false);
  toggle() { this.shown.update(v => !v); this.ybPwToggle.type = this.shown() ? 'text' : 'password'; }
  reset() { this.shown.set(false); this.ybPwToggle.type = 'password'; }
}
