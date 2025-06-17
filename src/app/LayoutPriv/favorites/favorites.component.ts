import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, of } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators'; // Added map

import { FavoritesService } from '../../services/favorites.service';
import { Property, PropertyCardComponent } from '../property-card/property-card.component';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, PropertyCardComponent],
  templateUrl: './favorites.component.html',
  styleUrls: ['./favorites.component.css'],
  providers: [
    FavoritesService,
    // AuthService is assumed to be provided in root.
  ]
})
export class FavoritesComponent implements OnInit {
  favoriteProperties$: Observable<Property[]> = of([]);
  private currentUserId: string | null = null;

  constructor(
    private favoritesService: FavoritesService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && currentUser.uid) {
      this.currentUserId = currentUser.uid;
      console.log(`Fetching favorites for user: ${this.currentUserId}`);
      this.loadFavoriteProperties();
    } else {
      console.log('User not logged in. Cannot fetch favorites.');
      this.favoriteProperties$ = of([]);
    }
  }

  loadFavoriteProperties(): void {
    if (!this.currentUserId) {
      this.favoriteProperties$ = of([]);
      return;
    }
    this.favoriteProperties$ = this.favoritesService.getFavoriteProperties(this.currentUserId).pipe(
      tap(properties => console.log('Favorite properties displayed:', properties)),
      catchError(error => {
        console.error('Error fetching favorite properties in component:', error);
        return of([]);
      })
    );
  }

  removeFavorite(propertyIdString: string): void {
    const propertyId = propertyIdString.toString(); // Ensure propertyId is a string

    if (!this.currentUserId) {
      console.error('Cannot remove favorite: User ID is not available.');
      return;
    }

    console.log(`Attempting to remove favorite property: ${propertyId} for user ${this.currentUserId}`);
    this.favoritesService.removeFavorite(this.currentUserId, propertyId).pipe(
      catchError(error => {
        console.error('Error removing favorite in component:', error);
        return of(null); // Continue stream even on error
      })
    ).subscribe(response => {
      // Check if the service indicated success (e.g., by not returning null or by returning a specific value)
      // Since removeFavorite returns Observable<void>, a successful emission (even if undefined) means it worked.
      // The 'null' from catchError means it failed.
      if (response !== null) {
        console.log(`Successfully initiated removal for property ${propertyId}. Refreshing list.`);
        // Refresh the list by filtering out the removed property
        this.favoriteProperties$ = this.favoriteProperties$.pipe(
          map(properties => properties.filter(p => p.id.toString() !== propertyId))
        );
      } else {
         console.log(`Removal for property ${propertyId} failed or was handled by catchError.`);
      }
    });
  }
}
