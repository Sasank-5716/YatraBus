import { ChangeDetectionStrategy, Component, TemplateRef, computed, inject, input, signal, viewChild } from '@angular/core';
import { FormControl, FormRecord } from '@angular/forms';
import { Router } from '@angular/router';
import { ModalService } from '../../../core/services/modal.service';
import { ToastService } from '../../../core/services/toast.service';
import { MetaStore } from '../../../core/state/meta.store';
import { dur, npr, ratingCls } from '../../../core/utils/format';
import { AMEN, hasIcon } from '../../../shared/ui/icon/icons';
import { IconDirective } from '../../../shared/ui/icon/icon.directive';
import { DurPipe, NprPipe } from '../../../shared/pipes/format.pipes';
import { AdminApi, Collection } from '../data-access/admin.api';
import { AdminStore } from '../data-access/admin.store';
import { CATALOG, COUPON_TYPES, FieldDef, LAYOUTS } from './catalog.config';
import { EntityEditorComponent } from './entity-editor.component';

type Item = Record<string, any> & { id: number };

/** Generic CRUD table for schedules, buses, routes, operators and coupons (filter, add, edit, delete). */
@Component({
  selector: 'yb-admin-catalog',
  imports: [IconDirective, DurPipe, NprPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display:contents' },
  templateUrl: './catalog.component.html',
})
export class CatalogComponent {
  readonly collection = input.required<Collection>();
  protected store = inject(AdminStore);
  private api = inject(AdminApi);
  private meta = inject(MetaStore);
  private modal = inject(ModalService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private editFoot = viewChild.required<TemplateRef<unknown>>('editFoot');
  private delBody = viewChild.required<TemplateRef<unknown>>('delBody');
  private delFoot = viewChild.required<TemplateRef<unknown>>('delFoot');

  protected readonly def = computed(() => CATALOG[this.collection()]);
  protected readonly singular = computed(() => this.def().title.slice(0, -1).toLowerCase());
  protected readonly items = computed(() => ((this.store.data() as any)?.[this.collection()] || []) as Item[]);
  protected readonly filter = signal('');
  protected readonly AMEN = AMEN;
  protected readonly hasIcon = hasIcon;
  protected readonly ratingCls = ratingCls;

  // editor state
  protected editing: Item | null = null;
  protected form = new FormRecord<FormControl<any>>({});
  protected readonly invalid = signal(new Set<string>());
  protected readonly editError = signal('');
  protected readonly saving = signal(false);
  protected readonly deleting = signal<number | null>(null);

  /** Text used by the quick filter (what the row shows). */
  protected rowText(x: Item): string {
    const s = this.store, c = this.collection();
    const cols = c === 'schedules' ? [s.routeName(x['routeId']), x['departure'], dur(x['durationMins']), s.busName(x['busId']), npr(x['fare']), x['active'] !== false ? 'Active' : 'Paused']
      : c === 'buses' ? [x['number'], s.opName(x['operatorId']), x['type'], x['layout'], x['ac'] ? 'AC' : 'Non-AC', (x['amenities'] || []).map((a: string) => AMEN[a] || a).join('')]
      : c === 'routes' ? [x['from'], x['to'], x['km'] + ' km', npr(x['baseFare']), dur(x['durationMins'] || 0)]
      : c === 'operators' ? [x['name'], `★ ${(+x['rating']).toFixed(1)}`, x['reviews']]
      : [x['code'], x['description'], x['type'] === 'percent' ? x['value'] + '%' : npr(x['value']), npr(x['maxDiscount']), npr(x['minAmount']), x['active'] ? 'Active' : 'Inactive'];
    return (x.id + cols.join('') + (c === 'schedules' ? 'Seats' : '') + 'EditDelete').toLowerCase();
  }
  protected shown(x: Item) { const f = this.filter().toLowerCase(); return !f || this.rowText(x).includes(f); }
  protected seats(id: number) { this.router.navigate(['/admin'], { queryParams: { tab: 'occupancy', sid: id } }); }

  protected open(item: Item | null) {
    this.editing = item;
    this.form = EntityEditorComponent.buildForm(this.def(), item, t => this.editorOptions(t));
    this.invalid.set(new Set()); this.editError.set(''); this.saving.set(false);
    this.modal.open({
      title: item ? `Edit ${this.singular()} #${item.id}` : `Add ${this.singular()}`, wide: true, body: EntityEditorComponent, foot: this.editFoot(),
      inputs: { def: this.def(), item, form: this.form, invalid: this.invalid, error: this.editError },
    });
  }
  private editorOptions(t: FieldDef['type']): [string, string][] {
    const d = this.store.data()!;
    switch (t) {
      case 'route': return d.routes.map(r => [String(r.id), `${r.from} → ${r.to}`]);
      case 'bus': return d.buses.map(b => [String(b.id), `${b.number} · ${this.store.opName(b.operatorId)} · ${b.type}`]);
      case 'operator': return d.operators.map(o => [String(o.id), o.name]);
      case 'layout': return LAYOUTS;
      default: return COUPON_TYPES;
    }
  }
  protected async save() {
    const o: Record<string, unknown> = {}, bad = new Set<string>();
    for (const fd of this.def().fields) {
      const v = this.form.controls[fd.key]?.value;
      if (fd.type === 'bool' || fd.type === 'amen') o[fd.key] = v;
      else { o[fd.key] = String(v).trim(); if (!o[fd.key]) bad.add(fd.key); }
    }
    this.invalid.set(bad);
    if (bad.size) { this.editError.set('Please fill all fields'); return; }
    if (this.collection() === 'schedules' && !/^\d{2}:\d{2}$/.test(String(o['departure']))) { this.editError.set('Departure must be HH:MM'); return; }
    this.saving.set(true);
    try {
      await this.api.save(this.collection(), o, this.editing?.id);
      this.modal.close(); this.meta.invalidate(); this.toast.success(this.editing ? 'Saved' : 'Created'); await this.store.load();
    } catch (err) { this.saving.set(false); this.editError.set((err as Error).message); }
  }
  protected askDelete(id: number) { this.deleting.set(id); this.modal.open({ title: 'Delete item?', body: this.delBody(), foot: this.delFoot() }); }
  protected async doDelete() {
    try { await this.api.remove(this.collection(), this.deleting()!); this.modal.close(); this.meta.invalidate(); this.toast.success('Deleted'); await this.store.load(); }
    catch (err) { this.modal.close(); this.toast.error((err as Error).message, 5000); }
  }
}
