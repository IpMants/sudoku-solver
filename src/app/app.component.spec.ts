import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { PuzzleStore } from './core/state/puzzle-store';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have the 'Sudoku Solver' title`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('Sudoku Solver');
  });

  it('should render title', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Sudoku Solver');
  });

  it('loads a random example puzzle on init (FR-001, SC-001)', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const store = TestBed.inject(PuzzleStore);
    let cellCount = 0;
    store.puzzle$.subscribe((puzzle) => {
      cellCount = puzzle.cells.length;
    });
    expect(cellCount).toBe(81);
  });
});
