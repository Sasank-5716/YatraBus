import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { PageFxService } from './page-fx.service';
import { SessionStore } from '../state/session.store';

/** Runs before every page activation: waits for the initial session check, then plays the leave fade. */
export const pageTransitionGuard: CanActivateFn = async () => {
  const session = inject(SessionStore), fx = inject(PageFxService); // inject before the first await
  await session.ready();
  await fx.leave();
  return true;
};
