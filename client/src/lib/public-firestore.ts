import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Car, Property, Review } from "@/types";

const getPropertyStatusBucket = (status?: string) =>
  status?.toLowerCase() === "sold" ? 1 : 0;

const getPropertyPriority = (priorityOrder?: unknown) => {
  if (typeof priorityOrder !== "number" || Number.isNaN(priorityOrder)) {
    return Number.MAX_SAFE_INTEGER;
  }

  return priorityOrder;
};

const sortProperties = (a: Property, b: Property) => {
  const statusSort =
    getPropertyStatusBucket(a.status) - getPropertyStatusBucket(b.status);
  if (statusSort !== 0) return statusSort;

  const prioritySort =
    getPropertyPriority(a.priorityOrder) - getPropertyPriority(b.priorityOrder);
  if (prioritySort !== 0) return prioritySort;

  if (a.featured !== b.featured) return a.featured ? -1 : 1;
  return (a.title || "").localeCompare(b.title || "");
};

const sortCars = (a: Car, b: Car) => {
  if (a.featured !== b.featured) return a.featured ? -1 : 1;
  return (a.title || "").localeCompare(b.title || "");
};

const mapProperty = (snapshot: { id: string; data: () => unknown }) => ({
  id: snapshot.id,
  ...(snapshot.data() as Omit<Property, "id">),
}) as Property;

const mapCar = (snapshot: { id: string; data: () => unknown }) => ({
  id: snapshot.id,
  ...(snapshot.data() as Omit<Car, "id">),
}) as Car;

const mapReview = (snapshot: { id: string; data: () => unknown }) => ({
  id: snapshot.id,
  ...(snapshot.data() as Omit<Review, "id">),
}) as Review;

export async function fetchFeaturedProperties() {
  const snapshot = await getDocs(
    query(collection(db, "properties"), where("featured", "==", true))
  );

  return snapshot.docs.map(mapProperty);
}

export async function fetchProperties() {
  const snapshot = await getDocs(collection(db, "properties"));
  const properties = snapshot.docs.map(mapProperty);

  properties.sort(sortProperties);
  return properties;
}

export async function fetchPropertyById(id: string) {
  const snapshot = await getDoc(doc(db, "properties", id));
  return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Property) : null;
}

export async function fetchFeaturedCars() {
  const snapshot = await getDocs(
    query(collection(db, "cars"), where("featured", "==", true))
  );

  return snapshot.docs.map(mapCar);
}

export async function fetchCars() {
  const snapshot = await getDocs(collection(db, "cars"));
  const cars = snapshot.docs.map(mapCar);

  cars.sort(sortCars);
  return cars;
}

export async function fetchCarById(id: string) {
  const snapshot = await getDoc(doc(db, "cars", id));
  return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Car) : null;
}

export async function fetchReviewsByProperty(propertyId: string) {
  const snapshot = await getDocs(
    query(collection(db, "reviews"), where("propertyId", "==", propertyId))
  );

  return snapshot.docs.map(mapReview);
}

export async function fetchReviewsByCar(carId: string) {
  const snapshot = await getDocs(
    query(collection(db, "reviews"), where("carId", "==", carId))
  );

  return snapshot.docs.map(mapReview);
}

export async function fetchAllReviews() {
  const snapshot = await getDocs(collection(db, "reviews"));
  return snapshot.docs.map(mapReview);
}
