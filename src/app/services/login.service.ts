import { Injectable } from "@angular/core"
import { Router } from "@angular/router"
import { BehaviorSubject, type Observable } from "rxjs"
import { AuthService } from "./auth.service"
import { LoginCredentials, LoginResponse } from "../interfaces/auth.interface"

@Injectable({
  providedIn: "root",
})
export class LoginService {
  private loadingSubject = new BehaviorSubject<boolean>(false)
  public loading$: Observable<boolean> = this.loadingSubject.asObservable()

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    this.loadingSubject.next(true)

    try {
      const result = await this.authService.login(credentials.email, credentials.password)

      this.loadingSubject.next(false)
      return result
    } catch (error: any) {
      this.loadingSubject.next(false)
      return {
        success: false,
        error: "Error inesperado durante el inicio de sesión",
      }
    }
  }

  navigateToHome(): void {
    this.router.navigate(["/"])
  }

  navigateToRegister(): void {
    this.router.navigate(["/register"])
  }
}
