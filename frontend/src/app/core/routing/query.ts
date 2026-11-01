import { inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

/** Snapshot of the current route's query params (pages are recreated on every navigation, so a snapshot is enough). */
export function injectQuery(): Record<string, string> {
  const qp = inject(ActivatedRoute).snapshot.queryParamMap;
  return Object.fromEntries(qp.keys.map(k => [k, qp.get(k) ?? '']));
}
