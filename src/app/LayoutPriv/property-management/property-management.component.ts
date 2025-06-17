import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router'; // Added Router
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { PropertyService } from '../../services/property.service';
import { AuthService } from '../../services/auth.service';
import { Property } from '../../interfaces/property.interface'; // Corrected path as per prompt
import { PropertyCardComponent } from '../property-card/property-card.component'; // Assuming standalone

@Component({
  selector: 'app-property-management',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    PropertyCardComponent
  ],
  templateUrl: './property-management.component.html',
  styleUrls: ['./property-management.component.css']
  // PropertyService and AuthService are typically provided in root.
})
export class PropertyManagementComponent implements OnInit {
  userProperties: Property[] = [];
  isLoading: boolean = true;
  errorFetching: string | null = null;
  currentUserId: string | null = null;

  constructor(
    private propertyService: PropertyService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && currentUser.uid) {
      this.currentUserId = currentUser.uid;
      console.log(`Fetching properties for user: ${this.currentUserId}`);
      this.loadUserProperties();
    } else {
      console.log('User not logged in. Cannot fetch properties.');
      this.isLoading = false;
      this.errorFetching = 'You must be logged in to manage properties.';
    }
  }

  loadUserProperties(): void {
    if (!this.currentUserId) return;

    this.isLoading = true;
    this.errorFetching = null;
    this.propertyService.getPropertiesByUserId(this.currentUserId).pipe(
      tap(properties => {
        this.userProperties = properties;
        console.log('User properties loaded:', properties);
        this.isLoading = false;
      }),
      catchError(error => {
        console.error('Error fetching user properties in component:', error);
        this.errorFetching = 'Failed to load your properties. Please try again later.';
        this.isLoading = false;
        return of([]); // Return empty array on error to complete the observable stream
      })
    ).subscribe();
  }

  addNewProperty(): void {
    this.router.navigate(['/property-form']); // Route for adding new property
  }

  editProperty(propertyId: string | number): void {
    // Property ID from interface is number, but Firestore uses string. Ensure consistency.
    this.router.navigate(['/property-form', propertyId.toString()]);
  }

  deleteProperty(propertyId: string | number): void {
    const idStr = propertyId.toString();
    if (window.confirm('Are you sure you want to delete this property?')) {
      this.propertyService.deleteProperty(idStr).pipe(
        tap(() => {
          console.log(`Property ${idStr} deleted successfully.`);
          // Remove property from local array to update UI immediately
          this.userProperties = this.userProperties.filter(p => p.id.toString() !== idStr);
        }),
        catchError(error => {
          console.error(`Error deleting property ${idStr} in component:`, error);
          alert('Failed to delete property. Please try again.');
          // Return of(null) or rethrow if you want to handle it further up,
          // for now, alert is simple feedback.
          return of(null);
        })
      ).subscribe();
    }
  }
}
