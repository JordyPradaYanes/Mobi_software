import { Injectable } from "@angular/core"
import { Router } from "@angular/router"
import { BehaviorSubject, type Observable } from "rxjs"
import { AuthService } from "./auth.service"
import type { RegisterCredentials, RegisterResponse } from "../interfaces/auth.interface"

@Injectable({
  providedIn: "root",
})
export class RegisterService {
  private loadingSubject = new BehaviorSubject<boolean>(false)
  public loading$: Observable<boolean> = this.loadingSubject.asObservable()

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  async register(credentials: RegisterCredentials): Promise<RegisterResponse> {
    this.loadingSubject.next(true)

    try {
      const fullName = `${credentials.firstName} ${credentials.lastName}`
      const result = await this.authService.register(credentials.email, credentials.password, fullName)

      this.loadingSubject.next(false)
      return result
    } catch (error: any) {
      this.loadingSubject.next(false)
      return {
        success: false,
        error: "Error inesperado durante el registro",
      }
    }
  }

  navigateToHome(): void {
    this.router.navigate(["/"])
  }

  navigateToLogin(): void {
    this.router.navigate(["/login"])
  }
}
