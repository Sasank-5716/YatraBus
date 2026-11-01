import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, input, signal, viewChild } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { BookingStateStore } from '../../../../core/state/booking-state.store';
import type { SearchState } from '../../../../core/models/booking-state.models';
import { addDays, fmtDate, today } from '../../../../core/utils/format';
import { IconDirective } from '../../../../shared/ui/icon/icon.directive';

/** Hero search card: one-way / round trip, cities with swap, dates with quick picks. Submits to #/search. */
@Component({
  selector: 'form[ybSearchForm]',
  imports: [ReactiveFormsModule, IconDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'class': 'search-card glass', 'id': 'search-form', 'novalidate': '', 'aria-label': 'Search buses', 'data-fx': 'zoom', '(submit)': '$event.preventDefault(); submit()' },
  templateUrl: './search-form.component.html',
})
export class SearchFormComponent {
  readonly cities = input.required<string[]>();
  private store = inject(BookingStateStore);
  private router = inject(Router);
  private fb = inject(NonNullableFormBuilder);
  private host = inject(ElementRef<HTMLFormElement>).nativeElement as HTMLFormElement;
  private swapBtn = viewChild.required<ElementRef<HTMLButtonElement>>('swapBtn');
  private dateEl = viewChild.required<ElementRef<HTMLInputElement>>('dateEl');
  private retEl = viewChild.required<ElementRef<HTMLInputElement>>('retEl');

  protected readonly today = today();
  protected readonly maxDate = addDays(this.today, 90);
  protected readonly maxRet = addDays(this.today, 120);
  protected readonly round = signal(false);
  protected readonly error = signal('');
  protected readonly form;
  protected readonly date;
  protected readonly quick = [0, 1, 2, 3].map(n => { const d = addDays(this.today, n); return { d, label: n === 0 ? 'Today' : n === 1 ? 'Tomorrow' : fmtDate(d) }; });

  constructor() {
    const st = this.store.get().search;
    const date = st?.date && st.date >= this.today ? st.date : this.today;
    this.round.set(!!st?.round);
    this.form = this.fb.group({
      from: st?.from || 'Kathmandu', to: st?.to || 'Pokhara', date,
      ret: st?.ret && st.ret >= date ? st.ret : addDays(date, 2),
    });
    this.date = toSignal(this.form.controls.date.valueChanges, { initialValue: date });
  }
  protected readonly retMin = computed(() => this.date());

  protected setRound(on: boolean) { this.round.set(on); }
  protected swap() {
    const { from, to } = this.form.getRawValue(); this.form.patchValue({ from: to, to: from });
    const b = this.swapBtn().nativeElement; b.classList.remove('spin'); void b.offsetWidth; b.classList.add('spin');
  }
  /** Departure changed (picker, quick chip or programmatic `change` event): keep the return date valid. */
  protected dateChanged(value: string) {
    this.form.controls.date.setValue(value);
    const ret = this.retEl().nativeElement.value;
    if (ret < value) this.form.controls.ret.setValue(addDays(value, 1));
  }
  /** Use a popular-route card: fill cities, bring the form into view, then search. */
  useRoute(from: string, to: string) {
    this.form.patchValue({ from, to });
    this.host.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => this.host.requestSubmit(), 450);
  }
  protected submit() {
    // native date inputs can be set without an input event (autofill, scripted fills) — the DOM value is authoritative
    this.form.patchValue({ date: this.dateEl().nativeElement.value, ret: this.retEl().nativeElement.value });
    const v = this.form.getRawValue(), isRound = this.round();
    const s: SearchState = { from: v.from, to: v.to, date: v.date, round: isRound, ret: v.ret };
    const err = s.from === s.to ? 'Origin and destination must be different.' : !s.date || s.date < today() ? 'Please choose a valid travel date.' : isRound && (!s.ret || s.ret < s.date) ? 'Return date must be on or after the departure date.' : '';
    this.error.set(err); if (err) return;
    this.store.set({ search: s, legs: [] });
    this.router.navigate(['/search'], { queryParams: { from: s.from, to: s.to, date: s.date, leg: 0 } });
  }
}
