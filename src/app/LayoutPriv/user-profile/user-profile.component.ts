import { Component, type OnInit, type OnDestroy } from "@angular/core"
import { FormBuilder, type FormGroup, Validators, ReactiveFormsModule } from "@angular/forms"
import { Router } from "@angular/router"
import { CommonModule } from "@angular/common"
import { AuthService } from "../../services/auth.service"
import { UserService, UserProfile } from "../../services/user.service"
import {
  type User,
  updateProfile,
  updatePassword,
  verifyBeforeUpdateEmail, 
} from "@angular/fire/auth"
import type { Subscription } from "rxjs"
import { NavbarComponent } from "../../ComponentesEstructurales/navbar/navbar.component"

@Component({
  selector: "app-user-profile",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NavbarComponent],
  templateUrl: "./user-profile.component.html",
  styleUrls: ["./user-profile.component.css"],
})
export class UserProfileComponent implements OnInit, OnDestroy {
  currentUser: User | null = null
  userProfile: UserProfile | null = null
  private userSubscription?: Subscription

  profileForm: FormGroup
  passwordForm: FormGroup

  // Estados del componente
  isLoading = false
  isUpdatingProfile = false
  isUpdatingPassword = false
  showPasswordForm = false
  showCurrentPassword = false
  showNewPassword = false
  showConfirmPassword = false

  // ✅ Nuevo estado para cambio de email
  isChangingEmail = false
  emailVerificationSent = false

  // Mensajes
  successMessage = ""
  errorMessage = ""
  passwordSuccessMessage = ""
  passwordErrorMessage = ""

  constructor(
    private router: Router,
    private authService: AuthService,
    private userService: UserService,
    private formBuilder: FormBuilder,
  ) {
    this.profileForm = this.formBuilder.group({
      displayName: ["", [Validators.required, Validators.minLength(2)]],
      email: ["", [Validators.required, Validators.email]],
      phoneNumber: ["", [Validators.pattern(/^[+]?[\d\s\-()]+$/)]],
      photoURL: ["", [Validators.pattern(/^https?:\/\/.+\.(jpg|jpeg|png|gif)$/i)]],
    })

    this.passwordForm = this.formBuilder.group(
      {
        currentPassword: ["", [Validators.required]],
        newPassword: ["", [Validators.required, Validators.minLength(6)]],
        confirmPassword: ["", [Validators.required]],
      },
      { validators: this.passwordMatchValidator },
    )
  }

  ngOnInit() {
    this.isLoading = true

    this.userSubscription = this.authService.user$.subscribe(async (user) => {
      this.currentUser = user
      if (!user) {
        console.log("❌ No hay usuario autenticado, redirigiendo a login")
        this.router.navigate(["/login"])
      } else {
        console.log("✅ Usuario autenticado:", {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
        })
        await this.loadUserData()
      }
      this.isLoading = false
    })
  }

