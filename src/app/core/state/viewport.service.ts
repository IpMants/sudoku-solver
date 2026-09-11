import { Injectable } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Compact-viewport breakpoint, in pixels. MUST stay in sync with
 * `$breakpoint-compact` in `src/styles/_breakpoints.scss` so the CSS layout
 * (app shell stacking, board sizing) and this TypeScript-driven visibility
 * check (used by `DigitKeypadComponent`) never disagree about what counts
 * as a "compact" viewport (specs/002-mobile-client-support/research.md's
 * CSS-breakpoint decision).
 */
export const COMPACT_BREAKPOINT_PX = 768;

/**
 * Reports whether the current viewport is "compact" (phones and portrait
 * tablets, `<= 768px` wide), using Angular CDK's `BreakpointObserver` rather
 * than `navigator.userAgent`/device sniffing, per
 * specs/002-mobile-client-support/research.md's CSS-breakpoint decision.
 * Consumed by the app shell layout wiring (US1) and by `DigitKeypadComponent`
 * (US2) to decide when the on-screen touch keypad should be offered.
 */
@Injectable({ providedIn: 'root' })
export class ViewportService {
  /**
   * Emits `true` whenever the viewport width is at most
   * {@link COMPACT_BREAKPOINT_PX}, and `false` otherwise. Updates
   * automatically on resize/orientation change.
   */
  readonly isCompactViewport$: Observable<boolean>;

  constructor(private readonly breakpointObserver: BreakpointObserver) {
    this.isCompactViewport$ = this.breakpointObserver
      .observe(`(max-width: ${COMPACT_BREAKPOINT_PX}px)`)
      .pipe(map((state) => state.matches));
  }
}
