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
    { path: 'location-properties', component: LocationPropertiesComponent}
];

