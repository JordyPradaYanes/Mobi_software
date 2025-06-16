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

  // Enlaces de navegación públicos
  publicNavLinks: NavLink[] = [{ name: "Inicio", url: "/", hasIcon: false }]

  // Enlaces de navegación para usuarios autenticados
  authenticatedNavLinks: NavLink[] = [
    { name: "Alquilar", url: "/alquilar", hasIcon: false },
    { name: "Comprar", url: "/comprar", hasIcon: false },
    { name: "Vender", url: "/vender", hasIcon: false },
    { name: "Me gusta", url: "/favoritos", hasIcon: true },
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
}
