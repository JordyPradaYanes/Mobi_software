// property-service.ts - Versión corregida
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
  setDoc
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

  // Método corregido con mejor manejo de errores y logging
  addProperty(propertyData: Omit<Property, 'id' | 'createdAt'>): Observable<string> {
    console.log('🔍 Datos de propiedad a guardar:', propertyData);
    
    // Validar que los datos básicos están presentes
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

    console.log('📝 Datos finales a guardar:', propertyWithTimestamp);

    return from(addDoc(this.propertiesCollection, propertyWithTimestamp)).pipe(
      tap(docRef => {
        console.log('✅ Propiedad guardada exitosamente con ID:', docRef.id);
      }),
      map(docRef => docRef.id),
      catchError(error => {
        console.error('❌ Error detallado al guardar propiedad:', {
          code: error.code,
          message: error.message,
          details: error
        });
        
        // Mensajes de error más específicos
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

  // Método alternativo usando setDoc (para debugging)
  addPropertyWithSetDoc(propertyData: Omit<Property, 'id' | 'createdAt'>): Observable<string> {
    const docId = Date.now().toString(); // ID temporal
    const docRef = doc(this.firestore, 'properties', docId);
    
    const propertyWithTimestamp = {
      ...propertyData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      isActive: propertyData.isActive ?? true
    };

    return from(setDoc(docRef, propertyWithTimestamp)).pipe(
      map(() => docId),
      catchError(error => {
        console.error('Error con setDoc:', error);
        return throwError(() => new Error('Failed to add property with setDoc.'));
      })
    );
  }

  // Método para verificar la conexión a Firebase
  testFirebaseConnection(): Observable<boolean> {
    return from(getDocs(this.propertiesCollection)).pipe(
      map(() => true),
      catchError(error => {
        console.error('Error testing Firebase connection:', error);
        return from([false]);
      })
    );
  }

  // Resto de métodos sin cambios...
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