import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, getDocs, query, where, Timestamp } from '@angular/fire/firestore';
import { Property } from '../interfaces/property.interface';
import { Observable, from, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PropertyService {
  private propertiesCollection = collection(this.firestore, 'properties');

  constructor(private firestore: Firestore) { }

  // Add a new property
  addProperty(propertyData: Omit<Property, 'id' | 'createdAt'>): Observable<string> {
    const propertyWithTimestamp = {
      ...propertyData,
      createdAt: Timestamp.now()
    };
    return from(addDoc(this.propertiesCollection, propertyWithTimestamp)).pipe(
      map(docRef => docRef.id),
      catchError(error => {
        console.error('Error adding property to Firestore:', error);
        return throwError(() => new Error('Failed to add property.'));
      })
    );
  }

  // Get all properties
  getProperties(): Observable<Property[]> {
    return from(getDocs(this.propertiesCollection)).pipe(
      map(snapshot => {
        return snapshot.docs.map(doc => {
          const data = doc.data() as Omit<Property, 'id' | 'createdAt'>; // Type assertion for data from Firestore
          const createdAt = (doc.data()['createdAt'] as Timestamp)?.toDate(); // Convert Firestore Timestamp to Date
          return { id: doc.id, ...data, createdAt } as Property;
        });
      }),
      catchError(error => {
        console.error('Error fetching properties from Firestore:', error);
        return throwError(() => new Error('Failed to fetch properties.'));
      })
    );
  }

  // Get properties by user ID
  getPropertiesByUserId(userId: string): Observable<Property[]> {
    const q = query(this.propertiesCollection, where('userId', '==', userId));
    return from(getDocs(q)).pipe(
      map(snapshot => {
        return snapshot.docs.map(doc => {
          const data = doc.data() as Omit<Property, 'id' | 'createdAt'>; // Type assertion
          const createdAt = (doc.data()['createdAt'] as Timestamp)?.toDate();
          return { id: doc.id, ...data, createdAt } as Property;
        });
      }),
      catchError(error => {
        console.error('Error fetching properties by user ID from Firestore:', error);
        return throwError(() => new Error('Failed to fetch user properties.'));
      })
    );
  }
}
