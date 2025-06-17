import { Injectable } from '@angular/core';
import { Firestore, collection, doc, getDoc, query, where, getDocs } from '@angular/fire/firestore';
import { Observable, from, of, forkJoin } from 'rxjs';
import { map, switchMap, catchError, tap } from 'rxjs/operators';
import { Property } from '../interfaces/property.interface';

@Injectable({
  providedIn: 'root'
})
export class PropertyService {

  private propertiesCollection = collection(this.firestore, 'properties');

  constructor(private firestore: Firestore) { }

  // Example method: Get all properties (you might have this already)
  getProperties(): Observable<Property[]> {
    return from(getDocs(this.propertiesCollection)).pipe(
      map(snapshot => snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property))),
      catchError(error => {
        console.error('Error fetching properties:', error);
        return of([]);
      })
    );
  }

  getPropertyById(id: string): Observable<Property | undefined> {
    const propertyDocRef = doc(this.firestore, `properties/${id}`);
    return from(getDoc(propertyDocRef)).pipe(
      map(docSnap => {
        if (docSnap.exists()) {
          return { id: docSnap.id, ...docSnap.data() } as Property;
        }
        return undefined;
      }),
      catchError(error => {
        console.error(`Error fetching property by id ${id}:`, error);
        return of(undefined);
      })
    );
  }

  getPropertiesByIds(ids: string[]): Observable<Property[]> {
    if (!ids || ids.length === 0) {
      return of([]);
    }

    // Firestore 'in' query has a limit of 10 elements.
    // If ids array can be larger, we need to batch the requests.
    // For simplicity here, let's assume ids.length <= 10 or handle batching.

    // Simple approach: fetch each document individually and combine results.
    // This is not the most performant for many IDs but is straightforward.
    const observables = ids.map(id => this.getPropertyById(id).pipe(
      catchError(err => {
        console.error(`Failed to fetch property ${id}`, err);
        return of(undefined); // Return undefined if a single fetch fails
      })
    ));

    return forkJoin(observables).pipe(
      map(properties => properties.filter(p => p !== undefined) as Property[]),
      tap(properties => console.log(`Fetched ${properties.length} properties for IDs: ${ids.join(', ')}`))
    );
  }

  // If you need to add properties (example)
  addProperty(property: Omit<Property, 'id'>): Observable<string | undefined> {
    return from(getDocs(collection(this.firestore, 'properties'))).pipe(
        switchMap(async (snapshot) => {
            const newId = (snapshot.size + 1).toString();
            const propertyRef = doc(this.firestore, `properties/${newId}`);
            await setDoc(propertyRef, { ...property, id: newId }); // Ensure 'id' is part of the document data
            return newId;
        }),
        catchError(error => {
            console.error('Error adding property:', error);
            return of(undefined);
        })
    );
  }

  getPropertiesByUserId(userId: string): Observable<Property[]> {
    const q = query(this.propertiesCollection, where('userId', '==', userId));
    return from(getDocs(q)).pipe(
      map(snapshot => snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property))),
      catchError(error => {
        console.error(`Error fetching properties for user ${userId}:`, error);
        return of([]);
      })
    );
  }

  deleteProperty(propertyId: string): Observable<void> {
    const propertyDocRef = doc(this.firestore, `properties/${propertyId}`);
    return from(deleteDoc(propertyDocRef)).pipe(
      catchError(error => {
        console.error(`Error deleting property ${propertyId}:`, error);
        throw error; // Re-throw the error to be caught by the component
      })
    );
  }
}
