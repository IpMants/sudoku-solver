import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DigitKeypadComponent } from './digit-keypad.component';
import { PuzzleStore } from '../../core/state/puzzle-store';
import { ViewportService } from '../../core/state/viewport.service';
import { of } from 'rxjs';

/**
 * Covers contracts/digit-keypad.md's behavioral guarantees: visibility rules
 * (compact viewport + a selected non-given cell), digit-tap/clear-tap
 * forwarding to `PuzzleStore.setCellValue`, and ARIA labels on each button
 * (Mobile Client Support, US2: FR-002, FR-003, FR-003b, FR-004).
 */
describe('DigitKeypadComponent', () => {
  let component: DigitKeypadComponent;
  let fixture: ComponentFixture<DigitKeypadComponent>;
  let store: PuzzleStore;

  function configureCompactViewport(isCompact: boolean): void {
    TestBed.overrideProvider(ViewportService, {
      useValue: { isCompactViewport$: of(isCompact) },
    });
  }

  async function createComponent(): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [DigitKeypadComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DigitKeypadComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(PuzzleStore);
  }

  it('should create', async () => {
    configureCompactViewport(false);
    await createComponent();
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('hides the keypad on a non-compact viewport even with a non-given cell selected', async () => {
    configureCompactViewport(false);
    await createComponent();
    store.startCustomPuzzle();
    store.selectCell(0);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.digit-keypad')).toBeNull();
  });

  it('hides the keypad on a compact viewport when no cell is selected', async () => {
    configureCompactViewport(true);
    await createComponent();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.digit-keypad')).toBeNull();
  });

  it('shows the keypad on a compact viewport when a non-given cell is selected', async () => {
    configureCompactViewport(true);
    await createComponent();
    store.startCustomPuzzle();
    store.selectCell(0);
    fixture.detectChanges();

    const keypad = fixture.nativeElement.querySelector('.digit-keypad');
    expect(keypad).not.toBeNull();
    expect(keypad.getAttribute('role')).toBe('group');
    expect(keypad.getAttribute('aria-label')).toBe('Digit entry keypad');
  });

  it('hides the keypad on a compact viewport when a given cell is selected', async () => {
    configureCompactViewport(true);
    await createComponent();
    store.loadRandomExample();

    let givenIndex: number | undefined;
    store.puzzle$.subscribe((puzzle) => {
      givenIndex = puzzle.cells.findIndex((cell) => cell.origin === 'given');
    });
    expect(givenIndex).toBeGreaterThanOrEqual(0);
    store.selectCell(givenIndex!);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.digit-keypad')).toBeNull();
  });

  it('renders 1-9 digit buttons and a Clear button with correct aria-labels and forwards taps to setCellValue', async () => {
    configureCompactViewport(true);
    await createComponent();
    store.startCustomPuzzle();
    store.selectCell(5);
    fixture.detectChanges();

    const buttons: HTMLButtonElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('.digit-keypad-button'),
    );
    expect(buttons.length).toBe(10);
    expect(buttons.slice(0, 9).map((b) => b.getAttribute('aria-label'))).toEqual([
      'Enter 1',
      'Enter 2',
      'Enter 3',
      'Enter 4',
      'Enter 5',
      'Enter 6',
      'Enter 7',
      'Enter 8',
      'Enter 9',
    ]);
    expect(buttons[9].getAttribute('aria-label')).toBe('Clear cell');

    buttons[2].click();
    fixture.detectChanges();
    let value: number | null | undefined;
    store.puzzle$.subscribe((puzzle) => (value = puzzle.cells[5].value));
    expect(value).toBe(3);

    buttons[9].click();
    fixture.detectChanges();
    store.puzzle$.subscribe((puzzle) => (value = puzzle.cells[5].value));
    expect(value).toBeNull();
  });

  it('never renders a text input or an inputmode attribute (must not summon the native keyboard)', async () => {
    configureCompactViewport(true);
    await createComponent();
    store.startCustomPuzzle();
    store.selectCell(0);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('input')).toBeNull();
    expect(fixture.nativeElement.querySelector('[inputmode]')).toBeNull();
  });
});
