import { Injectable } from '@angular/core';
import { 
  Firestore, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  Timestamp,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc
} from '@angular/fire/firestore';
import { Property } from '../interfaces/property.interface';
import { Observable, from, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PropertyService {
  private propertiesCollection;

  constructor(private firestore: Firestore) {
    this.propertiesCollection = collection(this.firestore, 'properties');
  }

  // Método para obtener una propiedad por ID
  getPropertyById(propertyId: string): Observable<Property | null> {
    const docRef = doc(this.firestore, 'properties', propertyId);
    
    return from(getDoc(docRef)).pipe(
      map(docSnap => {
        if (docSnap.exists()) {
          const data = docSnap.data() as Omit<Property, 'id' | 'createdAt'>;
          const createdAt = (docSnap.data()['createdAt'] as Timestamp)?.toDate();
          return { id: docSnap.id, ...data, createdAt } as Property;
        }
        return null;
      }),
      catchError(error => {
        console.error('Error fetching property by ID:', error);
        return throwError(() => new Error('Failed to fetch property.'));
      })
    );
  }

  // Método para actualizar una propiedad existente
  updateProperty(propertyId: string, propertyData: Partial<Property>): Observable<void> {
    const docRef = doc(this.firestore, 'properties', propertyId);
    
    const updateData = {
      ...propertyData,
      updatedAt: Timestamp.now()
    };

    // Remover campos que no deben actualizarse
    delete updateData.id;
    delete updateData.createdAt;

    return from(updateDoc(docRef, updateData)).pipe(
      tap(() => {
        console.log('✅ Propiedad actualizada exitosamente:', propertyId);
      }),
      catchError(error => {
        console.error('❌ Error actualizando propiedad:', error);
        
        let errorMessage = 'Error desconocido al actualizar la propiedad';
        
        if (error.code === 'permission-denied') {
          errorMessage = 'No tienes permisos para actualizar esta propiedad.';
        } else if (error.code === 'not-found') {
          errorMessage = 'La propiedad no existe.';
        } else if (error.code === 'unavailable') {
          errorMessage = 'Firebase está temporalmente no disponible. Intenta de nuevo.';
        }
        
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  // Método para eliminar una propiedad
  deleteProperty(propertyId: string): Observable<void> {
    const docRef = doc(this.firestore, 'properties', propertyId);
    
    return from(deleteDoc(docRef)).pipe(
      tap(() => {
        console.log('✅ Propiedad eliminada exitosamente:', propertyId);
      }),
      catchError(error => {
        console.error('❌ Error eliminando propiedad:', error);
        return throwError(() => new Error('Failed to delete property.'));
      })
    );
  }

  // Método existente para agregar propiedad
  addProperty(propertyData: Omit<Property, 'id' | 'createdAt'>): Observable<string> {
    console.log('🔍 Datos de propiedad a guardar:', propertyData);
    
    if (!propertyData.userId || !propertyData.propertyType || !propertyData.address) {
      console.error('❌ Datos incompletos:', { 
        hasUserId: !!propertyData.userId,
        hasPropertyType: !!propertyData.propertyType,
        hasAddress: !!propertyData.address
      });
      return throwError(() => new Error('Datos de propiedad incompletos'));
    }

    const propertyWithTimestamp = {
      ...propertyData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      isActive: propertyData.isActive ?? true
    };

    return from(addDoc(this.propertiesCollection, propertyWithTimestamp)).pipe(
      tap(docRef => {
        console.log('✅ Propiedad guardada exitosamente con ID:', docRef.id);
      }),
      map(docRef => docRef.id),
      catchError(error => {
        console.error('❌ Error detallado al guardar propiedad:', error);
        
        let errorMessage = 'Error desconocido al guardar la propiedad';
        
        if (error.code === 'permission-denied') {
          errorMessage = 'No tienes permisos para guardar propiedades. Verifica tu autenticación.';
        } else if (error.code === 'unavailable') {
          errorMessage = 'Firebase está temporalmente no disponible. Intenta de nuevo.';
        } else if (error.code === 'invalid-argument') {
          errorMessage = 'Los datos de la propiedad contienen valores inválidos.';
        }
        
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  // Métodos existentes...
  getProperties(): Observable<Property[]> {
    return from(getDocs(this.propertiesCollection)).pipe(
      map(snapshot => {
        return snapshot.docs.map(doc => {
          const data = doc.data() as Omit<Property, 'id' | 'createdAt'>;
          const createdAt = (doc.data()['createdAt'] as Timestamp)?.toDate();
          return { id: doc.id, ...data, createdAt } as Property;
        });
      }),
      catchError(error => {
        console.error('Error fetching properties from Firestore:', error);
        return throwError(() => new Error('Failed to fetch properties.'));
      })
    );
  }

  getPropertiesByUserId(userId: string): Observable<Property[]> {
    const q = query(this.propertiesCollection, where('userId', '==', userId));
    return from(getDocs(q)).pipe(
      map(snapshot => {
        return snapshot.docs.map(doc => {
          const data = doc.data() as Omit<Property, 'id' | 'createdAt'>;
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
