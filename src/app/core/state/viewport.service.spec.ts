import { TestBed } from '@angular/core/testing';
import { LayoutModule } from '@angular/cdk/layout';

import { COMPACT_BREAKPOINT_PX, ViewportService } from './viewport.service';

/**
 * Covers `ViewportService.isCompactViewport$`'s core behavior: it emits
 * `true`/`false` correctly across the {@link COMPACT_BREAKPOINT_PX}
 * breakpoint, matching `_breakpoints.scss`'s `$breakpoint-compact` (Mobile
 * Client Support: research.md's CSS-breakpoint decision).
 */
describe('ViewportService', () => {
  let service: ViewportService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [LayoutModule],
    });
    service = TestBed.inject(ViewportService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  it('exposes an isCompactViewport$ observable that reflects the current window width against the shared breakpoint', (done) => {
    service.isCompactViewport$.subscribe((isCompact) => {
      const expected = window.matchMedia(`(max-width: ${COMPACT_BREAKPOINT_PX}px)`).matches;
      expect(isCompact).toBe(expected);
      done();
    });
  });
});
