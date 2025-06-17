import { Injectable } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { map, switchMap, catchError, tap } from 'rxjs/operators';
import { Firestore, collection, doc, setDoc, deleteDoc, getDocs, collectionData } from '@angular/fire/firestore';
import { Property } from '../interfaces/property.interface'; // Corrected import path
import { PropertyService } from './property.service'; // This will be needed


@Injectable({
  providedIn: 'root'
})
export class FavoritesService {

  constructor(
    private firestore: Firestore,
    private propertyService: PropertyService // Replace with actual PropertyService
  ) { }

  addFavorite(userId: string, propertyId: string): Observable<void> {
    const favoritePath = `users/${userId}/favorites`;
    const propertyDocRef = doc(this.firestore, `${favoritePath}/${propertyId}`);
    return from(setDoc(propertyDocRef, { propertyId, addedAt: new Date() })).pipe(
      tap(() => console.log(`Favorite added: user ${userId}, property ${propertyId}`)),
      catchError(error => {
        console.error('Error adding favorite:', error);
        throw error;
      })
    );
  }

  removeFavorite(userId: string, propertyId: string): Observable<void> {
    const favoritePath = `users/${userId}/favorites/${propertyId}`;
    const propertyDocRef = doc(this.firestore, favoritePath);
    return from(deleteDoc(propertyDocRef)).pipe(
      tap(() => console.log(`Favorite removed: user ${userId}, property ${propertyId}`)),
      catchError(error => {
        console.error('Error removing favorite:', error);
        throw error;
      })
    );
  }

  getFavoritePropertyIds(userId: string): Observable<string[]> {
    const favoritesCollectionRef = collection(this.firestore, `users/${userId}/favorites`);
    return collectionData(favoritesCollectionRef, { idField: 'id' }).pipe(
      map(favorites => favorites.map(fav => fav['propertyId'] as string)),
      tap(ids => console.log(`Favorite property IDs for user ${userId}:`, ids)),
      catchError(error => {
        console.error('Error getting favorite property IDs:', error);
        throw error;
      })
    );
  }

  getFavoriteProperties(userId: string): Observable<Property[]> {
    return this.getFavoritePropertyIds(userId).pipe(
      switchMap(propertyIds => {
        if (propertyIds.length === 0) {
          return of([]);
        }
        // Assuming PropertyService has a method like getPropertiesByIds
        // If not, this needs to be adjusted (e.g., calling getPropertyById for each id)
        return this.propertyService.getPropertiesByIds(propertyIds);
      }),
      tap(properties => console.log(`Favorite properties for user ${userId}:`, properties)),
      catchError(error => {
        console.error('Error getting favorite properties:', error);
        throw error;
      })
    );
  }
}
