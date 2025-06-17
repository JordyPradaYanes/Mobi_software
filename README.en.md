# Mobi

## Description

Mobi is a comprehensive real estate platform designed for browsing, listing, and managing property rentals and sales. It enables users to register and log in to their accounts, list new properties with detailed descriptions and images, mark properties as favorites for easy access, and efficiently manage their own listings. The platform aims to provide a seamless and user-friendly experience for both property seekers and listers.

## Key Features

*   **User Authentication**: Secure registration and login functionality for users.
*   **Property Listings**: Browse a wide range of available properties.
*   **Detailed Property View**: Access comprehensive details for each property.
*   **Property Management**: Authenticated users can add, edit, and delete their own property listings.
*   **Favorites System**: Users can mark properties as favorites and view them in a dedicated section.
*   **User Profile Management**: Users can view and update their profile information.
*   **Responsive Design**: Optimized for a consistent experience across various devices.

## Technologies Used

*   **Angular**: Version ~19.2.0 (Frontend framework)
*   **Firebase**:
    *   Firebase Authentication (for user management)
    *   Firestore Database (for storing property, user, and favorites data)
    *   Firebase Storage (for property image uploads - *assumed based on typical app structure and `ImageService`*)
*   **Tailwind CSS**: Utility-first CSS framework for styling.
*   **TypeScript**: Superset of JavaScript for typed, robust code.

## Prerequisites

*   Node.js: Version 18.x or higher is recommended.
*   npm (Node Package Manager): Usually comes with Node.js.
*   Angular CLI: Version ~19.2.12
*   Firebase Account: To set up the backend services.

## Firebase Setup

1.  **Create a Firebase Project**: Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
2.  **Enable Authentication**:
    *   In your Firebase project, navigate to Authentication.
    *   Under the "Sign-in method" tab, enable "Email/Password".
3.  **Set up Firestore Database**:
    *   Navigate to Firestore Database and create a database in **Test mode** (for initial development) or **Production mode** with appropriate security rules.
    *   **Collections**:
        *   `properties`: To store property listings. Consider adding fields like `userId` (to link to the lister), `address`, `price`, `description`, `imageUrls`, `bedrooms`, `bathrooms`, `type`, `status`, `features`, `createdAt`, `updatedAt`.
        *   `users`: To store user-specific information (e.g., `uid`, `email`, `displayName`, `photoURL`).
        *   `users/{userId}/favorites`: A subcollection under each user to store their favorite property IDs (e.g., document ID can be `propertyId` with a field like `addedAt`).
    *   **Security Rules**: For development, you can start with permissive rules, but **these must be secured before going to production**.
        ```json
        // Example (Development Only - NOT FOR PRODUCTION)
        rules_version = '2';
        service cloud.firestore {
          match /databases/{database}/documents {
            match /{document=**} {
              allow read, write: if true; // Allows all reads and writes
            }
          }
        }
        ```
        **Recommendation for Production**: Implement granular rules to ensure users can only modify their own data and that data access is restricted appropriately.
4.  **Enable Firebase Storage** (if implementing image uploads):
    *   Navigate to Storage and click "Get started".
    *   Set up basic security rules for Storage. For example:
        ```
        rules_version = '2';
        service firebase.storage {
          match /b/{bucket}/o {
            // Allow reads by anyone, allow writes only by authenticated users for their own images
            match /property_images/{userId}/{allPaths=**} {
              allow read;
              allow write: if request.auth != null && request.auth.uid == userId;
            }
          }
        }
        ```
5.  **Project Configuration**:
    *   In your Firebase project settings (Project Overview > Project settings), find your web app's Firebase configuration snippet (apiKey, authDomain, projectId, etc.).
    *   Create two files in `src/environments/`:
        *   `environment.ts`
        *   `environment.prod.ts`
    *   Populate them with your Firebase configuration:
        ```typescript
        // src/environments/environment.ts (and similarly for environment.prod.ts)
        export const environment = {
          production: false, // true for environment.prod.ts
          firebase: {
            apiKey: "YOUR_API_KEY",
            authDomain: "YOUR_AUTH_DOMAIN",
            projectId: "YOUR_PROJECT_ID",
            storageBucket: "YOUR_STORAGE_BUCKET", // Optional, if using Storage
            messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
            appId: "YOUR_APP_ID",
            measurementId: "YOUR_MEASUREMENT_ID" // Optional
          }
        };
        ```

