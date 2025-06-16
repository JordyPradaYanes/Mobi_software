// Ensure the Main component is defined and exported
import { Component } from '@angular/core';
import { FooterComponent } from '../ComponentesEstructurales/footer/footer.component';
import { NavbarComponent } from '../ComponentesEstructurales/navbar/navbar.component';
import { HeroComponent } from '../ComponentesEstructurales/hero/hero.component';
import { PropertyBenefitsComponent } from "../ComponentesEstructurales/property-benefits/property-benefits.component";
import { LocationPropertiesComponent } from '../ComponentesEstructurales/location-properties/location-properties.component';
import { RegisterComponent } from '../ComponentesEstructurales/register/register.component';

@Component({
  selector: 'app-main',
  imports: [FooterComponent, NavbarComponent, HeroComponent, PropertyBenefitsComponent,
     LocationPropertiesComponent],
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent {

  // Variables del componente
  title = 'Aplicación Principal';
  welcomeMessage = 'Esta es la página principal de tu aplicación Angular.';
  showMessage = false;
  currentYear: number;

  constructor() { 
    this.currentYear = new Date().getFullYear();
  }

  ngOnInit(): void {
    // Lógica de inicialización si es necesaria
  }

  // Método para manejar el clic del botón
  onButtonClick(): void {
    this.showMessage = !this.showMessage;
    console.log('Botón clickeado!');
  }
}