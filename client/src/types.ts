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
  youtubeLink?: string; // Optional
}

export interface Inquiry {
  id: string; // Firestore document ID
  propertyId: string;
  propertyName: string;
  userId: string;
  userEmail: string;
  message: string;
  number: string;
  createdAt: Date;
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
