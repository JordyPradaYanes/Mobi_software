# Mobi

## Descripción

Mobi es una plataforma inmobiliaria integral diseñada para buscar, publicar y gestionar alquileres y ventas de propiedades. Permite a los usuarios registrarse e iniciar sesión en sus cuentas, publicar nuevas propiedades con descripciones detalladas e imágenes, marcar propiedades como favoritas para un fácil acceso y gestionar eficientemente sus propios listados. La plataforma tiene como objetivo proporcionar una experiencia fluida y fácil de usar tanto para quienes buscan propiedades como para quienes las publican.

## Características Principales

*   **Autenticación de Usuarios**: Funcionalidad segura de registro e inicio de sesión para usuarios.
*   **Listados de Propiedades**: Navega por una amplia gama de propiedades disponibles.
*   **Vista Detallada de Propiedad**: Accede a detalles completos de cada propiedad.
*   **Gestión de Propiedades**: Los usuarios autenticados pueden agregar, editar y eliminar sus propias listas de propiedades.
*   **Sistema de Favoritos**: Los usuarios pueden marcar propiedades como favoritas y verlas en una sección dedicada.
*   **Gestión de Perfil de Usuario**: Los usuarios pueden ver y actualizar la información de su perfil.
*   **Diseño Adaptable (Responsive)**: Optimizado para una experiencia consistente en diversos dispositivos.

## Tecnologías Utilizadas

*   **Angular**: Versión ~19.2.0 (Framework de frontend)
*   **Firebase**:
    *   Firebase Authentication (para la gestión de usuarios)
    *   Firestore Database (para almacenar datos de propiedades, usuarios y favoritos)
    *   Firebase Storage (para la subida de imágenes de propiedades - *(suposición basada en la estructura típica de la aplicación y la posible función del `ImageService`)*)
*   **Tailwind CSS**: Framework CSS "utility-first" para estilos.
*   **TypeScript**: Superconjunto de JavaScript para código tipado y robusto.

## Prerrequisitos

*   Node.js: Se recomienda la versión 18.x o superior.
*   npm (Node Package Manager): Generalmente viene con Node.js.
*   Angular CLI: Versión ~19.2.12
*   Cuenta de Firebase: Para configurar los servicios de backend.

## Configuración de Firebase

