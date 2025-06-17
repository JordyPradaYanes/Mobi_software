import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PropertyCardComponent, Property } from './property-card.component'; // Import Property interface
import { CommonModule } from '@angular/common'; // For pipes like currency, ngIf, ngFor
import { By } from '@angular/platform-browser'; // For querying DOM elements

const mockProperty: Property = {
  id: 1, // Changed to number to match interface if it's number
  address: '123 Test Street, Testville',
  price: 500000,
  bedrooms: 3,
  bathrooms: 2,
  imageUrl: 'https://via.placeholder.com/300x200',
  // Fill in other required fields from your Property interface if they exist
  // e.g., userId, description, type, status, features, imageUrls, createdAt, updatedAt
  // For simplicity, assuming these are optional or not directly tested for display here
  userId: 'user1',
  description: 'A lovely test property.',
  type: 'House',
  status: 'For Sale',
  features: ['Garden', 'Garage'],
  imageUrls: ['https://via.placeholder.com/300x200'],
  createdAt: new Date(),
  updatedAt: new Date()
};

describe('PropertyCardComponent', () => {
  let component: PropertyCardComponent;
  let fixture: ComponentFixture<PropertyCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        PropertyCardComponent, // It's standalone, so it brings its own dependencies like CommonModule
        // CommonModule // No longer explicitly needed here as the component imports it.
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PropertyCardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges(); // Initial binding
    expect(component).toBeTruthy();
  });

  it('should display "No property data available." if property input is not set', () => {
    component.property = undefined;
    fixture.detectChanges();

    const paragraphElement = fixture.debugElement.query(By.css('p'));
    expect(paragraphElement).toBeTruthy();
    expect(paragraphElement.nativeElement.textContent).toContain('No property data available.');
  });

  it('should display property details when property input is set', () => {
    component.property = mockProperty;
    fixture.detectChanges(); // Trigger change detection and bind the input

    const compiled = fixture.nativeElement as HTMLElement;

    // Check image (src and alt)
    const imgElement = compiled.querySelector('.property-image') as HTMLImageElement;
    expect(imgElement).toBeTruthy();
    expect(imgElement.src).toBe(mockProperty.imageUrl);
    expect(imgElement.alt).toBe('Property Image');

    // Check address
    const addressElement = compiled.querySelector('.property-details h2');
    expect(addressElement).toBeTruthy();
    expect(addressElement?.textContent).toContain(mockProperty.address);

    // Check price - Angular currency pipe adds symbols and formatting.
    // Testing the exact string can be brittle. Check for the number part.
    const priceElement = compiled.querySelector('.price');
    expect(priceElement).toBeTruthy();
    expect(priceElement?.textContent).toContain(mockProperty.price.toString()); // Check for the raw number
    // More robust: expect(priceElement?.textContent).toMatch(/\$\s*500,000/); // Using regex

    // Check bedrooms and bathrooms
    const bedsBathsElement = compiled.querySelector('.property-details p:last-child'); // The p tag with bed/bath
    expect(bedsBathsElement).toBeTruthy();
    expect(bedsBathsElement?.textContent).toContain(`${mockProperty.bedrooms} Bedrooms`);
    expect(bedsBathsElement?.textContent).toContain(`${mockProperty.bathrooms} Bathrooms`);
  });

  it('should display placeholder image if imageUrl is not provided in property input', () => {
    const propertyWithoutImage: Property = { ...mockProperty, imageUrl: undefined };
    component.property = propertyWithoutImage;
    fixture.detectChanges();

    const imgElement = fixture.debugElement.query(By.css('.property-image')).nativeElement as HTMLImageElement;
    expect(imgElement).toBeTruthy();
    expect(imgElement.src).toContain('https://via.placeholder.com/300x200');
  });

  it('should handle property input being null initially then updated', () => {
    component.property = undefined; // Initially undefined
    fixture.detectChanges();
    let paragraphElement = fixture.debugElement.query(By.css('p'));
    expect(paragraphElement.nativeElement.textContent).toContain('No property data available.');

    component.property = mockProperty; // Update with actual property
    fixture.detectChanges();

    const addressElement = fixture.debugElement.query(By.css('.property-details h2'));
    expect(addressElement).toBeTruthy(); // Should now render property details
    expect(addressElement.nativeElement.textContent).toContain(mockProperty.address);
  });

});
