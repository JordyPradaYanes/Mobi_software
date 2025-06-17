import { Injectable } from '@angular/core';
import { 
  Firestore, 
  doc, 
  setDoc, 
  deleteDoc, 
  collection, 
  getDocs,
  collectionData,
  query,
  Timestamp
} from '@angular/fire/firestore';
import { Observable, from, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { PropertyService } from './property.service';
import { Property } from '../interfaces/property.interface';

export interface FavoriteItem {
  propertyId: string;
  addedAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {

  constructor(
    private firestore: Firestore,
    private propertyService: PropertyService
  ) {}

  // Agregar una propiedad a favoritos
  addFavorite(userId: string, propertyId: string): Observable<void> {
    const favoriteDocRef = doc(this.firestore, `users/${userId}/favorites/${propertyId}`);
    const favoriteData = {
      propertyId: propertyId,
      addedAt: Timestamp.now()
    };

    return from(setDoc(favoriteDocRef, favoriteData)).pipe(
      catchError(error => {
        console.error('Error adding favorite:', error);
        throw error;
      })
    );
  }

  // Remover una propiedad de favoritos
  removeFavorite(userId: string, propertyId: string): Observable<void> {
    const favoriteDocRef = doc(this.firestore, `users/${userId}/favorites/${propertyId}`);
    
    return from(deleteDoc(favoriteDocRef)).pipe(
      catchError(error => {
        console.error('Error removing favorite:', error);
        throw error;
      })
    );
  }

  // Obtener IDs de propiedades favoritas de un usuario
  getFavoritePropertyIds(userId: string): Observable<string[]> {
    const favoritesCollectionRef = collection(this.firestore, `users/${userId}/favorites`);
    
    return collectionData(favoritesCollectionRef, { idField: 'id' }).pipe(
      map((favorites: any[]) => {
        return favorites.map(fav => fav.propertyId).filter(Boolean);
      }),
      catchError(error => {
        console.error('Error fetching favorite property IDs:', error);
        return of([]);
      })
    );
  }

  // Obtener las propiedades favoritas completas de un usuario
  getFavoriteProperties(userId: string): Observable<Property[]> {
    return this.getFavoritePropertyIds(userId).pipe(
      switchMap(propertyIds => {
        if (propertyIds.length === 0) {
          return of([]);
        }
        return this.propertyService.getPropertiesByIds(propertyIds);
      }),
      catchError(error => {
        console.error('Error fetching favorite properties:', error);
        return of([]);
      })
    );
  }

  // Verificar si una propiedad está en favoritos
  isFavorite(userId: string, propertyId: string): Observable<boolean> {
    return this.getFavoritePropertyIds(userId).pipe(
      map(favoriteIds => favoriteIds.includes(propertyId)),
      catchError(error => {
        console.error('Error checking if property is favorite:', error);
        return of(false);
      })
    );
  }

  // Contar el número de favoritos de un usuario
  getFavoriteCount(userId: string): Observable<number> {
    return this.getFavoritePropertyIds(userId).pipe(
      map(favoriteIds => favoriteIds.length),
      catchError(error => {
        console.error('Error counting favorites:', error);
        return of(0);
      })
    );
  }
}