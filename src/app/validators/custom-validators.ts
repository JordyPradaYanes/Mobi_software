import type { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms"

export class CustomValidators {
  // Validador para nombres (solo letras y espacios)
  static nameValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null

      const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/
      const valid = nameRegex.test(control.value)

      return valid ? null : { invalidName: true }
    }
  }

  // Validador para email más estricto
  static emailValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null

      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
      const valid = emailRegex.test(control.value)

      return valid ? null : { invalidEmail: true }
    }
  }

  // Validador para contraseña fuerte
  static strongPasswordValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null

      const password = control.value
      const errors: ValidationErrors = {}

      // Al menos 8 caracteres
      if (password.length < 8) {
        errors["minLength"] = true
      }

      // Al menos una letra minúscula
      if (!/[a-z]/.test(password)) {
        errors["lowercase"] = true
      }

      // Al menos una letra mayúscula
      if (!/[A-Z]/.test(password)) {
        errors["uppercase"] = true
      }

      // Al menos un número
      if (!/[0-9]/.test(password)) {
        errors["number"] = true
      }

      // Al menos un carácter especial
      if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
        errors["specialChar"] = true
      }

      return Object.keys(errors).length > 0 ? errors : null
    }
  }

  // Validador para confirmar contraseña
  static passwordMatchValidator(passwordField: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.parent) return null

      const password = control.parent.get(passwordField)
      const confirmPassword = control

      if (!password || !confirmPassword) return null

      return password.value === confirmPassword.value ? null : { passwordMismatch: true }
    }
  }

  // Validador para espacios en blanco
  static noWhitespaceValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null

      const isWhitespace = (control.value || "").trim().length === 0
      return isWhitespace ? { whitespace: true } : null
    }
  }
}
