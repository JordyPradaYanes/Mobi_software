export interface Property {
  id?: string; // Optional: Firestore document ID
  userId: string; // ID of the user who owns the property
  
  // Basic Information
  propertyType: 'casa' | 'apartamento' | 'oficina' | 'local' | 'terreno' | 'bodega' | 'finca';
  transactionType: 'venta' | 'alquiler' | 'alquiler-venta';
  address: string;
  neighborhood: string;
  city: string;
  
  // Economic Information
  price: number;
  administrationFee?: number; // Optional monthly administration fee
  
  // Physical Characteristics
  bedrooms: number;
  bathrooms: number;
  parkingSpaces?: number; // Optional parking spaces
  floor?: number; // Optional floor number
  totalArea: number; // Total area in square meters
  builtArea?: number; // Optional built area in square meters
  
  // Additional Information
  description: string;
  amenities?: string[]; // Optional amenities array
  nearbyPlaces?: string[]; // Optional nearby places
  
  // Media
  imageUrls?: string[]; // Optional: Array of URLs for property images
  
  // Metadata
  createdAt?: Date; // Optional: Timestamp of when the property was created
  updatedAt?: Date; // Optional: Timestamp of when the property was last updated
  isActive?: boolean; // Optional: Whether the property is active/published
}