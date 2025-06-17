import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, Validators } from '@angular/forms'; // Import Validators
import { RouterTestingModule } from '@angular/router/testing'; // For Router dependency
import { PropertyFormComponent } from './property-form.component';
import { PropertyService } from '../../../services/property-service'; // Adjusted path
import { AuthService } from '../../../services/auth.service';
import { Firestore } from '@angular/fire/firestore'; // For Firestore dependency
import { Auth } from '@angular/fire/auth'; // For Auth dependency
import { NoopAnimationsModule } from '@angular/platform-browser/animations'; // For animations if any part of your form uses them

// Mock services
class MockPropertyService {
  addProperty() {} // Add other methods if called during initialization or tests
}

class MockAuthService {
  getCurrentUser() { return { uid: 'test-uid' }; } // Mock as needed
}

describe('PropertyFormComponent', () => {
  let component: PropertyFormComponent;
  let fixture: ComponentFixture<PropertyFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        PropertyFormComponent, // Since it's standalone, import it directly
        ReactiveFormsModule,
        RouterTestingModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: PropertyService, useClass: MockPropertyService },
        { provide: AuthService, useClass: MockAuthService },
        // Provide mocks for Firebase services if they are directly injected or needed by services
        { provide: Firestore, useValue: {} }, // Mock Firestore
        { provide: Auth, useValue: {} }         // Mock Auth
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PropertyFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // This triggers ngOnInit and form initialization
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize propertyForm with default values', () => {
    expect(component.propertyForm).toBeDefined();
    expect(component.propertyForm.get('address')?.value).toEqual('');
    expect(component.propertyForm.get('price')?.value).toEqual(''); // Default from FormBuilder is often '', not null unless specified
    expect(component.propertyForm.get('bedrooms')?.value).toEqual('');
    expect(component.propertyForm.get('bathrooms')?.value).toEqual('');
    expect(component.propertyForm.get('description')?.value).toEqual('');
    // expect(component.propertyForm.get('imageUrls')?.value).toEqual([]); // FormArray default value
  });

  it('should have required validators for address, price, bedrooms, bathrooms, and description', () => {
    const addressControl = component.propertyForm.get('address');
    const priceControl = component.propertyForm.get('price');
    const bedroomsControl = component.propertyForm.get('bedrooms');
    const bathroomsControl = component.propertyForm.get('bathrooms');
    const descriptionControl = component.propertyForm.get('description');

    expect(addressControl?.hasValidator(Validators.required)).toBeTrue();
    expect(priceControl?.hasValidator(Validators.required)).toBeTrue();
    expect(bedroomsControl?.hasValidator(Validators.required)).toBeTrue();
    expect(bathroomsControl?.hasValidator(Validators.required)).toBeTrue();
    expect(descriptionControl?.hasValidator(Validators.required)).toBeTrue();
  });

  it('price control should have min validator', () => {
    const priceControl = component.propertyForm.get('price');
    // This check is a bit more involved as Validators.min returns a ValidatorFn
    // For simplicity, we check if setting an invalid value makes the control invalid due to 'min'
    priceControl?.setValue(0);
    expect(priceControl?.errors?.['min']).toBeTruthy();
    priceControl?.setValue(-10);
    expect(priceControl?.errors?.['min']).toBeTruthy();
    priceControl?.setValue(10);
    expect(priceControl?.errors?.['min']).toBeFalsy(); // Corrected this line to toBeFalsy for valid input
  });

  it('bedrooms and bathrooms controls should have min validator for 0', () => {
    const bedroomsControl = component.propertyForm.get('bedrooms');
    bedroomsControl?.setValue(-1);
    expect(bedroomsControl?.errors?.['min']).toBeTruthy();
    bedroomsControl?.setValue(0);
    expect(bedroomsControl?.errors?.['min']).toBeFalsy(); // Corrected this line to toBeFalsy for valid input

    const bathroomsControl = component.propertyForm.get('bathrooms');
    bathroomsControl?.setValue(-1);
    expect(bathroomsControl?.errors?.['min']).toBeTruthy();
    bathroomsControl?.setValue(0);
    expect(bathroomsControl?.errors?.['min']).toBeFalsy(); // Corrected this line to toBeFalsy for valid input
  });

  // Add more tests as needed, for example, for the onSubmit method (would require more mocking)
});
