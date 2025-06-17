import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
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
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Suscribirse a los cambios del usuario
    this.userSubscription = this.authService.user$.subscribe(user => {
      this.currentUser = user;
      if (!user) {
        // Si no hay usuario autenticado, redirigir al login
        this.router.navigate(['/login']);
      }
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
    totalProperties: 15,
    favoriteProperties: 8,
    activeListings: 12,
    viewsThisMonth: 245
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