import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Step3User } from './step3-user';

describe('Step3User', () => {
  let component: Step3User;
  let fixture: ComponentFixture<Step3User>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Step3User],
    }).compileComponents();

    fixture = TestBed.createComponent(Step3User);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
