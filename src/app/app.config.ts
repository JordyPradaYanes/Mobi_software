import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCqEM2OTHMStealQiIOg15MDuIW0XeAbj8",
  authDomain: "mobiis-ab4b2.firebaseapp.com",
  projectId: "mobiis-ab4b2",
  storageBucket: "mobiis-ab4b2.firebasestorage.app",
  messagingSenderId: "253806139508",
  appId: "1:253806139508:web:cfcdeb04326de377b25921",
  measurementId: "G-23M6QSFWP6"
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
  ]
};