import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { PropertyService } from '../../services/property.service';
import { AuthService } from '../../services/auth.service';
import { Property } from '../../interfaces/property.interface';
import { PropertyCardComponent } from '../property-card/property-card.component';
import { NavbarComponent } from '../../ComponentesEstructurales/navbar/navbar.component';

@Component({
  selector: 'app-property-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PropertyCardComponent, 
    NavbarComponent
  ],
  templateUrl: './property-management.component.html',
  styleUrls: ['./property-management.component.css']
})
export class PropertyManagementComponent implements OnInit {
  userProperties: Property[] = [];
  filteredProperties: Property[] = [];
  isLoading: boolean = true;
  errorFetching: string | null = null;
  currentUserId: string | null = null;
  
  // Search and filter properties
  searchTerm: string = '';
  filterType: string = '';

  // Modal properties
  selectedProperty: Property | null = null;
  isModalOpen: boolean = false;
  isDeleting: boolean = false;

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
      this.errorFetching = 'Debes iniciar sesión para gestionar propiedades.';
    }
  }

  loadUserProperties(): void {
    if (!this.currentUserId) return;

    this.isLoading = true;
    this.errorFetching = null;
    
    this.propertyService.getPropertiesByUserId(this.currentUserId).pipe(
      tap(properties => {
        this.userProperties = properties;
        this.filteredProperties = [...properties];
        console.log('User properties loaded:', properties);
        this.isLoading = false;
      }),
      catchError(error => {
        console.error('Error fetching user properties in component:', error);
        this.errorFetching = 'Error al cargar tus propiedades. Por favor, intenta de nuevo más tarde.';
        this.isLoading = false;
        return of([]);
      })
    ).subscribe();
  }

  // Modal methods
  viewProperty(property: Property): void {
    this.selectedProperty = property;
    this.isModalOpen = true;
    // Prevent body scroll when modal is open
    document.body.classList.add('overflow-hidden');
  }

  closeModal(): void {
    this.selectedProperty = null;
    this.isModalOpen = false;
    // Restore body scroll
    document.body.classList.remove('overflow-hidden');
  }

  addNewProperty(): void {
    this.router.navigate(['/property-form']);
  }

  editProperty(propertyId: string | undefined): void {
    if (propertyId !== undefined && propertyId !== null) {
      this.router.navigate(['/property-form', propertyId.toString()]);
    } else {
      console.error('Property ID is undefined or null. Cannot navigate to edit property.');
    }
  }

  deleteProperty(propertyId: string | undefined): void {
    if (propertyId === undefined || propertyId === null) {
      console.error('Property ID is undefined or null. Cannot delete property.');
      return;
    }

    const idStr = propertyId.toString();
    
    // Show confirmation dialog
    if (this.showDeleteConfirmation()) {
      this.isDeleting = true;
      
      this.propertyService.deleteProperty(idStr).pipe(
        tap(() => {
          console.log(`Property ${idStr} deleted successfully.`);
          // Remove property from both arrays to update UI immediately
          this.userProperties = this.userProperties.filter(p => p.id?.toString() !== idStr);
          this.filteredProperties = this.filteredProperties.filter(p => p.id?.toString() !== idStr);
          
          // Close modal if the deleted property was being viewed
          if (this.selectedProperty?.id?.toString() === idStr) {
            this.closeModal();
          }
          
          this.isDeleting = false;
          this.showSuccessMessage('Propiedad eliminada exitosamente');
        }),
        catchError(error => {
          console.error(`Error deleting property ${idStr} in component:`, error);
          this.isDeleting = false;
          this.showErrorMessage('Error al eliminar la propiedad. Por favor, intenta de nuevo.');
          return of(null);
        })
      ).subscribe();
    }
  }

  filterProperties(): void {
    let filtered = [...this.userProperties];

    // Filter by search term
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(property => 
        property.propertyType?.toLowerCase().includes(searchLower) ||
        property.address?.toLowerCase().includes(searchLower) ||
        property.transactionType?.toLowerCase().includes(searchLower) ||
        property.description?.toLowerCase().includes(searchLower) ||
        property.neighborhood?.toLowerCase().includes(searchLower) ||
        property.city?.toLowerCase().includes(searchLower)
      );
    }

    // Filter by property type
    if (this.filterType) {
      filtered = filtered.filter(property => 
        property.propertyType?.toLowerCase() === this.filterType.toLowerCase()
      );
    }

    this.filteredProperties = filtered;
  }

  trackByPropertyId(index: number, property: Property): any {
    return property.id || index;
  }

  getActiveProperties(): number {
    return this.userProperties.filter(property => 
      property.isActive !== false
    ).length;
  }

  getAveragePrice(): number {
    if (this.userProperties.length === 0) return 0;
    
    const totalPrice = this.userProperties.reduce((sum, property) => {
      return sum + (property.price || 0);
    }, 0);
    
    return totalPrice / this.userProperties.length;
  }

  // Utility methods
  getPropertyTypeLabel(type: string): string {
    const types: { [key: string]: string } = {
      'casa': 'Casa',
      'apartamento': 'Apartamento',
      'oficina': 'Oficina',
      'local': 'Local Comercial',
      'terreno': 'Terreno',
      'bodega': 'Bodega',
      'finca': 'Finca'
    };
    return types[type] || type;
  }

  getTransactionTypeLabel(type: string): string {
    const types: { [key: string]: string } = {
      'venta': 'Venta',
      'alquiler': 'Alquiler',
      'alquiler-venta': 'Alquiler/Venta'
    };
    return types[type] || type;
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price);
  }

  formatDate(date: Date | undefined): string {
    if (!date) return 'No disponible';
    return new Date(date).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  private showDeleteConfirmation(): boolean {
    return window.confirm(
      '¿Estás seguro de que deseas eliminar esta propiedad?\n\nEsta acción no se puede deshacer.'
    );
  }

  private showSuccessMessage(message: string): void {
    // You can implement a toast notification service here
    setTimeout(() => {
      alert(message);
    }, 100);
  }

  private showErrorMessage(message: string): void {
    alert(message);
  }

  // Method to clear all filters
  clearFilters(): void {
    this.searchTerm = '';
    this.filterType = '';
    this.filteredProperties = [...this.userProperties];
  }

  // Method to refresh properties
  refreshProperties(): void {
    this.loadUserProperties();
  }

  // Handle modal backdrop click
  onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }

  // Handle escape key to close modal
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.isModalOpen) {
      this.closeModal();
    }
  }
}