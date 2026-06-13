import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Step1Check } from './step1-check';

describe('Step1Check', () => {
  let component: Step1Check;
  let fixture: ComponentFixture<Step1Check>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Step1Check],
    }).compileComponents();

    fixture = TestBed.createComponent(Step1Check);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
