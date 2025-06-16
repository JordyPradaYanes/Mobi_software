import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LocationPropertiesComponent } from './location-properties.component';

describe('LocationPropertiesComponent', () => {
  let component: LocationPropertiesComponent;
  let fixture: ComponentFixture<LocationPropertiesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LocationPropertiesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LocationPropertiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
