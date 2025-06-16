import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PropertyBenefitsComponent } from './property-benefits.component';

describe('PropertyBenefitsComponent', () => {
  let component: PropertyBenefitsComponent;
  let fixture: ComponentFixture<PropertyBenefitsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropertyBenefitsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PropertyBenefitsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
