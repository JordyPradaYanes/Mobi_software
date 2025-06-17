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

interface DashboardStats {
  totalProperties: number;
  favoriteProperties: number;
  activeListings: number;
  viewsThisMonth: number;
}

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
  isLoadingStats = true;
  
  // Estadísticas del dashboard
  dashboardStats: DashboardStats = {
    totalProperties: 0,
    favoriteProperties: 0,
    activeListings: 0,
    viewsThisMonth: 0
  };
  
  constructor(
    private router: Router,
    private authService: AuthService,
    private propertyService: PropertyService,
    private favoritesService: FavoritesService
  ) {}

  ngOnInit() {
    this.userSubscription = this.authService.user$.subscribe(user => {
      this.currentUser = user;
      if (user && user.uid) {
        this.loadDashboardStats(user.uid);
      } else if (!user) {
        this.router.navigate(['/login']);
        this.resetStats();
      }
    });
  }

  private loadDashboardStats(userId: string): void {
    this.isLoadingStats = true;
    
    // Crear observables para cada estadística
    const userPropertiesCount$ = this.propertyService.getUserPropertiesCount(userId).pipe(
      catchError(err => {
        console.error('Error fetching user properties count:', err);
        return of(0);
      })
    );

    const favoritePropertiesCount$ = this.favoritesService.getFavoriteCount(userId).pipe(
      catchError(err => {
        console.error('Error fetching favorite properties count:', err);
        return of(0);
      })
    );

    // Para propiedades activas, obtenemos las propiedades del usuario y filtramos las activas
    const activeListingsCount$ = this.propertyService.getPropertiesByUserId(userId).pipe(
      map(properties => properties.filter(prop => prop.isActive !== false).length),
      catchError(err => {
        console.error('Error fetching active listings count:', err);
        return of(0);
      })
    );

    // Las vistas las mantenemos en 0 por ahora como estaba planificado
    const viewsThisMonth$ = of(0);

    // Opcional: Total de propiedades en el sistema (no solo del usuario)
    const totalPropertiesInSystem$ = this.propertyService.getTotalPropertiesCount().pipe(
      catchError(err => {
        console.error('Error fetching total properties count:', err);
        return of(0);
      })
    );

    // Combinar todas las consultas
    forkJoin({
      userProperties: userPropertiesCount$,
      favoriteProperties: favoritePropertiesCount$,
      activeListings: activeListingsCount$,
      viewsThisMonth: viewsThisMonth$,
      totalPropertiesInSystem: totalPropertiesInSystem$
    }).subscribe({
      next: (results) => {
        this.dashboardStats = {
          // Puedes elegir mostrar las propiedades del usuario o del sistema completo
          totalProperties: results.userProperties, // Cambia a results.totalPropertiesInSystem si quieres el total del sistema
          favoriteProperties: results.favoriteProperties,
          activeListings: results.activeListings,
          viewsThisMonth: results.viewsThisMonth
        };
        this.isLoadingStats = false;
        console.log('📊 Dashboard stats loaded:', this.dashboardStats);
      },
      error: (error) => {
        console.error('Error loading dashboard stats:', error);
        this.resetStats();
        this.isLoadingStats = false;
      }
    });
  }

  private resetStats(): void {
    this.dashboardStats = {
      totalProperties: 0,
      favoriteProperties: 0,
      activeListings: 0,
      viewsThisMonth: 0
    };
    this.isLoadingStats = false;
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

  // Función para refrescar las estadísticas manualmente
  refreshStats() {
    if (this.currentUser?.uid) {
      this.loadDashboardStats(this.currentUser.uid);
    }
  }
}