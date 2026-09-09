import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SolveControlsComponent } from './solve-controls.component';

describe('SolveControlsComponent', () => {
  let component: SolveControlsComponent;
  let fixture: ComponentFixture<SolveControlsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SolveControlsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SolveControlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
