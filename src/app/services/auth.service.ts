import { Injectable } from "@angular/core"
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  user,
  updateProfile,
  User,
} from "@angular/fire/auth"
import { Observable } from "rxjs"
import { Router } from "@angular/router"
import type { AuthResponse } from "../interfaces/auth.interface"
import { 
  reauthenticateWithCredential, 
  EmailAuthProvider,
  sendEmailVerification as firebaseSendEmailVerification 
} from '@angular/fire/auth';

@Injectable({
  providedIn: "root",
})
export class AuthService {
  user$: Observable<User | null>

  constructor(
    private auth: Auth,
    private router: Router,
  ) {
    this.user$ = user(this.auth)
  }

  // Registro de usuario
  async register(email: string, password: string, fullName: string): Promise<AuthResponse> {
    try {
      const result = await createUserWithEmailAndPassword(this.auth, email, password)

      // Actualizar el perfil del usuario con el nombre completo
      await updateProfile(result.user, {
        displayName: fullName,
      })

      return {
        success: true,
        user: result.user,
      }
    } catch (error: any) {
      return {
        success: false,
        error: this.getErrorMessage(error.code),
      }
    }
  }

  // Inicio de sesión
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const result = await signInWithEmailAndPassword(this.auth, email, password)
      return {
        success: true,
        user: result.user,
      }
    } catch (error: any) {
      return {
        success: false,
        error: this.getErrorMessage(error.code),
      }
    }
  }

  // Cerrar sesión
  async logout(): Promise<void> {
    try {
      await signOut(this.auth)
      this.router.navigate(["/"])
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    }
  }

  // Obtener usuario actual
  getCurrentUser(): User | null {
    return this.auth.currentUser
  }

  async sendEmailVerification(): Promise<void> {
    const user = this.auth.currentUser
    if (user) {
      await firebaseSendEmailVerification(user)
    } else {
      throw new Error("No hay usuario autenticado")
    }
  }

  // ✅ MÉTODO PARA REAUTENTICAR (necesario para cambios sensibles)
  async reauthenticate(password: string): Promise<void> {
    const user = this.auth.currentUser
    if (user && user.email) {
      const credential = EmailAuthProvider.credential(user.email, password)
      await reauthenticateWithCredential(user, credential)
    } else {
      throw new Error("No hay usuario autenticado o email disponible")
    }
  }

  // ✅ MÉTODO PARA VERIFICAR SI EL EMAIL ESTÁ VERIFICADO
  isEmailVerified(): boolean {
    return this.auth.currentUser?.emailVerified || false
  }

  // ✅ MÉTODO PARA RECARGAR USUARIO (útil después de verificación)
  async reloadUser(): Promise<void> {
    if (this.auth.currentUser) {
      await this.auth.currentUser.reload()
    }
  }
  // Verificar si está autenticado
  isAuthenticated(): boolean {
    return !!this.auth.currentUser
  }

  // Obtener mensaje de error personalizado
  private getErrorMessage(errorCode: string): string {
    const errorMessages: { [key: string]: string } = {
      "auth/email-already-in-use": "Este correo electrónico ya está registrado.",
      "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
      "auth/invalid-email": "El correo electrónico no es válido.",
      "auth/operation-not-allowed": "El registro con email/contraseña no está habilitado.",
      "auth/network-request-failed": "Error de conexión. Verifica tu internet.",
      "auth/user-not-found": "No existe una cuenta con este correo electrónico.",
      "auth/wrong-password": "Contraseña incorrecta.",
      "auth/user-disabled": "Esta cuenta ha sido deshabilitada.",
      "auth/too-many-requests": "Demasiados intentos fallidos. Intenta más tarde.",
      "auth/invalid-credential": "Credenciales inválidas. Verifica tu email y contraseña.",
      "auth/missing-password": "La contraseña es requerida.",
      "auth/invalid-login-credentials": "Credenciales de inicio de sesión inválidas.",
      default: "Ocurrió un error. Inténtalo de nuevo.",
    }

    return errorMessages[errorCode] || errorMessages["default"]
  }
  
}