## Project Setup

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    ```
2.  **Navigate to the project directory**:
    ```bash
    cd mobi
    ```
3.  **Install dependencies**:
    ```bash
    npm install
    ```
4.  **Run the development server**:
    ```bash
    ng serve
    ```
    Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Core Components Overview

*   **`NavbarComponent`**: Main navigation bar. Adapts to show different options based on user authentication status.
*   **`HeroComponent`**, **`PropertyBenefitsComponent`**, **`LocationPropertiesComponent`**: Components that make up the main landing page, showcasing the platform's value.
*   **`LoginComponent`**, **`RegisterComponent`**: Handle user sign-in and sign-up processes.
*   **`DashboardComponent`**: The central hub for authenticated users, providing quick access to various features and an overview.
*   **`PropertyCardComponent`**: A reusable component to display summary information for an individual property in a card format.
*   **`PropertyFormComponent`**: Used for both creating new property listings and editing existing ones.
*   **`FavoritesComponent`**: Displays a list of properties that the logged-in user has marked as their favorites.
*   **`PropertyManagementComponent`**: Allows users to view, edit, and delete the properties they have listed.
*   **`UserProfileComponent`**: Enables users to view and update their profile details.

## Services Overview

*   **`AuthService`**: Manages all aspects of user authentication with Firebase Authentication, including registration, login, logout, and tracking user state.
*   **`PropertyService`**: Handles all CRUD (Create, Read, Update, Delete) operations for property listings, interacting with the Firestore 'properties' collection.
*   **`FavoritesService`**: Manages users' favorite properties, including adding, removing, and fetching favorites from Firestore.
*   **`UserService`**: Responsible for managing user profile data stored in Firestore (e.g., creating user documents, updating profile information).
*   **`ImageService`**: Facilitates image uploads, likely to Firebase Storage, and retrieves image URLs for properties. *(Role assumed based on common practice; confirm specific implementation details if necessary)*

## Routing

Mobi uses Angular's routing to navigate between different views. Key routes include:

*   **Public Routes**:
    *   `/`: Main landing page.
    *   `/login`: User login page.
    *   `/register`: User registration page.
*   **Authenticated (Private) Routes**:
    *   `/dashboard`: User dashboard.
    *   `/favorites`: View favorite properties.
    *   `/property-management`: Manage user's own listed properties.
    *   `/property-form`: Create a new property listing.
    *   `/property-form/:id`: Edit an existing property listing.
    *   `/user-profile`: View and edit user profile.

## Running Tests

Unit tests are crucial for ensuring code quality and stability.

*   **Execute unit tests**:
    ```bash
    ng test
    ```
    This will run the tests via Karma and display results in the console.

## Building the Project

To create a production build of the application:

*   **Build for production**:
    ```bash
    ng build
    ```
    The build artifacts will be stored in the `dist/mobi/browser` directory.

## Contribution / Future Enhancements (Optional)

We welcome contributions! Here are some ideas for future enhancements:

*   **Advanced Search & Filtering**: Implement more sophisticated search criteria (e.g., by price range, number of rooms, specific features, map area).
*   **User Reviews and Ratings**: Allow users to leave reviews and ratings for properties.
*   **Map Integration**: Display properties on a map and allow searching/filtering via map interactions (e.g., using Google Maps API).
*   **Admin Panel**: A dedicated interface for administrators to manage users, listings, and site settings.
*   **Notifications**: Implement notifications for users (e.g., new property matches, updates on favorites).
*   **Internationalization (i18n)**: Support for multiple languages.
