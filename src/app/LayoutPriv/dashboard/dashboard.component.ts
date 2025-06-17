import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { PropertyService } from '../../services/property.service';
import { FavoritesService } from '../../services/favorites.service';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { User } from '@angular/fire/auth';
import { Subscription } from 'rxjs';
import { MainComponent } from "../../main/main.component";
import { NavbarComponent } from "../../ComponentesEstructurales/navbar/navbar.component";

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  
  currentUser: User | null = null;
  private userSubscription?: Subscription;
  
  constructor(
    private router: Router,
    private authService: AuthService,
    private propertyService: PropertyService, // Added
    private favoritesService: FavoritesService // Added
  ) {}

  ngOnInit() {
    this.userSubscription = this.authService.user$.subscribe(user => {
      this.currentUser = user;
      if (user && user.uid) { // Ensure user and user.uid exist
        this.loadDashboardStats(user.uid);
      } else if (!user) {
        this.router.navigate(['/login']);
        // Reset stats if user logs out or no user
        this.dashboardStats = {
          totalProperties: 0,
          favoriteProperties: 0,
          activeListings: 0,
          viewsThisMonth: 0
        };
      }
    });
  }

  private loadDashboardStats(userId: string): void {
    const userProperties$ = this.propertyService.getPropertiesByUserId(userId).pipe(
      catchError(err => {
        console.error('Error fetching user properties:', err);
        return of([]); // Return empty array on error
      })
    );

    const favoriteProperties$ = this.favoritesService.getFavoriteProperties(userId).pipe(
      catchError(err => {
        console.error('Error fetching favorite properties:', err);
        return of([]); // Return empty array on error
      })
    );

    forkJoin({
      userProperties: userProperties$,
      favoriteProperties: favoriteProperties$
    }).subscribe(results => {
      // Assuming all user's properties are active for now
      this.dashboardStats.totalProperties = results.userProperties.length;
      this.dashboardStats.activeListings = results.userProperties.length;
      this.dashboardStats.favoriteProperties = results.favoriteProperties.length;
      this.dashboardStats.viewsThisMonth = 0; // Static value as per plan
    });
  }

  ngOnDestroy() {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  // Obtener información del usuario
  get userInfo() {
    return {
      name: this.currentUser?.displayName || 'Usuario',
      email: this.currentUser?.email || '',
      photoURL: this.currentUser?.photoURL || null,
      emailVerified: this.currentUser?.emailVerified || false,
      uid: this.currentUser?.uid || ''
    };
  }

  // Estadísticas del dashboard
  dashboardStats = {
    totalProperties: 0,
    favoriteProperties: 0,
    activeListings: 0,
    viewsThisMonth: 0 // As per plan, set to 0
  };

  // Navegación a diferentes secciones
  navigateToSection(route: string) {
    this.router.navigate([route]);
  }

  // Funciones para acciones rápidas
  addNewProperty() {
    this.router.navigate(['/property-form']);
  }

  viewFavorites() {
    this.router.navigate(['/favorites']);
  }

  manageProperties() {
    this.router.navigate(['/property-management']);
  }

  editProfile() {
    this.router.navigate(['/user-profile']);
  }

  // Función para cerrar sesión
  async logout() {
    try {
      await this.authService.logout();
      // El AuthService ya maneja la redirección
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }
}