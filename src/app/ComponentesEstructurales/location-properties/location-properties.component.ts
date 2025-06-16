import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface Property {
  id: number;
  title: string;
  price: number;
  rentType: string;
  imgSrc: string;
  isFavorite: boolean;
  location: string;
  beds: number;
  baths: number;
  area: number;
  areaUnit: string;
  type: 'venta' | 'alquiler';
  isPopular?: boolean;
}

@Component({
  selector: 'app-location-properties',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './location-properties.component.html',
  styleUrls: ['./location-properties.component.css']
})
export class LocationPropertiesComponent implements OnInit {
  // Variables de colores y estilos
  colors = {
    primary: '#6366f1',
    secondary: '#1e293b',
    textLight: '#64748b',
    accent: '#3730a3',
    lightBg: '#f8fafc',
    white: '#ffffff',
    border: '#e2e8f0',
    favoriteActive: '#ef4444',
    popularBg: '#6366f1',
  };

  // Filtros activos
  activeFilter: 'todos' | 'venta' | 'alquiler' = 'alquiler';
  searchTerm: string = '';
  
  // Filtros por características
  minBeds: number | null = null;
  maxBeds: number | null = null;
  minBaths: number | null = null;
  maxBaths: number | null = null;
  minArea: number | null = null;
  maxArea: number | null = null;
  minPrice: number | null = null;
  maxPrice: number | null = null;

  // Propiedades mostradas
  properties: Property[] = [
    {
      id: 1,
      title: 'Casa Harbor',
      price: 1600000,
      rentType: 'Mes',
      imgSrc: 'assets/images/property1.jpg',
      isFavorite: false,
      location: '2699 Villa Central, Ocaña, N. Santander',
      beds: 3,
      baths: 2,
      area: 6.7,
      areaUnit: 'm²',
      type: 'alquiler',
      isPopular: true
    },
    {
      id: 2,
      title: 'Apartamento Edificio Beverly',
      price: 1200000,
      rentType: 'Mes',
      imgSrc: 'assets/images/property2.jpg',
      isFavorite: false,
      location: '2821 Villa Carolina, Ocaña, N. Santander',
      beds: 4,
      baths: 2,
      area: 47.5,
      areaUnit: 'm²',
      type: 'alquiler',
      isPopular: true
    },
    {
      id: 3,
      title: 'Casa de campestre',
      price: 2400000,
      rentType: 'Mes',
      imgSrc: 'assets/images/property3.jpg',
      isFavorite: false,
      location: '909 Lagos Country, Ocaña, N. Santander',
      beds: 4,
      baths: 3,
      area: 80,
      areaUnit: 'm²',
      type: 'venta',
      isPopular: true
    },
    {
      id: 4,
      title: 'Apartamento Torre ISA',
      price: 2600000,
      rentType: 'Mes',
      imgSrc: 'assets/images/property4.jpg',
      isFavorite: false,
      location: '210 Lagos Country, Ocaña, N. Santander',
      beds: 4,
      baths: 2,
      area: 48,
      areaUnit: 'm²',
      type: 'venta'
    },
    {
      id: 5,
      title: 'Casa Centro',
      price: 1400000,
      rentType: 'Mes',
      imgSrc: 'assets/images/property5.jpg',
      isFavorite: false,
      location: '243 Notarias, Ocaña, N. Santander',
      beds: 2,
      baths: 1,
      area: 37.5,
      areaUnit: 'm²',
      type: 'alquiler'
    },
    {
      id: 6,
      title: 'Apartamento Edificio Caribe',
      price: 1600000,
      rentType: 'Mes',
      imgSrc: 'assets/images/property6.jpg',
      isFavorite: false,
      location: '101 Buenos Aires, Ocaña, N. Santander',
      beds: 3,
      baths: 1,
      area: 35,
      areaUnit: 'm²',
      type: 'venta'
    }
  ];

  constructor() { }

  ngOnInit(): void {
  }

  // Cambiar filtro activo
  setFilter(filter: 'todos' | 'venta' | 'alquiler'): void {
    this.activeFilter = filter;
  }

  // Alternar favorito
  toggleFavorite(property: Property): void {
    property.isFavorite = !property.isFavorite;
  }

  // Limpiar todos los filtros
  clearFilters(): void {
    this.searchTerm = '';
    this.minBeds = null;
    this.maxBeds = null;
    this.minBaths = null;
    this.maxBaths = null;
    this.minArea = null;
    this.maxArea = null;
    this.minPrice = null;
    this.maxPrice = null;
    this.activeFilter = 'todos';
  }

  // Filtrar propiedades según todos los criterios
  get filteredProperties(): Property[] {
    let filtered = this.properties;

    // Filtrar por tipo
    if (this.activeFilter !== 'todos') {
      filtered = filtered.filter(property => property.type === this.activeFilter);
    }

    // Filtrar por término de búsqueda
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(property => 
        property.title.toLowerCase().includes(searchLower) ||
        property.location.toLowerCase().includes(searchLower)
      );
    }

    // Filtrar por habitaciones
    if (this.minBeds !== null) {
      filtered = filtered.filter(property => property.beds >= this.minBeds!);
    }
    if (this.maxBeds !== null) {
      filtered = filtered.filter(property => property.beds <= this.maxBeds!);
    }

    // Filtrar por baños
    if (this.minBaths !== null) {
      filtered = filtered.filter(property => property.baths >= this.minBaths!);
    }
    if (this.maxBaths !== null) {
      filtered = filtered.filter(property => property.baths <= this.maxBaths!);
    }

    // Filtrar por área
    if (this.minArea !== null) {
      filtered = filtered.filter(property => property.area >= this.minArea!);
    }
    if (this.maxArea !== null) {
      filtered = filtered.filter(property => property.area <= this.maxArea!);
    }

    // Filtrar por precio
    if (this.minPrice !== null) {
      filtered = filtered.filter(property => property.price >= this.minPrice!);
    }
    if (this.maxPrice !== null) {
      filtered = filtered.filter(property => property.price <= this.maxPrice!);
    }

    return filtered;
  }

  // Formatear precio
  formatPrice(price: number): string {
    return '$' + price.toLocaleString();
  }

  // Obtener conteo de propiedades por tipo
  getPropertyCount(type: 'todos' | 'venta' | 'alquiler'): number {
    if (type === 'todos') {
      return this.properties.length;
    }
    return this.properties.filter(property => property.type === type).length;
  }
}