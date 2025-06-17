import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Property {
  id: number;
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  imageUrl?: string;
}

@Component({
  selector: 'app-property-card',
  imports: [CommonModule],
  templateUrl: './property-card.component.html',
  styleUrl: './property-card.component.css'
})
export class PropertyCardComponent {
  @Input() property: Property | undefined;
}
