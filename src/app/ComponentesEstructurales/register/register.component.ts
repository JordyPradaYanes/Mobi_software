import { Component, type OnInit, OnDestroy } from "@angular/core"
import { FormBuilder, type FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from "@angular/forms"
import { Router, RouterModule } from "@angular/router"
import { CommonModule } from "@angular/common"
import { AuthService } from "../../services/auth.service"
import { Firestore, doc, getDoc, setDoc, serverTimestamp } from '@angular/fire/firestore'
import { Subject, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs'
import { takeUntil } from 'rxjs/operators'

interface UserProfile {
  uid: string
  email: string
  fullName: string
  firstName: string
  lastName: string
  phone: string
  address: string
  city: string
  country: string
  dateOfBirth: string
  profileImage: string
  isActive: boolean
  emailVerified: boolean
  createdAt: any
  updatedAt: any
  lastLogin: any
  preferences: {
    notifications: boolean
    darkMode: boolean
    language: string
  }
  role: string
}

@Component({
  selector: "app-register",
  imports: [ReactiveFormsModule, CommonModule, RouterModule],
  standalone: true,
  templateUrl: "./register.component.html",
  styleUrls: ["./register.component.css"],
})
export class RegisterComponent implements OnInit, OnDestroy {
  registerForm: FormGroup
  isLoading = false
  checkingEmail = false
  errorMessage = ""
  successMessage = ""
  registrationSuccess = false
  redirecting = false
  redirectCountdown = 3
  showPassword = false
  showConfirmPassword = false
  
  // Estados de carga
  currentLoadingMessage = ""
  loadingProgress = 0
  
  // Subject para manejar la destrucción del componente
  private destroy$ = new Subject<void>()
  
  // Subject para el debounce del email
  private emailCheck$ = new Subject<string>()

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
    private authService: AuthService,
    private router: Router,
    private firestore: Firestore
  ) {
    this.registerForm = this.fb.group(
      {
        fullName: ["", [Validators.required, Validators.minLength(2), this.nameValidator]],
        email: ["", [Validators.required, this.emailValidator]],
        password: ["", [Validators.required, this.passwordValidator]],
        confirmPassword: ["", [Validators.required]],
        acceptTerms: [false, [Validators.requiredTrue]],
      },
      { validators: this.passwordMatchValidator }
    )
  }

  ngOnInit(): void {
    this.setupEmailValidation()
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  // Configurar validación de email en tiempo real
  private setupEmailValidation(): void {
    // Escuchar cambios en el campo email
    this.registerForm.get('email')?.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(500), // Esperar 500ms después del último cambio
        distinctUntilChanged()
      )
      .subscribe(email => {
        if (email && this.registerForm.get('email')?.valid) {
          this.emailCheck$.next(email)
        }
      })

    // Configurar la validación asíncrona del email
    this.emailCheck$
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(email => {
          if (!email || this.registerForm.get('email')?.invalid) {
            return of(null)
          }
          return this.checkEmailExists(email)
        })
      )
      .subscribe()
  }

  // Verificar si el email ya existe en Firestore
  private async checkEmailExists(email: string): Promise<void> {
    this.checkingEmail = true
    
    try {
      // Buscar en la colección de usuarios por email
      const userDocRef = doc(this.firestore, 'users', email)
      const userDocSnap = await getDoc(userDocRef)
      
      if (userDocSnap.exists()) {
        // El email ya existe
        this.registerForm.get('email')?.setErrors({ emailExists: true })
      } else {
        // El email está disponible
        if (this.registerForm.get('email')?.hasError('emailExists')) {
          this.registerForm.get('email')?.setErrors(null)
        }
      }
    } catch (error) {
      console.error('Error checking email:', error)
    } finally {
      this.checkingEmail = false
    }
  }

  // Validador personalizado para nombres (solo letras y espacios)
  nameValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value
    if (!value) return null
    
    const namePattern = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/
    if (!namePattern.test(value)) {
      return { invalidName: true }
    }
    
    // Verificar que tenga al menos nombre y apellido
    const words = value.trim().split(/\s+/)
    if (words.length < 2) {
      return { incompleteFullName: true }
    }
    
    return null
  }

  // Validador personalizado para email más robusto
  emailValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value
    if (!value) return null

    // Verificar que tenga @
    if (!value.includes('@')) {
      return { noAtSymbol: true }
    }

    // Patrón más específico para email
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!emailPattern.test(value)) {
      return { invalidEmailFormat: true }
    }

    // Verificar que el dominio tenga al menos una extensión válida
    const parts = value.split('@')
    if (parts.length !== 2) {
      return { invalidEmailStructure: true }
    }

    const domain = parts[1]
    const domainParts = domain.split('.')
    
    // Verificar que tenga al menos dominio.extension
    if (domainParts.length < 2) {
      return { invalidDomain: true }
    }

    // Verificar que la extensión tenga al menos 2 caracteres
    const extension = domainParts[domainParts.length - 1]
    if (extension.length < 2) {
      return { invalidExtension: true }
    }

    // Verificar caracteres válidos en dominio
    const domainPattern = /^[a-zA-Z0-9.-]+$/
    if (!domainPattern.test(domain)) {
      return { invalidDomainChars: true }
    }

    return null
  }

  // Validador personalizado para contraseña segura
  passwordValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value
    if (!value) return null

    const errors: ValidationErrors = {}

    // Verificar longitud mínima
    if (value.length < 8) {
      errors['minLength'] = true
    }

    // Verificar que tenga al menos una letra minúscula
    if (!/[a-z]/.test(value)) {
      errors['noLowercase'] = true
    }

    // Verificar que tenga al menos una letra mayúscula
    if (!/[A-Z]/.test(value)) {
      errors['noUppercase'] = true
    }

    // Verificar que tenga al menos un número
    if (!/[0-9]/.test(value)) {
      errors['noNumber'] = true
    }

    // Verificar que tenga al menos un carácter especial
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) {
      errors['noSpecialChar'] = true
    }

    // Verificar que no tenga espacios
    if (/\s/.test(value)) {
      errors['hasSpaces'] = true
    }

    return Object.keys(errors).length > 0 ? errors : null
  }

  // Validador personalizado para confirmar contraseña
  passwordMatchValidator(form: FormGroup) {
    const password = form.get("password")
    const confirmPassword = form.get("confirmPassword")

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true })
      return { passwordMismatch: true }
    }

    return null
  }

  // Método para registrar usuario con estados de carga mejorados
  async onSubmit() {
    if (this.registerForm.valid && !this.checkingEmail) {
      this.isLoading = true
      this.errorMessage = ""
      this.successMessage = ""
      this.registrationSuccess = false
      this.loadingProgress = 0

      const { fullName, email, password } = this.registerForm.value

      try {
        // Paso 1: Verificar email nuevamente
        this.currentLoadingMessage = "Verificando disponibilidad del email..."
        this.loadingProgress = 20
        
        const userExists = await this.checkEmailExistsSync(email)
        if (userExists) {
          throw new Error('EMAIL_EXISTS')
        }

        // Paso 2: Crear usuario en Firebase Auth
        this.currentLoadingMessage = "Creando cuenta de usuario..."
        this.loadingProgress = 40
        
        const userCredential = await this.authService.register(email, password, fullName)
        
        if (!userCredential.success) {
          throw new Error(userCredential.error || 'REGISTRATION_FAILED')
        }

        // Paso 3: Crear perfil en Firestore
        this.currentLoadingMessage = "Configurando tu perfil..."
        this.loadingProgress = 70
        
        await this.createUserProfile(userCredential.user?.uid || '', email, fullName)

        // Paso 4: Finalizar registro
        this.currentLoadingMessage = "Finalizando registro..."
        this.loadingProgress = 90

        // Simular un poco de tiempo para mostrar el progreso
        await new Promise(resolve => setTimeout(resolve, 500))
        
        this.loadingProgress = 100
        this.isLoading = false
        this.registrationSuccess = true
        this.successMessage = "¡Tu cuenta ha sido creada exitosamente!"
        
        // Limpiar formulario
        this.registerForm.reset()
        this.registerForm.markAsPristine()
        this.registerForm.markAsUntouched()
        
        // Scroll al inicio
        window.scrollTo(0, 0)
        
        // Iniciar countdown para redirección
        this.startRedirectCountdown()
        
      } catch (error: any) {
        console.error("Error durante el registro:", error)
        this.handleRegistrationError(error)
      }
    } else {
      this.errorMessage = "Por favor, completa correctamente todos los campos"
      this.markFormGroupTouched()
      window.scrollTo(0, 0)
    }
  }

  // Verificar email de forma síncrona
  private async checkEmailExistsSync(email: string): Promise<boolean> {
    try {
      const userDocRef = doc(this.firestore, 'users', email)
      const userDocSnap = await getDoc(userDocRef)
      return userDocSnap.exists()
    } catch (error) {
      console.error('Error checking email sync:', error)
      return false
    }
  }

  // Crear perfil de usuario en Firestore
  private async createUserProfile(uid: string, email: string, fullName: string): Promise<void> {
    try {
      const nameParts = fullName.trim().split(/\s+/)
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''

      const userProfile: UserProfile = {
        uid,
        email,
        fullName,
        firstName,
        lastName,
        phone: '', // Campo vacío como solicitaste
        address: '', // Campo vacío
        city: '', // Campo vacío
        country: '', // Campo vacío
        dateOfBirth: '', // Campo vacío
        profileImage: '', // Campo vacío
        isActive: true,
        emailVerified: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLogin: null,
        preferences: {
          notifications: true,
          darkMode: false,
          language: 'es'
        },
        role: 'user'
      }

      // Guardar usando el email como ID del documento
      const userDocRef = doc(this.firestore, 'users', email)
      await setDoc(userDocRef, userProfile)

      // También crear un documento con el UID para consultas rápidas
      const uidDocRef = doc(this.firestore, 'usersByUid', uid)
      await setDoc(uidDocRef, { email, createdAt: serverTimestamp() })

    } catch (error) {
      console.error('Error creando perfil de usuario:', error)
      throw error
    }
  }

  // Manejar errores de registro
  private handleRegistrationError(error: any): void {
    this.isLoading = false
    this.registrationSuccess = false
    this.loadingProgress = 0
    
    let errorMessage = "Error inesperado durante el registro"
    
    if (error.message === 'EMAIL_EXISTS') {
      errorMessage = "Este correo electrónico ya está registrado"
      this.registerForm.get('email')?.setErrors({ emailExists: true })
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
      'auth/email-already-in-use': 'Este correo electrónico ya está registrado',
      'auth/weak-password': 'La contraseña debe tener al menos 8 caracteres',
      'auth/invalid-email': 'El correo electrónico no es válido',
      'auth/operation-not-allowed': 'El registro no está habilitado actualmente',
      'auth/network-request-failed': 'Error de conexión. Verifica tu internet',
      'auth/too-many-requests': 'Demasiados intentos. Inténtalo más tarde',
      'permission-denied': 'No tienes permisos para realizar esta acción',
      'unavailable': 'Servicio no disponible. Inténtalo más tarde'
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
          this.router.navigate(["/login"])
        }, 1000)
      }
    }, 1000)
  }

  // Método para marcar todos los campos como tocados
  private markFormGroupTouched(): void {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key)
      if (control?.invalid) {
        control.markAsTouched()
      }
    })
  }

  // Verificar si un campo tiene errores
  hasError(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName)
    return !!(field && field.invalid && (field.dirty || field.touched))
  }

  // Obtener mensaje de error para un campo específico
  getFieldError(fieldName: string): string {
    const field = this.registerForm.get(fieldName)
    if (field && field.errors) {
      // Errores de nombre
      if (field.errors["required"]) {
        return this.getRequiredMessage(fieldName)
      }
      if (field.errors["minlength"]) {
        return `Mínimo ${field.errors["minlength"].requiredLength} caracteres.`
      }
      if (field.errors["invalidName"]) {
        return "El nombre solo debe contener letras y espacios."
      }
      if (field.errors["incompleteFullName"]) {
        return "Ingresa nombre y apellido completos."
      }

      // Errores de email
      if (field.errors["emailExists"]) {
        return "Este correo electrónico ya está registrado."
      }
      if (field.errors["noAtSymbol"]) {
        return "El email debe contener el símbolo @."
      }
      if (field.errors["invalidEmailFormat"]) {
        return "Formato de email inválido."
      }
      if (field.errors["invalidEmailStructure"]) {
        return "El email debe tener formato: usuario@dominio.com"
      }
      if (field.errors["invalidDomain"]) {
        return "El dominio debe tener formato: dominio.com"
      }
      if (field.errors["invalidExtension"]) {
        return "La extensión del dominio debe tener al menos 2 caracteres (.com, .co, .org, etc.)"
      }
      if (field.errors["invalidDomainChars"]) {
        return "El dominio contiene caracteres inválidos."
      }

      // Errores de contraseña
      if (field.errors["minLength"]) {
        return "La contraseña debe tener al menos 8 caracteres."
      }
      if (field.errors["noLowercase"]) {
        return "La contraseña debe tener al menos una letra minúscula."
      }
      if (field.errors["noUppercase"]) {
        return "La contraseña debe tener al menos una letra mayúscula."
      }
      if (field.errors["noNumber"]) {
        return "La contraseña debe tener al menos un número."
      }
      if (field.errors["noSpecialChar"]) {
        return "La contraseña debe tener al menos un carácter especial (!@#$%^&*)"
      }
      if (field.errors["hasSpaces"]) {
        return "La contraseña no debe contener espacios."
      }
      if (field.errors["passwordMismatch"]) {
        return "Las contraseñas no coinciden."
      }
    }
    return ""
  }

  private getRequiredMessage(fieldName: string): string {
    const messages: { [key: string]: string } = {
      'fullName': 'El nombre completo es requerido.',
      'email': 'El correo electrónico es requerido.',
      'password': 'La contraseña es requerida.',
      'confirmPassword': 'Confirma tu contraseña.'
    }
    return messages[fieldName] || 'Este campo es requerido.'
  }

  // Métodos para el indicador de fuerza de contraseña
  getPasswordStrength(): string {
    const passwordControl = this.registerForm.get('password')
    if (!passwordControl || !passwordControl.value) return ''

    const password = passwordControl.value
    let strength = 0

    if (password.length >= 8) strength++
    if (/[a-z]/.test(password)) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength++

    const strengthLabels = ['', 'Muy débil', 'Débil', 'Regular', 'Fuerte', 'Muy fuerte']
    return strengthLabels[strength] || ''
  }

  getPasswordStrengthColor(): string {
    const strength = this.getPasswordStrength()
    const colors: { [key: string]: string } = {
      'Muy débil': '#ef4444',
      'Débil': '#f97316',
      'Regular': '#eab308',
      'Fuerte': '#22c55e',
      'Muy fuerte': '#16a34a'
    }
    return colors[strength] || '#6b7280'
  }

  getPasswordStrengthPercentage(): number {
    const strength = this.getPasswordStrength()
    const percentages: { [key: string]: number } = {
      'Muy débil': 20,
      'Débil': 40,
      'Regular': 60,
      'Fuerte': 80,
      'Muy fuerte': 100
    }
    return percentages[strength] || 0
  }

  // Métodos para verificar requisitos de contraseña
  hasMinLength(): boolean {
    const password = this.registerForm.get('password')?.value
    return password ? password.length >= 8 : false
  }

  hasLowercase(): boolean {
    const password = this.registerForm.get('password')?.value
    return password ? /[a-z]/.test(password) : false
  }

  hasUppercase(): boolean {
    const password = this.registerForm.get('password')?.value
    return password ? /[A-Z]/.test(password) : false
  }

  hasNumber(): boolean {
    const password = this.registerForm.get('password')?.value
    return password ? /[0-9]/.test(password) : false
  }

  hasSpecialChar(): boolean {
    const password = this.registerForm.get('password')?.value
    return password ? /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) : false
  }

  // Verificar si las contraseñas coinciden
  passwordsMatch(): boolean {
    const password = this.registerForm.get('password')?.value
    const confirmPassword = this.registerForm.get('confirmPassword')?.value
    return password && confirmPassword && password === confirmPassword
  }

  // Métodos para mostrar/ocultar contraseñas
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword
  }

    // Navegar a la página principal
  navigateToHome(): void {
    this.router.navigate(["/"])
  }

  // Obtener texto del botón según el estado
  getButtonText(): string {
    if (this.checkingEmail) return 'Verificando email...'
    if (this.isLoading) return this.currentLoadingMessage
    return 'Crear cuenta'
  }
}