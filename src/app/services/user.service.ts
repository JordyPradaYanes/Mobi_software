import { Injectable } from "@angular/core"
import { Firestore, doc, setDoc, getDoc, updateDoc } from "@angular/fire/firestore"

export interface UserProfile {
  uid: string
  email: string
  displayName: string
  phoneNumber?: string
  photoURL?: string
  role: "USER" | "ADMIN" // ✅ Agregar campo role como esperan las reglas
  createdAt: Date
  updatedAt: Date
  preferences?: {
    notifications: boolean
    theme: "light" | "dark"
  }
}

@Injectable({
  providedIn: "root",
})
export class UserService {
  constructor(private firestore: Firestore) {}

  // ✅ Crear perfil en AMBAS colecciones como esperan las reglas
  async createUserProfile(uid: string, userData: Partial<UserProfile>): Promise<void> {
    const email = userData.email!

    const profileData: UserProfile = {
      uid,
      email,
      displayName: userData.displayName || "",
      phoneNumber: userData.phoneNumber || "",
      photoURL: userData.photoURL || "",
      role: "USER", // ✅ Rol por defecto
      createdAt: new Date(),
      updatedAt: new Date(),
      preferences: {
        notifications: true,
        theme: "light",
      },
      ...userData,
    }

    // ✅ Crear documento en /users/{email} (como esperan las reglas)
    const userByEmailRef = doc(this.firestore, "users", email)
    await setDoc(userByEmailRef, profileData)

    // ✅ Crear documento en /usersByUid/{uid} (como esperan las reglas)
    const userByUidRef = doc(this.firestore, "usersByUid", uid)
    await setDoc(userByUidRef, {
      email: email,
      uid: uid,
      displayName: profileData.displayName,
      createdAt: profileData.createdAt,
    })

    console.log("✅ Perfil creado en ambas colecciones")
  }

  // ✅ Obtener perfil desde /users/{email}
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      // Primero obtener el email desde usersByUid
      const userByUidRef = doc(this.firestore, "usersByUid", uid)
      const userByUidSnap = await getDoc(userByUidRef)

      if (!userByUidSnap.exists()) {
        console.log("❌ No se encontró usuario en usersByUid")
        return null
      }

      const email = userByUidSnap.data()['email']
      // Luego obtener el perfil completo desde users/{email}
      const userRef = doc(this.firestore, "users", email)
      const userSnap = await getDoc(userRef)

      if (userSnap.exists()) {
        return userSnap.data() as UserProfile
      }
      return null
    } catch (error) {
      console.error("Error al obtener perfil:", error)
      return null
    }
  }

  // ✅ Actualizar perfil en /users/{email}
  async updateUserProfile(uid: string, userData: Partial<UserProfile>): Promise<void> {
    try {
      // Obtener email desde usersByUid
      const userByUidRef = doc(this.firestore, "usersByUid", uid)
      const userByUidSnap = await getDoc(userByUidRef)

      if (!userByUidSnap.exists()) {
        throw new Error("Usuario no encontrado en usersByUid")
      }

      const email = userByUidSnap.data()['email']


      // Actualizar en users/{email}
      const userRef = doc(this.firestore, "users", email)
      const updateData = {
        ...userData,
        updatedAt: new Date(),
      }

      await updateDoc(userRef, updateData)

      // También actualizar displayName en usersByUid si cambió
      if (userData.displayName) {
        await updateDoc(userByUidRef, {
          displayName: userData.displayName,
        })
      }

      console.log("✅ Perfil actualizado en ambas colecciones")
    } catch (error) {
      console.error("Error al actualizar perfil:", error)
      throw error
    }
  }

  // ✅ Verificar si el perfil existe
  async profileExists(uid: string): Promise<boolean> {
    try {
      const userByUidRef = doc(this.firestore, "usersByUid", uid)
      const userByUidSnap = await getDoc(userByUidRef)
      return userByUidSnap.exists()
    } catch (error) {
      console.error("Error al verificar perfil:", error)
      return false
    }
  }

  // ✅ Método para hacer a un usuario administrador (solo para testing)
  async makeUserAdmin(uid: string): Promise<void> {
    try {
      const userByUidRef = doc(this.firestore, "usersByUid", uid)
      const userByUidSnap = await getDoc(userByUidRef)

      if (!userByUidSnap.exists()) {
        throw new Error("Usuario no encontrado")
      }

      const email = userByUidSnap.data()['email']

      const userRef = doc(this.firestore, "users", email)

      await updateDoc(userRef, {
        role: "ADMIN",
        updatedAt: new Date(),
      })

      console.log("✅ Usuario convertido en administrador")
    } catch (error) {
      console.error("Error al hacer admin:", error)
      throw error
    }
  }
}
