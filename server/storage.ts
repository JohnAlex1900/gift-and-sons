import { db } from "./firebase-admin"; // Ensure Firestore import
import { Timestamp } from "firebase-admin/firestore";

// Define Firestore collections
const usersCollection = db.collection("users");
const propertiesCollection = db.collection("properties");
const inquiriesCollection = db.collection("inquiries");

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

// Add an inquiry
export const createInquiry = async (inquiry: {
  userId: string;
  propertyId: string;
  propertyName: string;
  userEmail: string;
  message: string;
  number: string;
  status?: string;
}) => {
  const inquiryWithTimestamp = {
    ...inquiry,
    createdAt: Timestamp.now(), // Ensure createdAt is included
  };
  const newInquiryRef = await inquiriesCollection.add(inquiryWithTimestamp);
  return { id: newInquiryRef.id, ...inquiryWithTimestamp };
};

// Fetch all inquiries
export const getAllInquiries = async () => {
  const snapshot = await inquiriesCollection.get();
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

// Get inquiries by user ID
export const getInquiriesByUser = async (userId: string) => {
  const snapshot = await inquiriesCollection
    .where("userId", "==", userId)
    .get();
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

// Get inquiries by property ID
export const getInquiriesByProperty = async (propertyId: string) => {
  const snapshot = await inquiriesCollection
    .where("propertyId", "==", propertyId)
    .get();
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

export const deleteInquiry = async (id: string) => {
  const docRef = inquiriesCollection.doc(id);
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
  createInquiry,
  getAllInquiries,
  getInquiriesByUser,
  getInquiriesByProperty,
  deleteInquiry,
};

export default storage;
