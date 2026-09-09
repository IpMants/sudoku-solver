import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

/**
 * Root application configuration (T012). Wires up:
 * - Zone-based change detection with event coalescing (Angular CLI default).
 * - The (currently empty) router, kept for structural consistency even
 *   though this is a single-page app with no navigable routes.
 * - Async Angular Animations, required by Angular Material components for
 *   their built-in interaction/focus animations (Constitution Principle V).
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
  ],
};
