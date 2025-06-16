import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-hero',
  imports: [CommonModule, FormsModule],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.css'
})

export class HeroComponent implements OnInit {
  // Variables de colores y estilos
  colors = {
    primary: '#6366f1', // Color morado para botones y elementos destacados
    textDark: '#1e293b', // Texto principal oscuro
    textLight: '#64748b', // Texto secundario más claro
    backgroundColor: '#eeeeff', // Fondo lila claro
    buttonText: '#ffffff', // Texto blanco para botones
    borderColor: '#e2e8f0' // Color de bordes
  };

  // Opciones para pestañas de tipo de transacción
  transactionTypes = [
    { id: 'alquilar', name: 'Alquilar', selected: true },
    { id: 'comprar', name: 'Comprar', selected: false },
    { id: 'vender', name: 'Vender', selected: false }
  ];

  // Datos estadísticos
  statistics = [
    { 
      id: 'rentals',
      icon: 'house-icon', 
      number: '1k+', 
      title: 'Alquilados', 
      description: 'believe in our service'
    },
    { 
      id: 'properties',
      icon: 'building-icon', 
      number: '10k+', 
      title: 'Propiedades', 
      description: 'and house ready for occupancy'
    }
  ];

  // Ubicación por defecto
  location = 'Ocaña, Norte de Santander';
  
  // Tipo de propiedad seleccionado
  propertyType = 'Seleccionar Propiedad';

  constructor() { }

  ngOnInit(): void {
  }

  // Método para cambiar entre pestañas
  selectTransactionType(selected: string): void {
    this.transactionTypes.forEach(type => {
      type.selected = type.id === selected;
    });
  }
}