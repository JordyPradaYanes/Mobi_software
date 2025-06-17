import { Injectable } from "@angular/core"

export interface ImageUploadResult {
  url: string
  fileName: string
  size: number
}

@Injectable({
  providedIn: "root",
})
export class ImageService {
  private readonly ASSETS_PATH = "assets/images/properties/"
  private readonly SUPPORTED_FORMATS = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

  constructor() {}

  /**
   * Guarda una imagen en la carpeta assets del proyecto
   * @param file Archivo de imagen a guardar
   * @param progressCallback Callback para reportar progreso
   * @returns Promise con la URL de la imagen guardada
   */
  async saveToAssets(file: File, progressCallback?: (progress: number) => void): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        // Validar archivo
        if (!this.validateFile(file)) {
          reject(new Error("Archivo no válido"))
          return
        }

        // Generar nombre único para el archivo
        const fileName = this.generateUniqueFileName(file.name)
        const reader = new FileReader()

        reader.onloadstart = () => {
          progressCallback?.(0)
        }

        reader.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100)
            progressCallback?.(progress)
          }
        }

        reader.onload = (event) => {
          try {
            const result = event.target?.result as string

            // Simular guardado en assets (en desarrollo)
            // En producción, necesitarías un endpoint para guardar archivos
            const imageUrl = this.saveImageToAssets(result, fileName)

            progressCallback?.(100)
            resolve(imageUrl)
          } catch (error) {
            reject(error)
          }
        }

        reader.onerror = () => {
          reject(new Error("Error al leer el archivo"))
        }

        reader.readAsDataURL(file)
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Valida si el archivo es una imagen válida
   * @param file Archivo a validar
   * @returns true si es válido, false si no
   */
  validateFile(file: File): boolean {
    // Validar tipo de archivo
    if (!this.SUPPORTED_FORMATS.includes(file.type)) {
      console.error("Formato de archivo no soportado:", file.type)
      return false
    }

    // Validar tamaño
    if (file.size > this.MAX_FILE_SIZE) {
      console.error("Archivo muy grande:", file.size)
      return false
    }

    return true
  }

  /**
   * Genera un nombre único para el archivo
   * @param originalName Nombre original del archivo
   * @returns Nombre único generado
   */
  private generateUniqueFileName(originalName: string): string {
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const extension = originalName.split(".").pop()?.toLowerCase() || "jpg"
    return `property_${timestamp}_${randomString}.${extension}`
  }

  /**
   * Simula el guardado de imagen en assets
   * En un entorno real, esto sería una llamada HTTP a tu backend
   * @param dataUrl Data URL de la imagen
   * @param fileName Nombre del archivo
   * @returns URL de la imagen guardada
   */
  private saveImageToAssets(dataUrl: string, fileName: string): string {
    // En desarrollo, podemos usar localStorage para simular el guardado
    const storageKey = `property_image_${fileName}`
    localStorage.setItem(storageKey, dataUrl)

    // Retornar URL simulada
    return `${this.ASSETS_PATH}${fileName}`
  }

  /**
   * Obtiene una imagen guardada por su nombre
   * @param fileName Nombre del archivo
   * @returns Data URL de la imagen o null si no existe
   */
  getImageFromAssets(fileName: string): string | null {
    const storageKey = `property_image_${fileName}`
    return localStorage.getItem(storageKey)
  }

  /**
   * Elimina una imagen de assets
   * @param fileName Nombre del archivo a eliminar
   * @returns Promise que se resuelve cuando se elimina
   */
  async deleteFromAssets(fileName: string): Promise<void> {
    return new Promise((resolve) => {
      const storageKey = `property_image_${fileName}`
      localStorage.removeItem(storageKey)
      resolve()
    })
  }

  /**
   * Redimensiona una imagen antes de guardarla
   * @param file Archivo de imagen
   * @param maxWidth Ancho máximo
   * @param maxHeight Alto máximo
   * @param quality Calidad de compresión (0-1)
   * @returns Promise con el archivo redimensionado
   */
  async resizeImage(file: File, maxWidth = 1920, maxHeight = 1080, quality = 0.8): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      const img = new Image()

      img.onload = () => {
        // Calcular nuevas dimensiones manteniendo proporción
        let { width, height } = img

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height
            height = maxHeight
          }
        }

        canvas.width = width
        canvas.height = height

        // Dibujar imagen redimensionada
        ctx?.drawImage(img, 0, 0, width, height)

        // Convertir a blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const resizedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              })
              resolve(resizedFile)
            } else {
              reject(new Error("Error al redimensionar imagen"))
            }
          },
          file.type,
          quality,
        )
      }

      img.onerror = () => reject(new Error("Error al cargar imagen"))
      img.src = URL.createObjectURL(file)
    })
  }

  /**
   * Obtiene información de una imagen
   * @param file Archivo de imagen
   * @returns Promise con información de la imagen
   */
  async getImageInfo(file: File): Promise<{
    width: number
    height: number
    size: number
    type: string
    name: string
  }> {
    return new Promise((resolve, reject) => {
      const img = new Image()

      img.onload = () => {
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight,
          size: file.size,
          type: file.type,
          name: file.name,
        })
      }

      img.onerror = () => reject(new Error("Error al obtener información de la imagen"))
      img.src = URL.createObjectURL(file)
    })
  }

  /**
   * Convierte un archivo a base64
   * @param file Archivo a convertir
   * @returns Promise con string base64
   */
  fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = (error) => reject(error)
    })
  }

  /**
   * Lista todas las imágenes guardadas
   * @returns Array con nombres de archivos guardados
   */
  listSavedImages(): string[] {
    const images: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith("property_image_")) {
        const fileName = key.replace("property_image_", "")
        images.push(fileName)
      }
    }
    return images
  }

  /**
   * Limpia todas las imágenes guardadas
   */
  clearAllImages(): void {
    const keys = Object.keys(localStorage)
    keys.forEach((key) => {
      if (key.startsWith("property_image_")) {
        localStorage.removeItem(key)
      }
    })
  }
}
