import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, of, Subscription } from 'rxjs';
import { catchError, tap, finalize } from 'rxjs/operators';

import { FavoritesService } from '../../services/favorites.service';
import { Property } from '../../interfaces/property.interface';
import { PropertyCardComponent } from '../property-card/property-card.component';
import { AuthService } from '../../services/auth.service';
import { NavbarComponent } from '../../ComponentesEstructurales/navbar/navbar.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, PropertyCardComponent, NavbarComponent],
  templateUrl: './favorites.component.html',
  styleUrls: ['./favorites.component.css']
})
export class FavoritesComponent implements OnInit, OnDestroy {
  favoriteProperties$: Observable<Property[]> = of([]);
  private currentUserId: string | null = null;
  isLoading = true;
  error: string | null = null;
  private subscriptions: Subscription[] = [];

  // Color variables for the component
  readonly colors = {
    primary: '#2563eb', // blue-600
    primaryHover: '#1d4ed8', // blue-700
    secondary: '#64748b', // slate-500
    accent: '#f59e0b', // amber-500
    success: '#10b981', // emerald-500
    danger: '#ef4444', // red-500
    dangerHover: '#dc2626', // red-600
    background: '#f8fafc', // slate-50
    cardBackground: '#ffffff',
    textPrimary: '#1e293b', // slate-800
    textSecondary: '#64748b', // slate-500
    border: '#e2e8f0', // slate-200
    shadow: 'rgba(0, 0, 0, 0.1)',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  };

  constructor(
    private favoritesService: FavoritesService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeFavorites();
  }

  ngOnDestroy(): void {
    // Limpiar suscripciones
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private initializeFavorites(): void {
    this.isLoading = true;
    this.error = null;

    // Verificar autenticación usando user$ observable
    const authSub = this.authService.user$.subscribe({
      next: (user) => {
        if (user && user.uid) {
          this.currentUserId = user.uid;
          console.log(`User authenticated: ${this.currentUserId}`);
          this.loadFavoriteProperties();
        } else {
          console.log('User not authenticated');
          this.handleUnauthenticatedUser();
        }
      },
      error: (error) => {
        console.error('Authentication error:', error);
        this.error = 'Error de autenticación. Por favor, inicia sesión nuevamente.';
        this.isLoading = false;
      }
    });

    this.subscriptions.push(authSub);
  }

  private handleUnauthenticatedUser(): void {
    this.favoriteProperties$ = of([]);
    this.isLoading = false;
    this.error = 'Debes iniciar sesión para ver tus favoritos.';
    
    // Opcional: redirigir al login después de un delay
    setTimeout(() => {
      this.router.navigate(['/login']);
    }, 2000);
  }

  loadFavoriteProperties(): void {
    if (!this.currentUserId) {
      this.handleUnauthenticatedUser();
      return;
    }

    this.isLoading = true;
    this.error = null;

    this.favoriteProperties$ = this.favoritesService.getFavoriteProperties(this.currentUserId).pipe(
      tap(properties => {
        console.log('Favorite properties loaded:', properties);
      }),
      catchError(error => {
        console.error('Error loading favorite properties:', error);
        this.error = 'Error al cargar las propiedades favoritas. Por favor, intenta de nuevo.';
        return of([]);
      }),
      finalize(() => {
        this.isLoading = false;
      })
    );
  }

  removeFavorite(propertyId: string): void {
    if (!this.currentUserId) {
      console.error('Cannot remove favorite: User not authenticated.');
      this.error = 'Debes iniciar sesión para realizar esta acción.';
      return;
    }

    if (!propertyId || propertyId.trim() === '') {
      console.error('Invalid property ID for removal.');
      return;
    }

    console.log(`Removing favorite: ${propertyId} for user: ${this.currentUserId}`);
    
    const removeSub = this.favoritesService.removeFavorite(this.currentUserId, propertyId).subscribe({
      next: () => {
        console.log(`Successfully removed property ${propertyId} from favorites`);
        // No necesitamos actualizar manualmente, el observable se actualiza automáticamente
        // gracias a que estamos usando collectionData en tiempo real
      },
      error: (error) => {
        console.error('Error removing favorite:', error);
        this.error = 'Error al quitar de favoritos. Por favor, intenta de nuevo.';
      }
    });

    this.subscriptions.push(removeSub);
  }

  // Método para limpiar errores
  clearError(): void {
    this.error = null;
  }

  // Método para recargar favoritos
  refreshFavorites(): void {
    this.loadFavoriteProperties();
  }

  // Navegar a explorar propiedades
  exploreProperties(): void {
    this.router.navigate(['/properties']);
  }

  // Helper method to get color values for use in template
  getColor(colorKey: keyof typeof this.colors): string {
    return this.colors[colorKey];
  }

  // TrackBy function for better performance in ngFor
  trackByPropertyId(index: number, property: Property): string {
    return property.id?.toString() || index.toString();
  }
}