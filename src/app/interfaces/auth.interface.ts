import type { User } from "@angular/fire/auth"

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
}

export interface AuthResponse {
  success: boolean
  user?: User
  error?: string
}

export interface RegisterResponse extends AuthResponse {}

export interface LoginResponse extends AuthResponse {}

export interface UserProfile {
  uid: string
  email: string
  displayName: string
  firstName: string
  phone: string
  lastName: string
  createdAt: Date
}
