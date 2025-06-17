import { TestBed } from '@angular/core/testing';
import { Firestore, doc, deleteDoc, getDoc, query, where, getDocs, collection } from '@angular/fire/firestore';
import { of, throwError, from } from 'rxjs';

import { PropertyService } from './property.service';
import { Property } from '../interfaces/property.interface';

// Mock Firestore
class MockFirestore {
  doc = jasmine.createSpy('doc').and.callFake((_fs, path) => `mockDocRef/${path}`);
  deleteDoc = jasmine.createSpy('deleteDoc').and.returnValue(Promise.resolve());
  getDoc = jasmine.createSpy('getDoc'); // Will be configured per test
  query = jasmine.createSpy('query');
  where = jasmine.createSpy('where'); // Static method, but we'll mock its usage contextually
  getDocs = jasmine.createSpy('getDocs'); // Will be configured per test
  collection = jasmine.createSpy('collection').and.callFake((_fs, path) => `mockCollectionRef/${path}`);
}

const mockPropertyData: Omit<Property, 'id'> = {
  address: 'Test Address',
  price: 100000,
  bedrooms: 3,
  bathrooms: 2,
  description: 'Test desc',
  type: 'House',
  status: 'For Sale',
  userId: 'user123',
  imageUrls: [],
  features: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('PropertyService', () => {
  let service: PropertyService;
  let firestoreMock: MockFirestore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PropertyService,
        { provide: Firestore, useClass: MockFirestore },
      ],
    });
    service = TestBed.inject(PropertyService);
    firestoreMock = TestBed.inject(Firestore) as unknown as MockFirestore;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('deleteProperty', () => {
    it('should call deleteDoc with the correct property ID', (done) => {
      const propertyId = 'prop123';
      const expectedPath = `properties/${propertyId}`;

      service.deleteProperty(propertyId).subscribe(() => {
        expect(firestoreMock.doc).toHaveBeenCalledWith(jasmine.any(Object), expectedPath);
        expect(firestoreMock.deleteDoc).toHaveBeenCalledWith(`mockDocRef/${expectedPath}`);
        done();
      });
    });

    it('should handle errors from deleteDoc', (done) => {
      const propertyId = 'propError';
      firestoreMock.deleteDoc.and.returnValue(Promise.reject(new Error('Firestore delete error')));

      service.deleteProperty(propertyId).subscribe({
        error: (err) => {
          expect(err).toBeTruthy();
          expect(err.message).toContain('Firestore delete error');
          done();
        }
      });
    });
  });

  describe('getPropertiesByIds', () => {
    it('should return an empty array if no IDs are provided', (done) => {
      service.getPropertiesByIds([]).subscribe(properties => {
        expect(properties).toEqual([]);
        done();
      });
    });

    it('should fetch and return properties for given IDs', (done) => {
      const ids = ['id1', 'id2'];
      const mockProp1: Property = { id: 'id1', ...mockPropertyData, address: 'Addr 1' };
      const mockProp2: Property = { id: 'id2', ...mockPropertyData, address: 'Addr 2' };

      firestoreMock.getDoc.and.callFake(ref => {
        if (ref === `mockDocRef/properties/id1`) {
          return Promise.resolve({ exists: () => true, id: 'id1', data: () => ({...mockPropertyData, address: 'Addr 1'}) });
        }
        if (ref === `mockDocRef/properties/id2`) {
          return Promise.resolve({ exists: () => true, id: 'id2', data: () => ({...mockPropertyData, address: 'Addr 2'}) });
        }
        return Promise.resolve({ exists: () => false });
      });

      // Spy on getPropertyById which is used internally by getPropertiesByIds
      spyOn(service, 'getPropertyById').and.callThrough();


      service.getPropertiesByIds(ids).subscribe(properties => {
        expect(service.getPropertyById).toHaveBeenCalledTimes(2);
        expect(service.getPropertyById).toHaveBeenCalledWith('id1');
        expect(service.getPropertyById).toHaveBeenCalledWith('id2');
        expect(properties.length).toBe(2);
        expect(properties.find(p => p.id === 'id1')?.address).toBe('Addr 1');
        expect(properties.find(p => p.id === 'id2')?.address).toBe('Addr 2');
        done();
      });
    });

    it('should filter out undefined results for non-existent IDs', (done) => {
      const ids = ['id1', 'nonExistentId'];
      const mockProp1: Property = { id: 'id1', ...mockPropertyData };

      firestoreMock.getDoc.and.callFake(ref => {
        if (ref === `mockDocRef/properties/id1`) {
          return Promise.resolve({ exists: () => true, id: 'id1', data: () => mockPropertyData });
        }
        return Promise.resolve({ exists: () => false }); // For nonExistentId
      });

      spyOn(service, 'getPropertyById').and.callThrough();

      service.getPropertiesByIds(ids).subscribe(properties => {
        expect(properties.length).toBe(1);
        expect(properties[0].id).toBe('id1');
        done();
      });
    });
  });

  describe('getPropertiesByUserId', () => {
    it('should return properties for a specific user ID', (done) => {
      const userId = 'userTest1';
      const mockUserProperties = [
        { id: 'propUser1', ...mockPropertyData, userId: userId, address: 'User Addr 1' },
        { id: 'propUser2', ...mockPropertyData, userId: userId, address: 'User Addr 2' },
      ];
      const mockSnapshot = {
        docs: mockUserProperties.map(p => ({ id: p.id, data: () => p }))
      };

      firestoreMock.getDocs.and.returnValue(Promise.resolve(mockSnapshot as any));
      // Mock the query and where to make them return something identifiable if needed,
      // but the main thing is that getDocs uses the result of query.
      const mockQueryRef = 'mockQueryRef';
      firestoreMock.query.and.returnValue(mockQueryRef as any);


      service.getPropertiesByUserId(userId).subscribe(properties => {
        expect(firestoreMock.collection).toHaveBeenCalledWith(jasmine.any(Object), 'properties');
        // Check that query was called with the properties collection and a where clause
        // The actual where clause instance is tricky to check without deeper mocking,
        // so we check that query was called and getDocs returned the expected data.
        expect(firestoreMock.query).toHaveBeenCalledWith(`mockCollectionRef/properties`, jasmine.any(Object)); // where('userId', '==', userId)
        expect(firestoreMock.getDocs).toHaveBeenCalledWith(mockQueryRef as any);
        expect(properties.length).toBe(2);
        expect(properties[0].address).toBe('User Addr 1');
        done();
      });
    });

     it('should return an empty array if firestore throws error', (done) => {
      const userId = 'userError';
      firestoreMock.getDocs.and.returnValue(Promise.reject(new Error('Firestore query error')));
      const mockQueryRef = 'mockQueryRefError';
      firestoreMock.query.and.returnValue(mockQueryRef as any);

      service.getPropertiesByUserId(userId).subscribe(properties => {
        expect(properties).toEqual([]);
        done();
      });
    });
  });

  describe('getPropertyById', () => {
    it('should return a property if found', (done) => {
      const propId = 'propFound';
      const mockProp: Property = { id: propId, ...mockPropertyData };
      firestoreMock.getDoc.and.returnValue(Promise.resolve({
        exists: () => true, id: propId, data: () => mockPropertyData
      } as any));
      const expectedPath = `properties/${propId}`;

      service.getPropertyById(propId).subscribe(property => {
        expect(firestoreMock.doc).toHaveBeenCalledWith(jasmine.any(Object), expectedPath);
        expect(firestoreMock.getDoc).toHaveBeenCalledWith(`mockDocRef/${expectedPath}`);
        expect(property).toEqual(mockProp);
        done();
      });
    });

    it('should return undefined if property not found', (done) => {
      const propId = 'propNotFound';
      firestoreMock.getDoc.and.returnValue(Promise.resolve({ exists: () => false } as any));

      service.getPropertyById(propId).subscribe(property => {
        expect(property).toBeUndefined();
        done();
      });
    });

     it('should return undefined on firestore error', (done) => {
      const propId = 'propError';
      firestoreMock.getDoc.and.returnValue(Promise.reject(new Error("Firestore error")));

      service.getPropertyById(propId).subscribe(property => {
        expect(property).toBeUndefined();
        done();
      });
    });
  });

});
