import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Property } from '../../interfaces/property.interface';

@Component({
  selector: 'app-property-card',
  imports: [CommonModule],
  templateUrl: './property-card.component.html',
  styleUrl: './property-card.component.css'
})
export class PropertyCardComponent {
  @Input() property!: Property;
  imageLoaded = false;

  // Handle image load error
  onImageError(event: any): void {
    event.target.style.display = 'none';
    this.imageLoaded = false;
  }

  // Get property type label in Spanish
  getPropertyTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'casa': 'Casa',
      'apartamento': 'Apartamento',
      'oficina': 'Oficina',
      'local': 'Local',
      'terreno': 'Terreno',
      'bodega': 'Bodega',
      'finca': 'Finca'
    };
    return labels[type] || type;
  }

  // Get transaction type label in Spanish
  getTransactionTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'venta': 'Venta',
      'alquiler': 'Alquiler',
      'alquiler-venta': 'Alquiler/Venta'
    };
    return labels[type] || type;
  }

  // Get transaction badge class for styling
  getTransactionBadgeClass(type: string): string {
    const baseClasses = 'backdrop-blur-sm shadow-md';
    const typeClasses: { [key: string]: string } = {
      'venta': 'bg-green-500/90 text-white',
      'alquiler': 'bg-blue-500/90 text-white',
      'alquiler-venta': 'bg-purple-500/90 text-white'
    };
    return `${baseClasses} ${typeClasses[type] || 'bg-gray-500/90 text-white'}`;
  }
}