1.  **Crear un Proyecto en Firebase**: Ve a la [Consola de Firebase](https://console.firebase.google.com/) y crea un nuevo proyecto.
2.  **Habilitar Autenticación**:
    *   En tu proyecto de Firebase, navega a Authentication.
    *   En la pestaña "Sign-in method" (Método de inicio de sesión), habilita "Email/Password" (Correo electrónico/Contraseña).
3.  **Configurar Firestore Database**:
    *   Navega a Firestore Database y crea una base de datos en **Modo de prueba** (para desarrollo inicial) o **Modo de producción** con las reglas de seguridad adecuadas.
    *   **Colecciones**:
        *   `properties`: Para almacenar los listados de propiedades. Considera agregar campos como `userId` (para enlazar al publicador), `address` (dirección), `price` (precio), `description` (descripción), `imageUrls` (URLs de imágenes), `bedrooms` (habitaciones), `bathrooms` (baños), `type` (tipo), `status` (estado), `features` (características), `createdAt` (fecha de creación), `updatedAt` (fecha de actualización).
        *   `users`: Para almacenar información específica del usuario (p. ej., `uid`, `email`, `displayName` (nombre visible), `photoURL` (URL de foto)).
    *   `users/{userId}/favorites`: Una subcolección bajo cada usuario para almacenar los IDs de sus propiedades favoritas (p. ej., el ID del documento puede ser `propertyId` con un campo como `addedAt` (fecha de alta)).
    *   **Reglas de Seguridad**: Para el desarrollo, puedes comenzar con reglas permisivas, pero **estas deben asegurarse antes de pasar a producción**.
        ```json
        // Ejemplo (Solo para Desarrollo - NO PARA PRODUCCIÓN)
        rules_version = '2';
        service cloud.firestore {
          match /databases/{database}/documents {
            match /{document=**} {
              allow read, write: if true; // Permite todas las lecturas y escrituras
            }
          }
        }
        ```
        **Recomendación para Producción**: Implementa reglas granulares para asegurar que los usuarios solo puedan modificar sus propios datos y que el acceso a los datos esté restringido apropiadamente.
4.  **Habilitar Firebase Storage** (si se implementa la subida de imágenes):
    *   Navega a Storage y haz clic en "Comenzar".
    *   Configura reglas de seguridad básicas para Storage. Por ejemplo:
        ```
        rules_version = '2';
        service firebase.storage {
          match /b/{bucket}/o {
            // Permitir lecturas a cualquiera, permitir escrituras solo a usuarios autenticados para sus propias imágenes
            match /property_images/{userId}/{allPaths=**} {
              allow read;
              allow write: if request.auth != null && request.auth.uid == userId;
            }
          }
        }
        ```
5.  **Configuración del Proyecto**:
    *   En la configuración de tu proyecto de Firebase (Visión general del proyecto > Configuración del proyecto), encuentra el fragmento de configuración de Firebase para tu aplicación web (apiKey, authDomain, projectId, etc.).
    *   Crea dos archivos en `src/environments/`:
        *   `environment.ts`
        *   `environment.prod.ts`
    *   Popúlalos con tu configuración de Firebase:
        ```typescript
        // src/environments/environment.ts (y similarmente para environment.prod.ts)
        export const environment = {
          production: false, // true para environment.prod.ts
          firebase: {
            apiKey: "TU_API_KEY",
            authDomain: "TU_AUTH_DOMAIN",
            projectId: "TU_PROJECT_ID",
            storageBucket: "TU_STORAGE_BUCKET", // Opcional, si usas Storage
            messagingSenderId: "TU_MESSAGING_SENDER_ID",
            appId: "TU_APP_ID",
            measurementId: "TU_MEASUREMENT_ID" // Opcional
          }
        };
        ```

## Configuración del Proyecto Local

1.  **Clona el repositorio**:
    ```bash
    git clone <URL-DEL-REPOSITORIO>
    ```
2.  **Navega al directorio del proyecto**:
    ```bash
    cd mobi
    ```
3.  **Instala las dependencias**:
    ```bash
    npm install
    ```
4.  **Ejecuta el servidor de desarrollo**:
    ```bash
    ng serve
    ```
    Navega a `http://localhost:4200/`. La aplicación se recargará automáticamente si cambias alguno de los archivos fuente.

## Resumen de Componentes Principales

*   **`NavbarComponent`**: Barra de navegación principal. Se adapta para mostrar diferentes opciones según el estado de autenticación del usuario.
*   **`HeroComponent`**, **`PropertyBenefitsComponent`**, **`LocationPropertiesComponent`**: Componentes que conforman la página de inicio principal, mostrando el valor de la plataforma.
*   **`LoginComponent`**, **`RegisterComponent`**: Gestionan los procesos de inicio de sesión y registro de usuarios.
*   **`DashboardComponent`**: El centro de operaciones para usuarios autenticados, proporcionando acceso rápido a diversas funciones y una visión general.
*   **`PropertyCardComponent`**: Componente reutilizable para mostrar información resumida de una propiedad individual en formato de tarjeta.
*   **`PropertyFormComponent`**: Utilizado tanto para crear nuevos listados de propiedades como para editar los existentes.
*   **`FavoritesComponent`**: Muestra una lista de las propiedades que el usuario conectado ha marcado como sus favoritas.
*   **`PropertyManagementComponent`**: Permite a los usuarios ver, editar y eliminar las propiedades que han listado.
*   **`UserProfileComponent`**: Permite a los usuarios ver y actualizar los detalles de su perfil.

## Resumen de Servicios

*   **`AuthService`**: Gestiona todos los aspectos de la autenticación de usuarios con Firebase Authentication, incluyendo registro, inicio de sesión, cierre de sesión y seguimiento del estado del usuario.
*   **`PropertyService`**: Maneja todas las operaciones CRUD (Crear, Leer, Actualizar, Eliminar) para los listados de propiedades, interactuando con la colección 'properties' de Firestore.
*   **`FavoritesService`**: Gestiona las propiedades favoritas de los usuarios, incluyendo agregar, eliminar y obtener favoritos de Firestore.
*   **`UserService`**: Responsable de gestionar los datos del perfil del usuario almacenados en Firestore (p. ej., crear documentos de usuario, actualizar información del perfil).
    *   `ImageService`: Facilita la subida de imágenes, probablemente a Firebase Storage, y recupera las URLs de las imágenes para las propiedades. *(Rol asumido según prácticas comunes; los detalles específicos de implementación podrían necesitar confirmación)*

## Enrutamiento (Routing)

Mobi utiliza el enrutamiento de Angular para navegar entre diferentes vistas. Las rutas clave incluyen:

*   **Rutas Públicas**:
    *   `/`: Página de inicio principal.
    *   `/login`: Página de inicio de sesión.
    *   `/register`: Página de registro de usuarios.
*   **Rutas Autenticadas (Privadas)**:
    *   `/dashboard`: Panel de control del usuario.
    *   `/favorites`: Ver propiedades favoritas.
    *   `/property-management`: Gestionar las propiedades listadas por el usuario.
    *   `/property-form`: Crear un nuevo listado de propiedad.
    *   `/property-form/:id`: Editar un listado de propiedad existente.
    *   `/user-profile`: Ver y editar el perfil del usuario.

## Ejecución de Pruebas

Las pruebas unitarias son cruciales para asegurar la calidad y estabilidad del código.

*   **Ejecutar pruebas unitarias**:
    ```bash
    ng test
    ```
    Esto ejecutará las pruebas a través de Karma y mostrará los resultados en la consola.

## Compilación del Proyecto

Para crear una compilación de producción de la aplicación:

*   **Compilar para producción**:
    ```bash
    ng build
    ```
    Los artefactos de la compilación se almacenarán en el directorio `dist/mobi/browser`.

## Contribuciones / Mejoras Futuras (Opcional)

¡Aceptamos contribuciones! Aquí hay algunas ideas para futuras mejoras:

*   **Búsqueda y Filtrado Avanzados**: Implementar criterios de búsqueda más sofisticados (p. ej., por rango de precios, número de habitaciones, características específicas, área en el mapa).
*   **Reseñas y Calificaciones de Usuarios**: Permitir a los usuarios dejar reseñas y calificaciones para las propiedades.
*   **Integración de Mapas**: Mostrar propiedades en un mapa y permitir la búsqueda/filtrado mediante interacciones con el mapa (p. ej., usando la API de Google Maps).
*   **Panel de Administración**: Una interfaz dedicada para que los administradores gestionen usuarios, listados y configuraciones del sitio.
*   **Notificaciones**: Implementar notificaciones para los usuarios (p. ej., nuevas coincidencias de propiedades, actualizaciones sobre favoritos).
*   **Internacionalización (i18n)**: Soporte para múltiples idiomas.