  ngOnDestroy() {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe()
    }
  }

  async loadUserData() {
    if (!this.currentUser) {
      console.log("❌ No hay currentUser en loadUserData")
      return
    }

    try {
      console.log("🔍 === INICIANDO CARGA DE DATOS ===")
      console.log("👤 Usuario actual:", {
        uid: this.currentUser.uid,
        email: this.currentUser.email,
        emailVerified: this.currentUser.emailVerified,
      })

      const token = await this.currentUser.getIdToken()
      console.log("✅ Token obtenido:", token ? "SÍ" : "NO")

      console.log("🔧 UserService disponible:", !!this.userService)

      console.log("📥 Intentando cargar perfil desde Firestore...")
      this.userProfile = await this.userService.getUserProfile(this.currentUser.uid)
      console.log("📋 Perfil cargado desde Firestore:", this.userProfile)

      if (!this.userProfile) {
        console.log("📝 No existe perfil, creando nuevo...")

        const newProfileData = {
          uid: this.currentUser.uid,
          email: this.currentUser.email || "",
          displayName: this.currentUser.displayName || "",
          photoURL: this.currentUser.photoURL || "",
          role: "USER" as const,
        }
        console.log("📄 Datos para nuevo perfil:", newProfileData)

        await this.userService.createUserProfile(this.currentUser.uid, newProfileData)
        console.log("✅ Perfil creado exitosamente")

        this.userProfile = await this.userService.getUserProfile(this.currentUser.uid)
        console.log("🔄 Perfil recargado:", this.userProfile)
      }

      const formData = {
        displayName: this.currentUser.displayName || this.userProfile?.displayName || "",
        email: this.currentUser.email || this.userProfile?.email || "",
        phoneNumber: this.userProfile?.phoneNumber || "",
        photoURL: this.currentUser.photoURL || this.userProfile?.photoURL || "",
      }

      console.log("📝 Datos para formulario:", formData)
      this.profileForm.patchValue(formData)
      console.log("✅ Formulario actualizado exitosamente")
    } catch (error: any) {
      console.error("❌ === ERROR DETALLADO ===")
      console.error("Código de error:", error.code)
      console.error("Mensaje:", error.message)
      console.error("Error completo:", error)

      if (error.code === "permission-denied") {
        this.errorMessage = "❌ Error de permisos. Verifica que estés autenticado correctamente."
      } else if (error.code === "not-found") {
        this.errorMessage = "❌ Documento no encontrado. Se creará un nuevo perfil."
      } else if (error.code === "unauthenticated") {
        this.errorMessage = "❌ Usuario no autenticado. Redirigiendo al login..."
        this.router.navigate(["/login"])
      } else {
        this.errorMessage = `❌ Error: ${error.message}`
      }
    }
  }

  // ✅ MÉTODO ACTUALIZADO PARA MANEJAR CAMBIO DE EMAIL
  async updateProfile() {
    if (this.profileForm.valid && this.currentUser) {
      this.isUpdatingProfile = true
      this.errorMessage = ""
      this.successMessage = ""

      try {
        const formData = this.profileForm.value
        const emailChanged = formData.email !== this.currentUser.email

        // 1. Actualizar Firebase Authentication (sin email)
        await updateProfile(this.currentUser, {
          displayName: formData.displayName,
          photoURL: formData.photoURL || null,
        })

        // 2. Manejar cambio de email por separado
        if (emailChanged) {
          console.log("📧 Email cambió, enviando verificación...")
          this.isChangingEmail = true

          try {
            // ✅ Usar verifyBeforeUpdateEmail en lugar de updateEmail
            await verifyBeforeUpdateEmail(this.currentUser, formData.email)

            this.emailVerificationSent = true
            this.successMessage =
              "📧 Se ha enviado un email de verificación al nuevo correo. Verifica tu email para completar el cambio."

            // No actualizar el email en Firestore hasta que se verifique
            console.log("✅ Email de verificación enviado")
          } catch (emailError: any) {
            console.error("❌ Error al enviar verificación de email:", emailError)

            if (emailError.code === "auth/operation-not-allowed") {
              this.errorMessage = "❌ El cambio de email está deshabilitado. Contacta al administrador."
            } else if (emailError.code === "auth/email-already-in-use") {
              this.errorMessage = "❌ Este email ya está en uso por otra cuenta."
            } else {
              this.errorMessage = `❌ Error al cambiar email: ${emailError.message}`
            }

            this.isChangingEmail = false
            this.isUpdatingProfile = false
            return
          }
        }

        // 3. Actualizar datos en Firestore (sin cambiar email si está pendiente de verificación)
        const updateData: any = {
          displayName: formData.displayName,
          phoneNumber: formData.phoneNumber,
          photoURL: formData.photoURL,
        }

        // Solo actualizar email en Firestore si no cambió o si ya está verificado
        if (!emailChanged) {
          updateData.email = formData.email
        }

        await this.userService.updateUserProfile(this.currentUser.uid, updateData)

        // 4. Recargar datos actualizados
        await this.loadUserData()

        if (!emailChanged) {
          this.successMessage = "✅ Perfil actualizado correctamente"
        }

        setTimeout(() => {
          this.successMessage = ""
          this.emailVerificationSent = false
          this.isChangingEmail = false
        }, 5000)
      } catch (error: any) {
        console.error("❌ Error al actualizar perfil:", error)
        this.errorMessage = this.getErrorMessage(error.code)
      } finally {
        this.isUpdatingProfile = false
      }
    }
  }

  // ✅ Método para reenviar verificación de email
  async resendEmailVerification() {
    if (this.currentUser && this.isChangingEmail) {
      try {
        const newEmail = this.profileForm.get("email")?.value
        await verifyBeforeUpdateEmail(this.currentUser, newEmail)
        this.successMessage = "📧 Email de verificación reenviado"
      } catch (error: any) {
        console.error("Error al reenviar verificación:", error)
        this.errorMessage = "Error al reenviar verificación de email"
      }
    }
  }

  // ✅ Método para cancelar cambio de email
  cancelEmailChange() {
    this.isChangingEmail = false
    this.emailVerificationSent = false

    // Restaurar email original en el formulario
    this.profileForm.patchValue({
      email: this.currentUser?.email || "",
    })

    this.successMessage = "Cambio de email cancelado"
    setTimeout(() => {
      this.successMessage = ""
    }, 3000)
  }

  get userInfo() {
    return {
      name: this.currentUser?.displayName || this.userProfile?.displayName || "Usuario",
      email: this.currentUser?.email || this.userProfile?.email || "",
      photoURL: this.currentUser?.photoURL || this.userProfile?.photoURL || null,
      phoneNumber: this.userProfile?.phoneNumber || "",
      emailVerified: this.currentUser?.emailVerified || false,
      uid: this.currentUser?.uid || "",
      creationTime: this.currentUser?.metadata?.creationTime || "",
      lastSignInTime: this.currentUser?.metadata?.lastSignInTime || "",
    }
  }

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get("newPassword")
    const confirmPassword = form.get("confirmPassword")

    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true })
      return { passwordMismatch: true }
    }

    return null
  }

  async updatePassword() {
    if (this.passwordForm.valid && this.currentUser) {
      this.isUpdatingPassword = true
      this.passwordErrorMessage = ""
      this.passwordSuccessMessage = ""

      try {
        const formData = this.passwordForm.value

        await this.authService.reauthenticate(formData.currentPassword)
        await updatePassword(this.currentUser, formData.newPassword)

        this.passwordSuccessMessage = "Contraseña actualizada correctamente"
        this.passwordForm.reset()
        this.showPasswordForm = false

        setTimeout(() => {
          this.passwordSuccessMessage = ""
        }, 3000)
      } catch (error: any) {
        console.error("Error al actualizar contraseña:", error)
        this.passwordErrorMessage = this.getErrorMessage(error.code)
      } finally {
        this.isUpdatingPassword = false
      }
    }
  }

  getErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case "auth/email-already-in-use":
        return "Este email ya está en uso por otra cuenta"
      case "auth/invalid-email":
        return "Email no válido"
      case "auth/weak-password":
        return "La contraseña debe tener al menos 6 caracteres"
      case "auth/wrong-password":
        return "La contraseña actual es incorrecta"
      case "auth/requires-recent-login":
        return "Por seguridad, necesitas iniciar sesión nuevamente"
      case "auth/operation-not-allowed":
        return "Operación no permitida. Verifica la configuración de Firebase."
      case "permission-denied":
        return "Error de permisos. Verifica que estés autenticado correctamente."
      case "not-found":
        return "Documento no encontrado. Se creará un nuevo perfil."
      case "unauthenticated":
        return "Usuario no autenticado."
      default:
        return "Ha ocurrido un error. Inténtalo de nuevo."
    }
  }

  hasError(fieldName: string, formName: "profile" | "password" = "profile"): boolean {
    const form = formName === "profile" ? this.profileForm : this.passwordForm
    const field = form.get(fieldName)
    return !!(field && field.invalid && (field.dirty || field.touched))
  }

  getFieldError(fieldName: string, formName: "profile" | "password" = "profile"): string {
    const form = formName === "profile" ? this.profileForm : this.passwordForm
    const field = form.get(fieldName)

    if (field?.errors) {
      if (field.errors["required"]) return "Este campo es obligatorio"
      if (field.errors["email"]) return "Email no válido"
      if (field.errors["minlength"]) return `Mínimo ${field.errors["minlength"].requiredLength} caracteres`
      if (field.errors["pattern"]) return "Formato no válido"
      if (field.errors["passwordMismatch"]) return "Las contraseñas no coinciden"
    }

    return ""
  }

  togglePasswordVisibility(field: "current" | "new" | "confirm") {
    switch (field) {
      case "current":
        this.showCurrentPassword = !this.showCurrentPassword
        break
      case "new":
        this.showNewPassword = !this.showNewPassword
        break
      case "confirm":
        this.showConfirmPassword = !this.showConfirmPassword
        break
    }
  }

  goToDashboard() {
    this.router.navigate(["/dashboard"])
  }

  async logout() {
    try {
      await this.authService.logout()
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    }
  }

  async sendEmailVerification() {
    if (this.currentUser) {
      try {
        await this.authService.sendEmailVerification()
        this.successMessage = "Email de verificación enviado"
        setTimeout(() => {
          this.successMessage = ""
        }, 3000)
      } catch (error) {
        console.error("Error al enviar email de verificación:", error)
        this.errorMessage = "Error al enviar email de verificación"
      }
    }
  }
}
