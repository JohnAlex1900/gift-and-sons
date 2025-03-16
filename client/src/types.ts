export interface Property {
  id: string; // Firestore document ID
  title: string;
  description: string;
  price: number;
  type: string; // sale, rent, lease
  category: string; // house, apartment, land
  location: string;
  bedrooms: number[]; // Array of bedroom counts
  bathrooms?: number; // Optional
  area?: number; // Optional
  imageUrls?: string[]; // Optional array of image URLs
  featured?: boolean; // Optional
  status?: string; // Optional
}
