import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FavoritesComponent } from './favorites.component';
import { FavoritesService } from '../../services/favorites.service';
import { AuthService } from '../../services/auth.service';
import { PropertyCardComponent } from '../property-card/property-card.component';
import { Property } from '../../interfaces/property.interface';
import { User } from '@angular/fire/auth';
import { of, Subject } from 'rxjs';
import { CommonModule } from '@angular/common';
import { RouterTestingModule } from '@angular/router/testing'; // For routerLink if PropertyCard uses it

// Mocks
class MockFavoritesService {
  getFavoriteProperties = jasmine.createSpy('getFavoriteProperties').and.returnValue(of([]));
  removeFavorite = jasmine.createSpy('removeFavorite').and.returnValue(of(undefined)); // Returns Observable<void>
}

class MockAuthService {
  private currentUser: User | null = null;
  getCurrentUser = jasmine.createSpy('getCurrentUser').and.callFake(() => this.currentUser);
  user$ = of(null); // Mock user$ observable if needed by other parts of your app

  // Helper to simulate login for tests
  setCurrentUser(user: User | null) {
    this.currentUser = user;
  }
}

const mockUser = {
  uid: 'testUserId123',
  email: 'test@example.com',
  // Add other User properties if your component uses them
} as User;

const mockProperties: Property[] = [
  { id: '1', address: 'Favorite St 1', price: 100, bedrooms: 1, bathrooms: 1, userId: 'user1' } as Property,
  { id: '2', address: 'Favorite St 2', price: 200, bedrooms: 2, bathrooms: 2, userId: 'user1' } as Property,
];

describe('FavoritesComponent', () => {
  let component: FavoritesComponent;
  let fixture: ComponentFixture<FavoritesComponent>;
  let favoritesServiceMock: MockFavoritesService;
  let authServiceMock: MockAuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        FavoritesComponent, // Component is standalone
        CommonModule,       // For *ngIf, *ngFor, async pipe
        // PropertyCardComponent, // Import if template interaction is deeply tested, or mock it
        RouterTestingModule // If PropertyCardComponent uses routerLink, etc.
      ],
      providers: [
        { provide: FavoritesService, useClass: MockFavoritesService },
        { provide: AuthService, useClass: MockAuthService },
      ]
    })
    // .overrideComponent(FavoritesComponent, { // Example if you need to mock/remove specific imports for testing
    //   remove: { imports: [PropertyCardComponent] },
    //   add: { imports: [MockPropertyCardComponent] } // if you create a mock for it
    // })
    .compileComponents();

    fixture = TestBed.createComponent(FavoritesComponent);
    component = fixture.componentInstance;
    favoritesServiceMock = TestBed.inject(FavoritesService) as unknown as MockFavoritesService;
    authServiceMock = TestBed.inject(AuthService) as unknown as MockAuthService;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should call getFavoriteProperties if user is logged in', fakeAsync(() => {
      authServiceMock.setCurrentUser(mockUser);
      favoritesServiceMock.getFavoriteProperties.and.returnValue(of(mockProperties));

      component.ngOnInit();
      tick(); // Process observables

      expect(authServiceMock.getCurrentUser).toHaveBeenCalled();
      expect(favoritesServiceMock.getFavoriteProperties).toHaveBeenCalledWith(mockUser.uid);
      expect(component.currentUserId).toBe(mockUser.uid);

      let emittedProperties: Property[] | undefined;
      component.favoriteProperties$.subscribe(props => emittedProperties = props);
      tick(); // Ensure subscription updates
      expect(emittedProperties).toEqual(mockProperties);
    }));

    it('should not call getFavoriteProperties if user is not logged in', fakeAsync(() => {
      authServiceMock.setCurrentUser(null);

      component.ngOnInit();
      tick();

      expect(authServiceMock.getCurrentUser).toHaveBeenCalled();
      expect(favoritesServiceMock.getFavoriteProperties).not.toHaveBeenCalled();
      expect(component.currentUserId).toBeNull();

      let emittedProperties: Property[] | undefined;
      component.favoriteProperties$.subscribe(props => emittedProperties = props);
      tick();
      expect(emittedProperties).toEqual([]);
    }));
  });

  describe('removeFavorite', () => {
    beforeEach(() => {
      // Ensure currentUserId is set for these tests, as removeFavorite relies on it
      authServiceMock.setCurrentUser(mockUser);
      component.currentUserId = mockUser.uid; // Set directly as ngOnInit might not have run or completed
    });

    it('should call favoritesService.removeFavorite with correct propertyId', fakeAsync(() => {
      const propertyIdToRemove = '1';
      favoritesServiceMock.removeFavorite.and.returnValue(of(undefined)); // Simulate successful removal

      // Initialize favoriteProperties$ with some data so the filter can be tested
      const initialProperties = [...mockProperties];
      component.favoriteProperties$ = of(initialProperties);
      fixture.detectChanges(); // Trigger change detection to process initial observable

      component.removeFavorite(propertyIdToRemove);
      tick(); // Process removeFavorite observable and subsequent map

      expect(favoritesServiceMock.removeFavorite).toHaveBeenCalledWith(mockUser.uid, propertyIdToRemove);

      let updatedProperties: Property[] | undefined;
      component.favoriteProperties$.subscribe(props => updatedProperties = props);
      tick(); // Process the map operator on favoriteProperties$

      expect(updatedProperties).toBeDefined();
      expect(updatedProperties?.length).toBe(initialProperties.length - 1);
      expect(updatedProperties?.find(p => p.id === propertyIdToRemove)).toBeUndefined();
    }));

    it('should not attempt to remove if currentUserId is null', () => {
      component.currentUserId = null; // Simulate user logged out between init and action
      const propertyIdToRemove = '1';

      component.removeFavorite(propertyIdToRemove);

      expect(favoritesServiceMock.removeFavorite).not.toHaveBeenCalled();
    });

    it('should handle error from favoritesService.removeFavorite and not break', fakeAsync(() => {
      const propertyIdToRemove = '1';
      favoritesServiceMock.removeFavorite.and.returnValue(throwError(() => new Error('Service error')));

      const initialProperties = [...mockProperties];
      component.favoriteProperties$ = of(initialProperties);
      fixture.detectChanges();

      component.removeFavorite(propertyIdToRemove);
      tick();

      // The UI list shouldn't change if removal failed in this setup
      let currentProps: Property[] = [];
      component.favoriteProperties$.subscribe(p => currentProps = p);
      tick();
      expect(currentProps).toEqual(initialProperties);
      // Could also check for a console.error spy if that's how errors are handled
    }));
  });
});
