import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Step2School } from './step2-school';

describe('Step2School', () => {
  let component: Step2School;
  let fixture: ComponentFixture<Step2School>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Step2School],
    }).compileComponents();

    fixture = TestBed.createComponent(Step2School);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
