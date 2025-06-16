import { CommonModule } from "@angular/common"
import { Component, type OnInit, HostListener, type OnDestroy } from "@angular/core"
import { RouterModule } from "@angular/router"
import { AuthService } from "../../services/auth.service"
import { Subscription } from "rxjs"
import type { User } from "@angular/fire/auth"

interface NavLink {
  name: string
  url: string
  hasIcon?: boolean
  iconType?: 'heart' | 'dashboard' | 'profile' | 'form' | 'management'
}

@Component({
  selector: "app-navbar",
  imports: [CommonModule, RouterModule],
  templateUrl: "./navbar.component.html",
  styleUrl: "./navbar.component.css",
})
export class NavbarComponent implements OnInit, OnDestroy {
  isScrolled = false
  isMobileMenuOpen = false
  currentUser: User | null = null
  private userSubscription: Subscription = new Subscription()

  // Variables de colores usados en el componente
  colors = {
    primary: "#6366f1", // Color morado para el logo y botones
    textDark: "#333333", // Texto principal oscuro
    textLight: "#666666", // Texto secundario más claro
    borderColor: "#e5e7eb", // Color de borde
    backgroundColor: "#ffffff", // Fondo blanco
    buttonText: "#ffffff", // Texto blanco para botones
  }

  // Enlaces de navegación públicos (antes del login) - CAMBIADOS A IDs DE SECCIÓN
  publicNavLinks: NavLink[] = [
    { name: "Inicio", url: "#hero", hasIcon: false },
    { name: "Beneficios", url: "#benefits", hasIcon: false },
    { name: "Ubicaciones", url: "#locations", hasIcon: false }
  ]

  // Enlaces de navegación para usuarios autenticados (después del login)
  authenticatedNavLinks: NavLink[] = [
    { name: "Dashboard", url: "/dashboard", hasIcon: true, iconType: 'dashboard' },
    { name: "Propiedades", url: "/property-management", hasIcon: true, iconType: 'management' },
    { name: "Agregar Propiedad", url: "/property-form", hasIcon: true, iconType: 'form' },
    { name: "Favoritos", url: "/favorites", hasIcon: true, iconType: 'heart' },
    { name: "Perfil", url: "/user-profile", hasIcon: true, iconType: 'profile' }
  ]

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    // Suscribirse a los cambios de usuario
    this.userSubscription = this.authService.user$.subscribe((user) => {
      this.currentUser = user
    })
  }

  ngOnDestroy(): void {
    this.userSubscription.unsubscribe()
  }

  // Obtener enlaces según el estado de autenticación
  get navLinks(): NavLink[] {
    return this.currentUser ? this.authenticatedNavLinks : this.publicNavLinks
  }

  // Detectar scroll para cambiar estilos de navbar
  @HostListener("window:scroll", [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 20
  }

  // Alternar menú móvil
  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen
  }

  // Cerrar sesión
  async logout() {
    try {
      await this.authService.logout()
      this.isMobileMenuOpen = false
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    }
  }

  // Obtener nombre del usuario para mostrar
  getUserDisplayName(): string {
    if (this.currentUser?.displayName) {
      return this.currentUser.displayName
    }
    if (this.currentUser?.email) {
      return this.currentUser.email.split("@")[0]
    }
    return "Usuario"
  }

  // Función para hacer scroll suave a secciones
  scrollToSection(sectionId: string, event: Event): void {
    event.preventDefault()
    
    // Remover el # del inicio si existe
    const id = sectionId.startsWith('#') ? sectionId.substring(1) : sectionId
    const element = document.getElementById(id)
    
    if (element) {
      // Cerrar menú móvil si está abierto
      this.isMobileMenuOpen = false
      
      // Obtener la altura del navbar (que está fixed)
      const navbarHeight = 64 // 16 * 4 = 64px (h-16 de Tailwind)
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
      const offsetPosition = elementPosition - navbarHeight
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
  }

  // Verificar si es un enlace de scroll interno
  isScrollLink(url: string): boolean {
    return url.startsWith('#')
  }

  // IMPLEMENTAR EL MÉTODO getIconSvg QUE FALTABA
  getIconSvg(iconType: NavLink["iconType"] | undefined): string {
    switch (iconType) {
      case 'heart':
        return 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z'
      case 'dashboard':
        return 'M3 4a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 12a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H4a1 1 0 01-1-1v-4zM11 4a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V4zM11 12a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z'
      case 'profile':
        return 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
      case 'form':
        return 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
      case 'management':
        return 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
      default:
        return 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z'
    }
  }
}