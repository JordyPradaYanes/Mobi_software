import { Component, type OnInit, type OnDestroy } from "@angular/core"
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  type AbstractControl,
  type ValidationErrors,
} from "@angular/forms"
import { RouterModule, Router } from "@angular/router"
import { CommonModule } from "@angular/common"
import { LoginService } from "../../services/login.service"
import { Subject } from "rxjs"
import { takeUntil } from "rxjs/operators"
import { LoginCredentials } from "../../interfaces/auth.interface"

@Component({
  selector: "app-login",
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  standalone: true,
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.css"],
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm: FormGroup
  isLoading = false
  showPassword = false
  errorMessage = ""
  successMessage = ""
  loginSuccess = false
  redirecting = false
  redirectCountdown = 3

  // Estados de carga
  currentLoadingMessage = ""
  loadingProgress = 0

  // Subject para manejar la destrucción del componente
  private destroy$ = new Subject<void>()

  // Variables de colores consistentes con el diseño
  colors = {
    primary: "#6366f1",
    textDark: "#333333",
    textLight: "#666666",
    borderColor: "#e5e7eb",
    backgroundColor: "#ffffff",
    buttonText: "#ffffff",
  }

  constructor(
    private fb: FormBuilder,
    private loginService: LoginService,
    private router: Router,
  ) {
    this.loginForm = this.createForm()
  }

  ngOnInit(): void {
    this.setupFormValidation()
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  private createForm(): FormGroup {
    return this.fb.group({
      email: ["", [Validators.required, this.emailValidator]],
      password: ["", [Validators.required, Validators.minLength(6)]],
      rememberMe: [false],
    })
  }

  // Configurar validación del formulario
  private setupFormValidation(): void {
    // Limpiar errores cuando el usuario empiece a escribir
    this.loginForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      if (this.errorMessage) {
        this.errorMessage = ""
      }
    })
  }

  // Validador personalizado para email
  emailValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value
    if (!value) return null

    // Verificar que tenga @
    if (!value.includes("@")) {
      return { noAtSymbol: true }
    }

    // Patrón más específico para email
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!emailPattern.test(value)) {
      return { invalidEmailFormat: true }
    }

    return null
  }

  // Método para iniciar sesión con estados de carga mejorados
  async onSubmit(): Promise<void> {
    if (this.loginForm.valid) {
      this.isLoading = true
      this.errorMessage = ""
      this.successMessage = ""
      this.loginSuccess = false
      this.loadingProgress = 0

      const credentials: LoginCredentials = {
        email: this.loginForm.value.email.trim(),
        password: this.loginForm.value.password,
      }

      try {
        // Paso 1: Validando credenciales
        this.currentLoadingMessage = "Validando credenciales..."
        this.loadingProgress = 30

        // Simular un poco de tiempo para mostrar el progreso
        await new Promise((resolve) => setTimeout(resolve, 800))

        // Paso 2: Iniciando sesión
        this.currentLoadingMessage = "Iniciando sesión..."
        this.loadingProgress = 60

        const result = await this.loginService.login(credentials)

        if (!result.success) {
          throw new Error(result.error || "LOGIN_FAILED")
        }

        // Paso 3: Configurando sesión
        this.currentLoadingMessage = "Configurando tu sesión..."
        this.loadingProgress = 90

        // Simular configuración
        await new Promise((resolve) => setTimeout(resolve, 500))

        this.loadingProgress = 100
        this.isLoading = false
        this.loginSuccess = true
        this.successMessage = "¡Bienvenido de vuelta!"

        // Scroll al inicio
        window.scrollTo(0, 0)

        // Iniciar countdown para redirección
        this.startRedirectCountdown()
      } catch (error: any) {
        console.error("Error durante el login:", error)
        this.handleLoginError(error)
      }
    } else {
      this.errorMessage = "Por favor, completa correctamente todos los campos"
      this.markFormGroupTouched()
      window.scrollTo(0, 0)
    }
  }

  // Manejar errores de login
  private handleLoginError(error: any): void {
    this.isLoading = false
    this.loginSuccess = false
    this.loadingProgress = 0

    let errorMessage = "Error inesperado durante el inicio de sesión"

    if (error.message === "LOGIN_FAILED") {
      errorMessage = "Credenciales incorrectas. Verifica tu email y contraseña."
    } else if (error.code) {
      errorMessage = this.getFirebaseErrorMessage(error.code)
    } else if (error.message) {
      errorMessage = error.message
    }

    this.errorMessage = errorMessage
    this.markFormGroupTouched()
    window.scrollTo(0, 0)
  }

  // Obtener mensaje de error de Firebase
  private getFirebaseErrorMessage(errorCode: string): string {
    const errorMessages: { [key: string]: string } = {
      "auth/user-not-found": "No existe una cuenta con este correo electrónico",
      "auth/wrong-password": "Contraseña incorrecta",
      "auth/invalid-email": "El correo electrónico no es válido",
      "auth/user-disabled": "Esta cuenta ha sido deshabilitada",
      "auth/too-many-requests": "Demasiados intentos fallidos. Inténtalo más tarde",
      "auth/network-request-failed": "Error de conexión. Verifica tu internet",
      "auth/invalid-credential": "Credenciales inválidas. Verifica tu email y contraseña",
    }

    return errorMessages[errorCode] || `Error: ${errorCode}`
  }

  // Iniciar countdown para redirección
  private startRedirectCountdown(): void {
    const countdownInterval = setInterval(() => {
      this.redirectCountdown--

      if (this.redirectCountdown <= 0) {
        clearInterval(countdownInterval)
        this.redirecting = true

        // Redirigir después de un breve momento
        setTimeout(() => {
          this.router.navigate(["/dashboard"]) // o la ruta que corresponda
        }, 1000)
      }
    }, 1000)
  }

  // Método para marcar todos los campos como tocados
  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach((key) => {
      const control = this.loginForm.get(key)
      if (control?.invalid) {
        control.markAsTouched()
      }
    })
  }

  // Verificar si un campo tiene errores
  hasError(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName)
    return !!(field && field.invalid && (field.dirty || field.touched))
  }

  // Obtener mensaje de error para un campo específico
  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName)
    if (field && field.errors) {
      if (field.errors["required"]) {
        return this.getRequiredMessage(fieldName)
      }
      if (field.errors["minlength"]) {
        return `Mínimo ${field.errors["minlength"].requiredLength} caracteres.`
      }
      if (field.errors["noAtSymbol"]) {
        return "El email debe contener el símbolo @."
      }
      if (field.errors["invalidEmailFormat"]) {
        return "Formato de email inválido."
      }
    }
    return ""
  }

  private getRequiredMessage(fieldName: string): string {
    const messages: { [key: string]: string } = {
      email: "El correo electrónico es requerido.",
      password: "La contraseña es requerida.",
    }
    return messages[fieldName] || "Este campo es requerido."
  }

  // Métodos para mostrar/ocultar contraseña
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword
  }

  // Método para limpiar errores cuando el usuario empiece a escribir
  onFieldChange(fieldName: string): void {
    if (this.errorMessage) {
      this.errorMessage = ""
    }
  }

  // Navegar al registro
  navigateToRegister(): void {
    this.router.navigate(["/register"])
  }

  // Obtener texto del botón según el estado
  getButtonText(): string {
    if (this.isLoading) return this.currentLoadingMessage
    return "Iniciar Sesión"
  }
}
