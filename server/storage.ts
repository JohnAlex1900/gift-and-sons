import { db } from "./firebase-admin"; // Ensure Firestore import
import { Timestamp } from "firebase-admin/firestore";

// Define Firestore collections
const usersCollection = db.collection("users");
const propertiesCollection = db.collection("properties");
const reviewsCollection = db.collection("reviews");
const carsCollection = db.collection("cars");

// Fetch all users
export const getAllUsers = async () => {
  const snapshot = await usersCollection.get();
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

// Get a single user by ID
export const getUserById = async (id: string) => {
  const docRef = usersCollection.doc(id);
  const userDoc = await docRef.get();
  return userDoc.exists ? { id: userDoc.id, ...userDoc.data() } : null;
};

// Add a new user
export const addUser = async (user: {
  name: string;
  email: string;
  firebaseId: string;
  role?: string;
}) => {
  const newUserRef = await usersCollection.add(user);
  return { id: newUserRef.id, ...user };
};

// Update an existing user
export const updateUser = async (
  id: string,
  userData: Partial<{ name: string; email: string; role: string }>
) => {
  const docRef = usersCollection.doc(id);
  await docRef.set(userData, { merge: true });
};

// Delete a user
export const deleteUser = async (id: string) => {
  const docRef = usersCollection.doc(id);
  await docRef.delete();
};

// Fetch all properties
export const getAllProperties = async () => {
  const snapshot = await propertiesCollection.get();
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

// Get a single property by ID
export const getPropertyById = async (id: string) => {
  const docRef = propertiesCollection.doc(id);
  const propertyDoc = await docRef.get();
  return propertyDoc.exists
    ? { id: propertyDoc.id, ...propertyDoc.data() }
    : null;
};

// Get featured properties
export const getFeaturedProperties = async () => {
  const snapshot = await propertiesCollection
    .where("featured", "==", true)
    .get();
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

// Add a new property
export const addProperty = async (property: {
  title: string;
  type: string;
  description: string;
  price: number;
  category: string;
  location: string;
  area?: number | null;
  bedrooms?: number[] | [];
  bathrooms?: number | null;
  featured?: boolean | null;
  status?: string;
  imageUrls?: string[];
  youtubeLink?: string;
}) => {
  console.log("📌 Saving property to Firestore:", property);

  const propertyData = {
    ...property,
    bedrooms: Array.isArray(property.bedrooms) ? property.bedrooms : [], // Ensure an array
  };

  const newPropertyRef = await propertiesCollection.add(propertyData);
  return { id: newPropertyRef.id, ...propertyData };
};

// Update a property
export const updateProperty = async (id: string, updates: Partial<any>) => {
  const docRef = propertiesCollection.doc(id);
  await docRef.set(updates, { merge: true });
};

// Delete a property
export const deleteProperty = async (id: string) => {
  const docRef = propertiesCollection.doc(id);
  await docRef.delete();
};

// Add an review
export const createReview = async (review: {
  propertyId?: string;
  carId?: string;
  message: string;
  rating: number;
}) => {
  const reviewWithDateString = {
    ...review,
    createdAt: new Date().toISOString().split("T")[0], // Ensure createdAt is included
  };
  const newReviewRef = await reviewsCollection.add(reviewWithDateString);
  return { id: newReviewRef.id, ...reviewWithDateString };
};

//Replies
// Add a reply to a review
export const addReplyToReview = async (
  reviewId: string,
  replyMessage: string
) => {
  const reviewRef = reviewsCollection.doc(reviewId);
  const reviewDoc = await reviewRef.get();

  if (!reviewDoc.exists) {
    throw new Error("Review not found");
  }

  // Update the review with the reply
  await reviewRef.update({
    reply: {
      message: replyMessage,
      createdAt: new Date().toISOString(),
      adminName: "Gift & Sons Properties International",
    },
  });

  return { success: true, message: "Reply added successfully" };
};

// Fetch all reviews
export const getAllReviews = async () => {
  const snapshot = await reviewsCollection.get();
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

// Get reviews by user ID
export const getReviewsByUser = async (userId: string) => {
  const snapshot = await reviewsCollection.where("userId", "==", userId).get();
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

// Get inquiries by property ID
export const getReviewsByProperty = async (propertyId: string) => {
  const snapshot = await reviewsCollection
    .where("propertyId", "==", propertyId)
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();

    return {
      id: doc.id,
      ...data,
      createdAt:
        typeof data.createdAt === "string" ? data.createdAt : "Unknown Date",
    };
  });
};

export const getReviewsByCar = async (carId: string) => {
  const snapshot = await reviewsCollection.where("carId", "==", carId).get();
  return snapshot.docs.map((doc) => {
    const data = doc.data();

    return {
      id: doc.id,
      ...data,
      createdAt:
        typeof data.createdAt === "string" ? data.createdAt : "Unknown Date",
    };
  });
};

export const deleteReview = async (id: string) => {
  const docRef = reviewsCollection.doc(id);
  await docRef.delete();
};

//Car Functionality
export const getAllCars = async () => {
  const snapshot = await carsCollection.get();
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

export const getCarById = async (id: string) => {
  const docRef = carsCollection.doc(id);
  const carDoc = await docRef.get();
  return carDoc.exists ? { id: carDoc.id, ...carDoc.data() } : null;
};

export const getFeaturedCars = async () => {
  const snapshot = await carsCollection.where("featured", "==", true).get();
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

export const addCar = async (car: {
  title: string;
  type: string;
  description: string;
  price: number;
  year: number;
  make: string;
  model: string;
  mileage: number;
  condition: string;
  imageUrls?: string[]; // Optional array of image URLs
  featured?: boolean; // Optional
  youtubeLink?: string;
}) => {
  console.log("📌 Saving car to Firestore:", car);

  const carData = {
    ...car,
  };

  const newcarRef = await carsCollection.add(carData);
  return { id: newcarRef.id, ...carData };
};

export const updateCar = async (id: string, updates: Partial<any>) => {
  const docRef = carsCollection.doc(id);
  await docRef.set(updates, { merge: true });
};

// Delete a property
export const deleteCar = async (id: string) => {
  const docRef = carsCollection.doc(id);
  await docRef.delete();
};

const storage = {
  getAllUsers,
  getUserById,
  addUser,
  updateUser,
  deleteUser,
  getAllProperties,
  getPropertyById,
  getFeaturedProperties,
  addProperty,
  updateProperty,
  deleteProperty,
  createReview,
  addReplyToReview,
  getAllReviews,
  getReviewsByUser,
  getReviewsByProperty,
  getReviewsByCar,
  deleteReview,
  getAllCars,
  getCarById,
  getFeaturedCars,
  addCar,
  updateCar,
  deleteCar,
};

export default storage;
