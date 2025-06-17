export interface Property {
  id?: string; // Optional: Firestore document ID
  userId: string; // ID of the user who owns the property
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  description: string;
  imageUrls?: string[]; // Optional: Array of URLs for property images
  createdAt?: Date; // Optional: Timestamp of when the property was created
}
