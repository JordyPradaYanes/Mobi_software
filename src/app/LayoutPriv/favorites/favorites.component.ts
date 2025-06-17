import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, of } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';

import { FavoritesService } from '../../services/favorites.service';
import { Property } from '../../interfaces/property.interface';
import { PropertyCardComponent } from '../property-card/property-card.component';
import { AuthService } from '../../services/auth.service';
import { NavbarComponent } from '../../ComponentesEstructurales/navbar/navbar.component';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, PropertyCardComponent,NavbarComponent],
  templateUrl: './favorites.component.html',
  styleUrls: ['./favorites.component.css'],
  providers: [
    FavoritesService,
  ]
})
export class FavoritesComponent implements OnInit {
  favoriteProperties$: Observable<Property[]> = of([]);
  private currentUserId: string | null = null;
  isLoading = true;

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
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.initializeFavorites();
  }

  private initializeFavorites(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && currentUser.uid) {
      this.currentUserId = currentUser.uid;
      console.log(`Fetching favorites for user: ${this.currentUserId}`);
      this.loadFavoriteProperties();
    } else {
      console.log('User not logged in. Cannot fetch favorites.');
      this.favoriteProperties$ = of([]);
      this.isLoading = false;
    }
  }

  loadFavoriteProperties(): void {
    if (!this.currentUserId) {
      this.favoriteProperties$ = of([]);
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.favoriteProperties$ = this.favoritesService.getFavoriteProperties(this.currentUserId).pipe(
      map(properties =>
        properties
          .filter(p => p.id !== undefined)
          .map(p => ({
            ...p,
            id: (p.id ?? '').toString()
          }))
      ),
      tap(properties => {
        console.log('Favorite properties displayed:', properties);
        this.isLoading = false;
      }),
      catchError(error => {
        console.error('Error fetching favorite properties in component:', error);
        this.isLoading = false;
        return of([]);
      })
    );
  }

  removeFavorite(propertyIdString: string): void {
    const propertyId = propertyIdString.toString();

    if (!this.currentUserId) {
      console.error('Cannot remove favorite: User ID is not available.');
      return;
    }

    console.log(`Attempting to remove favorite property: ${propertyId} for user ${this.currentUserId}`);
    this.favoritesService.removeFavorite(this.currentUserId, propertyId).pipe(
      catchError(error => {
        console.error('Error removing favorite in component:', error);
        return of(null);
      })
    ).subscribe(response => {
      if (response !== null) {
        console.log(`Successfully initiated removal for property ${propertyId}. Refreshing list.`);
        this.favoriteProperties$ = this.favoriteProperties$.pipe(
          map(properties => properties.filter(p => p.id !== undefined && p.id.toString() !== propertyId))
        );
      } else {
        console.log(`Removal for property ${propertyId} failed or was handled by catchError.`);
      }
    });
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