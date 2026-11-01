import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { RouteReuseStrategy, provideRouter, withHashLocation } from '@angular/router';
import { routes } from './app.routes';
import { apiInterceptor } from './core/interceptors/api.interceptor';
import { FreshPageStrategy } from './core/routing/fresh-page.strategy';
import { provideSyncRenderOnUserEvents } from './core/routing/sync-render';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    // hash URLs (#/search?…, #/admin?tab=…) keep every v5 link, bookmark and test working unchanged
    provideRouter(routes, withHashLocation()),
    { provide: RouteReuseStrategy, useClass: FreshPageStrategy },
    provideHttpClient(withInterceptors([apiInterceptor])),
    provideSyncRenderOnUserEvents(),
  ],
};
