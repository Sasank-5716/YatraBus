import { ApplicationRef, inject, provideEnvironmentInitializer } from '@angular/core';

const EVENTS = ['click', 'input', 'change', 'keydown', 'submit', 'pointerup'];

/**
 * Zoneless apps render on the next frame after a state change. v5 updated the DOM synchronously inside each handler, and
 * the e2e suite (and assistive tech) observe the DOM right after an interaction — so after Angular's own listeners have run
 * for a user event, flush change detection in the same task (what zone.js would do at the end of the event).
 */
export function provideSyncRenderOnUserEvents() {
  return provideEnvironmentInitializer(() => {
    const app = inject(ApplicationRef);
    const flush = () => { try { app.tick(); } catch { /* re-entrant tick during CD: next frame will render */ } };
    for (const t of EVENTS) window.addEventListener(t, flush);
  });
}
