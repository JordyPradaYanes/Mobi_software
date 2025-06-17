import { Injectable } from "@angular/core"
import { BehaviorSubject, type Observable } from "rxjs"

export interface Notification {
  id: string
  type: "success" | "error" | "warning" | "info"
  title: string
  message?: string
  duration?: number
  persistent?: boolean
  timestamp: Date
}

@Injectable({
  providedIn: "root",
})
export class NotificationService {
  private notifications$ = new BehaviorSubject<Notification[]>([])
  private readonly DEFAULT_DURATION = 5000 // 5 segundos

  constructor() {}

  /**
   * Obtiene el observable de notificaciones
   */
  getNotifications(): Observable<Notification[]> {
    return this.notifications$.asObservable()
  }

  /**
   * Muestra una notificación de éxito
   * @param title Título de la notificación
   * @param message Mensaje opcional
   * @param duration Duración en ms (opcional)
   */
  showSuccess(title: string, message?: string, duration?: number): void {
    this.addNotification({
      type: "success",
      title,
      message,
      duration: duration || this.DEFAULT_DURATION,
    })
  }

  /**
   * Muestra una notificación de error
   * @param title Título de la notificación
   * @param message Mensaje opcional
   * @param persistent Si debe persistir hasta ser cerrada manualmente
   */
  showError(title: string, message?: string, persistent = false): void {
    this.addNotification({
      type: "error",
      title,
      message,
      duration: persistent ? undefined : this.DEFAULT_DURATION * 2, // Errores duran más
      persistent,
    })
  }

  /**
   * Muestra una notificación de advertencia
   * @param title Título de la notificación
   * @param message Mensaje opcional
   * @param duration Duración en ms (opcional)
   */
  showWarning(title: string, message?: string, duration?: number): void {
    this.addNotification({
      type: "warning",
      title,
      message,
      duration: duration || this.DEFAULT_DURATION,
    })
  }

  /**
   * Muestra una notificación informativa
   * @param title Título de la notificación
   * @param message Mensaje opcional
   * @param duration Duración en ms (opcional)
   */
  showInfo(title: string, message?: string, duration?: number): void {
    this.addNotification({
      type: "info",
      title,
      message,
      duration: duration || this.DEFAULT_DURATION,
    })
  }

  /**
   * Muestra una notificación personalizada
   * @param notification Objeto de notificación
   */
  showCustom(notification: Partial<Notification>): void {
    this.addNotification({
      type: notification.type || "info",
      title: notification.title || "Notificación",
      message: notification.message,
      duration: notification.duration || this.DEFAULT_DURATION,
      persistent: notification.persistent || false,
    })
  }

  /**
   * Elimina una notificación específica
   * @param id ID de la notificación
   */
  removeNotification(id: string): void {
    const currentNotifications = this.notifications$.value
    const updatedNotifications = currentNotifications.filter((n) => n.id !== id)
    this.notifications$.next(updatedNotifications)
  }

  /**
   * Elimina todas las notificaciones
   */
  clearAll(): void {
    this.notifications$.next([])
  }

  /**
   * Elimina todas las notificaciones de un tipo específico
   * @param type Tipo de notificación a eliminar
   */
  clearByType(type: Notification["type"]): void {
    const currentNotifications = this.notifications$.value
    const updatedNotifications = currentNotifications.filter((n) => n.type !== type)
    this.notifications$.next(updatedNotifications)
  }

  /**
   * Agrega una nueva notificación
   * @param notification Datos de la notificación
   */
  private addNotification(notification: Omit<Notification, "id" | "timestamp">): void {
    const newNotification: Notification = {
      ...notification,
      id: this.generateId(),
      timestamp: new Date(),
    }

    const currentNotifications = this.notifications$.value
    const updatedNotifications = [...currentNotifications, newNotification]

    // Limitar a máximo 10 notificaciones
    if (updatedNotifications.length > 10) {
      updatedNotifications.shift()
    }

    this.notifications$.next(updatedNotifications)

    // Auto-remover si no es persistente
    if (!notification.persistent && notification.duration) {
      setTimeout(() => {
        this.removeNotification(newNotification.id)
      }, notification.duration)
    }
  }

  /**
   * Genera un ID único para la notificación
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  /**
   * Obtiene el conteo de notificaciones por tipo
   */
  getNotificationCount(): { [key in Notification["type"]]: number } {
    const notifications = this.notifications$.value
    return {
      success: notifications.filter((n) => n.type === "success").length,
      error: notifications.filter((n) => n.type === "error").length,
      warning: notifications.filter((n) => n.type === "warning").length,
      info: notifications.filter((n) => n.type === "info").length,
    }
  }

  /**
   * Verifica si hay notificaciones activas
   */
  hasNotifications(): boolean {
    return this.notifications$.value.length > 0
  }

  /**
   * Obtiene la notificación más reciente
   */
  getLatestNotification(): Notification | null {
    const notifications = this.notifications$.value
    return notifications.length > 0 ? notifications[notifications.length - 1] : null
  }
}
