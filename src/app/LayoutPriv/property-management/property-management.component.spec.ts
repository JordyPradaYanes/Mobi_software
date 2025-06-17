import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { User } from '@angular/fire/auth';

import { PropertyManagementComponent } from './property-management.component';
import { PropertyService } from '../../services/property.service';
import { AuthService } from '../../services/auth.service';
import { Property } from '../../interfaces/property.interface';
import { PropertyCardComponent } from '../property-card/property-card.component'; // Assuming standalone
import { CommonModule } from '@angular/common';
import { RouterTestingModule } from '@angular/router/testing';


// Mocks
class MockPropertyService {
  getPropertiesByUserId = jasmine.createSpy('getPropertiesByUserId').and.returnValue(of([]));
  deleteProperty = jasmine.createSpy('deleteProperty').and.returnValue(of(undefined));
}

class MockAuthService {
  private currentUser: User | null = null;
  getCurrentUser = jasmine.createSpy('getCurrentUser').and.callFake(() => this.currentUser);
  user$ = of(null);

  setCurrentUser(user: User | null) {
    this.currentUser = user;
  }
}

class MockRouter {
  navigate = jasmine.createSpy('navigate');
}

const mockUser = { uid: 'user123', email: 'user@example.com' } as User;
const mockProperties: Property[] = [
  { id: 'prop1', userId: 'user123', address: '1 Test Rd', price: 100 } as Property,
  { id: 'prop2', userId: 'user123', address: '2 Test Rd', price: 200 } as Property,
];

describe('PropertyManagementComponent', () => {
  let component: PropertyManagementComponent;
  let fixture: ComponentFixture<PropertyManagementComponent>;
  let propertyServiceMock: MockPropertyService;
  let authServiceMock: MockAuthService;
  let routerMock: MockRouter;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        PropertyManagementComponent, // Standalone
        CommonModule,
        // PropertyCardComponent, // If template interactions are tested deeply
        RouterTestingModule // Provides a stub for RouterLink etc.
      ],
      providers: [
        { provide: PropertyService, useClass: MockPropertyService },
        { provide: AuthService, useClass: MockAuthService },
        { provide: Router, useClass: MockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PropertyManagementComponent);
    component = fixture.componentInstance;
    propertyServiceMock = TestBed.inject(PropertyService) as unknown as MockPropertyService;
    authServiceMock = TestBed.inject(AuthService) as unknown as MockAuthService;
    routerMock = TestBed.inject(Router) as unknown as MockRouter;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should call getPropertiesByUserId if user is logged in', fakeAsync(() => {
      authServiceMock.setCurrentUser(mockUser);
      propertyServiceMock.getPropertiesByUserId.and.returnValue(of(mockProperties));

      component.ngOnInit();
      tick(); // for async operations like service calls

      expect(authServiceMock.getCurrentUser).toHaveBeenCalled();
      expect(propertyServiceMock.getPropertiesByUserId).toHaveBeenCalledWith(mockUser.uid);
      expect(component.userProperties).toEqual(mockProperties);
      expect(component.isLoading).toBeFalse();
    }));

    it('should not call getPropertiesByUserId if user is not logged in', fakeAsync(() => {
      authServiceMock.setCurrentUser(null);

      component.ngOnInit();
      tick();

      expect(authServiceMock.getCurrentUser).toHaveBeenCalled();
      expect(propertyServiceMock.getPropertiesByUserId).not.toHaveBeenCalled();
      expect(component.isLoading).toBeFalse();
      expect(component.errorFetching).toContain('logged in');
    }));

    it('should handle error when fetching user properties', fakeAsync(() => {
      authServiceMock.setCurrentUser(mockUser);
      propertyServiceMock.getPropertiesByUserId.and.returnValue(throwError(() => new Error('Fetch error')));

      component.ngOnInit();
      tick();

      expect(component.isLoading).toBeFalse();
      expect(component.errorFetching).toContain('Failed to load');
      expect(component.userProperties).toEqual([]);
    }));
  });

  describe('addNewProperty', () => {
    it('should navigate to /property-form', () => {
      component.addNewProperty();
      expect(routerMock.navigate).toHaveBeenCalledWith(['/property-form']);
    });
  });

  describe('editProperty', () => {
    it('should navigate to /property-form/:id', () => {
      const propertyId = 'propEdit123';
      component.editProperty(propertyId);
      expect(routerMock.navigate).toHaveBeenCalledWith(['/property-form', propertyId.toString()]);
    });
  });

  describe('deleteProperty', () => {
    beforeEach(() => {
      // Set up initial state for component properties
      component.userProperties = [...mockProperties]; // Clone to avoid test interference
      spyOn(window, 'confirm').and.returnValue(true); // Auto-confirm
    });

    it('should call propertyService.deleteProperty and remove property on confirmation', fakeAsync(() => {
      const propertyToDelete = mockProperties[0];
      propertyServiceMock.deleteProperty.and.returnValue(of(undefined));

      component.deleteProperty(propertyToDelete.id);
      tick();

      expect(window.confirm).toHaveBeenCalled();
      expect(propertyServiceMock.deleteProperty).toHaveBeenCalledWith(propertyToDelete.id.toString());
      expect(component.userProperties.length).toBe(mockProperties.length - 1);
      expect(component.userProperties.find(p => p.id === propertyToDelete.id)).toBeUndefined();
    }));

    it('should not call deleteProperty if confirmation is denied', () => {
      (window.confirm as jasmine.Spy).and.returnValue(false);
      const propertyId = 'prop1';

      component.deleteProperty(propertyId);

      expect(propertyServiceMock.deleteProperty).not.toHaveBeenCalled();
    });

    it('should handle error during property deletion', fakeAsync(() => {
      const propertyToDelete = mockProperties[0];
      propertyServiceMock.deleteProperty.and.returnValue(throwError(() => new Error('Delete error')));
      spyOn(window, 'alert'); // spy on alert

      component.deleteProperty(propertyToDelete.id);
      tick();

      expect(propertyServiceMock.deleteProperty).toHaveBeenCalledWith(propertyToDelete.id.toString());
      expect(window.alert).toHaveBeenCalledWith('Failed to delete property. Please try again.');
      expect(component.userProperties.length).toBe(mockProperties.length); // List unchanged
    }));
  });

  describe('loadUserProperties', () => {
    it('should set isLoading to true and then false after properties are loaded', fakeAsync(() => {
      authServiceMock.setCurrentUser(mockUser); // Ensure currentUserId is set
      component.currentUserId = mockUser.uid;
      propertyServiceMock.getPropertiesByUserId.and.returnValue(of(mockProperties));

      component.loadUserProperties(); // Call directly for this test
      expect(component.isLoading).toBeTrue();
      tick();
      expect(component.userProperties).toEqual(mockProperties);
      expect(component.isLoading).toBeFalse();
    }));
  });
});
