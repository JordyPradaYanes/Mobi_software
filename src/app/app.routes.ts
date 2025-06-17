import { Routes } from '@angular/router';
import { MainComponent } from './main/main.component';

//Componentes Estructurales
import { NavbarComponent } from './ComponentesEstructurales/navbar/navbar.component';
import { HeroComponent } from './ComponentesEstructurales/hero/hero.component';
import { FooterComponent } from './ComponentesEstructurales/footer/footer.component';
import { LoginComponent } from './ComponentesEstructurales/login/login.component';
import { RegisterComponent } from './ComponentesEstructurales/register/register.component';
import { PropertyBenefitsComponent } from './ComponentesEstructurales/property-benefits/property-benefits.component';
import { LocationPropertiesComponent } from './ComponentesEstructurales/location-properties/location-properties.component';
import { DashboardComponent } from './LayoutPriv/dashboard/dashboard.component';
import { PropertyCardComponent } from './LayoutPriv/property-card/property-card.component';
import { PropertyFormComponent } from './LayoutPriv/property-form/property-form.component';
import { FavoritesComponent } from './LayoutPriv/favorites/favorites.component';
import { PropertyManagementComponent } from './LayoutPriv/property-management/property-management.component';
import { UserProfileComponent } from './LayoutPriv/user-profile/user-profile.component';

// import { DashboardComponent } from './ComponentesEstructurales/dashboard/dashboard.component';

export const routes: Routes = [
    { path: '', component: MainComponent},
    //Componentes Estructurales
    { path: 'navbar', component: NavbarComponent},
    { path: 'hero', component: HeroComponent},
    { path: 'footer', component: FooterComponent},
    { path: 'login', component: LoginComponent},
    { path: 'register', component: RegisterComponent},
    { path: 'property-benefits', component: PropertyBenefitsComponent},
    { path: 'location-properties', component: LocationPropertiesComponent},

    //LayoutPriv
    { path: 'dashboard', component: DashboardComponent },
    { path: 'property-form', component: PropertyFormComponent},
    { path: 'property-form/:id', component: PropertyFormComponent }, // Added for editing
    { path: 'favorites', component: FavoritesComponent},
    { path: 'property-management', component: PropertyManagementComponent},
    { path: 'user-profile', component: UserProfileComponent}
];

