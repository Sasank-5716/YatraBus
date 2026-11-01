import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { FormControl, FormRecord, ReactiveFormsModule } from '@angular/forms';
import { ModalRef } from '../../../core/services/modal.service';
import { AMEN, AMEN_KEYS } from '../../../shared/ui/icon/icons';
import { AdminStore } from '../data-access/admin.store';
import { COUPON_TYPES, CollectionDef, FieldDef, LAYOUTS } from './catalog.config';

/** Modal body for add/edit: one control per field (selects, checkboxes, amenity set, text/number/time inputs). */
@Component({
  selector: 'yb-entity-editor',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display:contents' },
  templateUrl: './entity-editor.component.html',
})
export class EntityEditorComponent {
  readonly def = input.required<CollectionDef>();
  readonly item = input<Record<string, any> | null>(null);
  readonly form = input.required<FormRecord<FormControl<any>>>();
  readonly invalid = input.required<() => Set<string>>();
  readonly error = input.required<() => string>();
  readonly modalRef = input.required<ModalRef>();
  private store = inject(AdminStore);
  protected readonly amenKeys = AMEN_KEYS;
  protected readonly amen = AMEN;

  options(t: FieldDef['type']): [string, string][] {
    const d = this.store.data()!;
    switch (t) {
      case 'route': return d.routes.map(r => [String(r.id), `${r.from} → ${r.to}`]);
      case 'bus': return d.buses.map(b => [String(b.id), `${b.number} · ${this.store.opName(b.operatorId)} · ${b.type}`]);
      case 'operator': return d.operators.map(o => [String(o.id), o.name]);
      case 'layout': return LAYOUTS;
      default: return COUPON_TYPES;
    }
  }
  /** Builds one control per field. Called by the opener before the modal renders, so the form is complete on first bind. */
  static buildForm(def: CollectionDef, item: Record<string, any> | null, options: (t: FieldDef['type']) => [string, string][]) {
    const form = new FormRecord<FormControl<any>>({});
    for (const fd of def.fields) {
      const v = item?.[fd.key];
      const init = fd.type === 'bool' ? (v === undefined ? fd.key === 'active' : !!v)
        : fd.type === 'amen' ? [...(v || [])]
        : ['route', 'bus', 'operator', 'layout', 'ctype'].includes(fd.type) ? String(v ?? options(fd.type)[0]?.[0] ?? '') : String(v ?? '');
      form.addControl(fd.key, new FormControl(init, { nonNullable: true }));
    }
    return form;
  }
  protected isSelect(t: string) { return ['route', 'bus', 'operator', 'layout', 'ctype'].includes(t); }
  protected hasAmen(a: string) { return (this.form().controls['amenities']?.value as string[]).includes(a); }
  protected toggleAmen(a: string, on: boolean) {
    const c = this.form().controls['amenities'], cur = c.value as string[];
    c.setValue(on ? [...cur, a] : cur.filter(x => x !== a));
  }
}
