import { TestBed } from '@angular/core/testing';
import { Firestore, doc, setDoc, deleteDoc, collection, getDocs, collectionData } from '@angular/fire/firestore';
import { of, throwError } from 'rxjs';

import { FavoritesService } from './favorites.service';
import { PropertyService } from './property.service';
import { Property } from '../interfaces/property.interface';

// Mocks
class MockFirestore {
  // Add methods that are used by the service
  doc = jasmine.createSpy('doc');
  setDoc = jasmine.createSpy('setDoc');
  deleteDoc = jasmine.createSpy('deleteDoc');
  collection = jasmine.createSpy('collection');
  getDocs = jasmine.createSpy('getDocs');
  collectionData = jasmine.createSpy('collectionData');
}

class MockPropertyService {
  getPropertiesByIds = jasmine.createSpy('getPropertiesByIds');
  // Add other methods if FavoritesService starts using them
}

const mockProperty: Property = {
  id: '1',
  address: '123 Main St',
  price: 200000,
  bedrooms: 3,
  bathrooms: 2,
  userId: 'user1',
  description: 'A nice place',
  imageUrls: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  propertyType: 'casa',
  transactionType: 'venta',
  neighborhood: '',
  city: '',
  totalArea: 0
};

describe('FavoritesService', () => {
  let service: FavoritesService;
  let firestoreMock: MockFirestore;
  let propertyServiceMock: MockPropertyService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        FavoritesService,
        { provide: Firestore, useClass: MockFirestore },
        { provide: PropertyService, useClass: MockPropertyService },
      ],
    });
    service = TestBed.inject(FavoritesService);
    firestoreMock = TestBed.inject(Firestore) as unknown as MockFirestore;
    propertyServiceMock = TestBed.inject(PropertyService) as unknown as MockPropertyService;

    // Default mock implementations
    firestoreMock.setDoc.and.returnValue(Promise.resolve());
    firestoreMock.deleteDoc.and.returnValue(Promise.resolve());
    firestoreMock.doc.and.callFake((fsInstance, path) => `mockDocRef/${path}`); // Return a string path for doc
    firestoreMock.collection.and.callFake((fsInstance, path) => `mockCollectionRef/${path}`);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('addFavorite', () => {
    it('should call setDoc with correct parameters', (done) => {
      const userId = 'user1';
      const propertyId = 'prop1';
      const expectedPath = `users/${userId}/favorites/${propertyId}`;
      // Mock doc to return a specific ref when called with the expected path
      firestoreMock.doc.and.callFake((_fs, path) => {
        if (path === expectedPath) return 'specificMockDocRef';
        return 'genericMockDocRef';
      });

      service.addFavorite(userId, propertyId).subscribe(() => {
        expect(firestoreMock.doc).toHaveBeenCalledWith(jasmine.any(Object), expectedPath); // Check path used for doc
        expect(firestoreMock.setDoc).toHaveBeenCalledWith('specificMockDocRef', jasmine.objectContaining({ propertyId }));
        done();
      });
    });

    it('should handle errors from setDoc', (done) => {
      firestoreMock.setDoc.and.returnValue(Promise.reject(new Error('Firestore error')));
      service.addFavorite('user1', 'prop1').subscribe({
        error: (err) => {
          expect(err).toBeTruthy();
          done();
        }
      });
    });
  });

  describe('removeFavorite', () => {
    it('should call deleteDoc with correct parameters', (done) => {
      const userId = 'user1';
      const propertyId = 'prop1';
      const expectedPath = `users/${userId}/favorites/${propertyId}`;
      firestoreMock.doc.and.callFake((_fs, path) => {
        if (path === expectedPath) return 'specificMockDocRef';
        return 'genericMockDocRef';
      });

      service.removeFavorite(userId, propertyId).subscribe(() => {
        expect(firestoreMock.doc).toHaveBeenCalledWith(jasmine.any(Object), expectedPath);
        expect(firestoreMock.deleteDoc).toHaveBeenCalledWith('specificMockDocRef');
        done();
      });
    });
  });

  describe('getFavoritePropertyIds', () => {
    it('should return an array of property IDs', (done) => {
      const userId = 'user1';
      const mockFavoritesData = [{ propertyId: 'prop1' }, { propertyId: 'prop2' }];
      firestoreMock.collectionData.and.returnValue(of(mockFavoritesData));
      const expectedPath = `users/${userId}/favorites`;


      service.getFavoritePropertyIds(userId).subscribe((ids) => {
        expect(firestoreMock.collection).toHaveBeenCalledWith(jasmine.any(Object), expectedPath);
        expect(ids).toEqual(['prop1', 'prop2']);
        done();
      });
    });
  });

  describe('getFavoriteProperties', () => {
    it('should return favorite properties using PropertyService', (done) => {
      const userId = 'user1';
      const mockPropertyIds = ['prop1', 'prop2'];
      const mockProperties: Property[] = [
        { ...mockProperty, id: 'prop1' , address: 'Addr1' },
        { ...mockProperty, id: 'prop2' , address: 'Addr2' },
      ];

      spyOn(service, 'getFavoritePropertyIds').and.returnValue(of(mockPropertyIds));
      propertyServiceMock.getPropertiesByIds.and.returnValue(of(mockProperties));

      service.getFavoriteProperties(userId).subscribe((properties) => {
        expect(service.getFavoritePropertyIds).toHaveBeenCalledWith(userId);
        expect(propertyServiceMock.getPropertiesByIds).toHaveBeenCalledWith(mockPropertyIds);
        expect(properties.length).toBe(2);
        expect(properties[0].address).toBe('Addr1');
        done();
      });
    });

    it('should return an empty array if no property IDs are found', (done) => {
      spyOn(service, 'getFavoritePropertyIds').and.returnValue(of([]));

      service.getFavoriteProperties('user1').subscribe((properties) => {
        expect(properties).toEqual([]);
        expect(propertyServiceMock.getPropertiesByIds).not.toHaveBeenCalled();
        done();
      });
    });
  });
});
