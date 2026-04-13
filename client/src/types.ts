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
  priorityOrder?: number; // Optional
  youtubeLink?: string; // Optional
}

export interface Car {
  id: string; // Firestore document ID
  title: string;
  description: string;
  price: number;
  year: number;
  make: string;
  model: string;
  mileage: number;
  condition: string;
  imageUrls?: string[]; // Optional array of image URLs
  featured?: boolean; // Optional
  youtubeLink?: string; // Optional
}

export interface Review {
  id: string; // Firestore document ID
  propertyId?: string;
  carId?: string;
  message: string;
  rating: number;
  createdAt: string;
  viewed: boolean;
  username: string;
  userId: string;
  reply?: { message: string; createdAt: Date } | null;
}

export interface Item {
  id: string;
  title: string;
  price: string;
  imageUrls: string;
}

export interface Login {
  email: string;
  password: string;
}

export interface Register {
  name: string;
  email: string;
  password: string;
}
