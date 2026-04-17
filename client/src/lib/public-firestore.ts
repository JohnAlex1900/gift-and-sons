import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db, ensurePublicReadAuth } from "@/lib/firebase";
import { apiUrl } from "@/api";
import type { Car, Property, Review } from "@/types";

const withPublicReadAuth = async <T>(task: () => Promise<T>) => {
  await ensurePublicReadAuth();
  return task();
};

const isFirestorePermissionError = (error: unknown) => {
  const code =
    typeof error === "object" && error && "code" in error
      ? (error as { code?: unknown }).code
      : undefined;
  const message =
    typeof error === "object" && error && "message" in error
      ? (error as { message?: unknown }).message
      : undefined;

  return (
    code === "permission-denied" ||
    (typeof message === "string" &&
      message.toLowerCase().includes("insufficient permissions"))
  );
};

const fetchFromApi = async <T>(path: string) => {
  const response = await fetch(apiUrl(path));
  if (!response.ok) {
    throw new Error(`API fallback failed: ${response.status}`);
  }

  return (await response.json()) as T;
};

const readWithApiFallback = async <T>(path: string, reader: () => Promise<T>) => {
  try {
    return await reader();
  } catch (error) {
    if (!isFirestorePermissionError(error)) {
      throw error;
    }

    return fetchFromApi<T>(path);
  }
};

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
  const snapshot = await readWithApiFallback(
    "/api/properties/featured",
    async () =>
      withPublicReadAuth(() =>
        getDocs(
          query(collection(db, "properties"), where("featured", "==", true))
        )
      )
  );

  return Array.isArray(snapshot) ? snapshot : snapshot.docs.map(mapProperty);
}

export async function fetchProperties() {
  const snapshot = await readWithApiFallback(
    "/api/properties",
    async () => withPublicReadAuth(() => getDocs(collection(db, "properties")))
  );

  const properties = Array.isArray(snapshot)
    ? snapshot
    : snapshot.docs.map(mapProperty);

  properties.sort(sortProperties);
  return properties;
}

export async function fetchPropertyById(id: string) {
  const snapshot = await readWithApiFallback(
    `/api/properties/${id}`,
    async () => withPublicReadAuth(() => getDoc(doc(db, "properties", id)))
  );

  if (!snapshot) {
    return null;
  }

  return "exists" in (snapshot as object)
    ? (snapshot as { exists: () => boolean; id: string; data: () => unknown }).exists()
      ? ({
          id: (snapshot as { id: string }).id,
          ...(snapshot as { data: () => unknown }).data(),
        } as Property)
      : null
    : (snapshot as Property);
}

export async function fetchFeaturedCars() {
  const snapshot = await readWithApiFallback(
    "/api/cars/featured",
    async () =>
      withPublicReadAuth(() =>
        getDocs(query(collection(db, "cars"), where("featured", "==", true)))
      )
  );

  return Array.isArray(snapshot) ? snapshot : snapshot.docs.map(mapCar);
}

export async function fetchCars() {
  const snapshot = await readWithApiFallback(
    "/api/cars",
    async () => withPublicReadAuth(() => getDocs(collection(db, "cars")))
  );
  const cars = Array.isArray(snapshot) ? snapshot : snapshot.docs.map(mapCar);

  cars.sort(sortCars);
  return cars;
}

export async function fetchCarById(id: string) {
  const snapshot = await readWithApiFallback(
    `/api/cars/${id}`,
    async () => withPublicReadAuth(() => getDoc(doc(db, "cars", id)))
  );

  if (!snapshot) {
    return null;
  }

  return "exists" in (snapshot as object)
    ? (snapshot as { exists: () => boolean; id: string; data: () => unknown }).exists()
      ? ({
          id: (snapshot as { id: string }).id,
          ...(snapshot as { data: () => unknown }).data(),
        } as Car)
      : null
    : (snapshot as Car);
}

export async function fetchReviewsByProperty(propertyId: string) {
  const snapshot = await readWithApiFallback(
    `/api/reviews/property/${propertyId}`,
    async () =>
      withPublicReadAuth(() =>
        getDocs(
          query(collection(db, "reviews"), where("propertyId", "==", propertyId))
        )
      )
  );

  return Array.isArray(snapshot) ? snapshot : snapshot.docs.map(mapReview);
}

export async function fetchReviewsByCar(carId: string) {
  const snapshot = await readWithApiFallback(
    `/api/reviews/car/${carId}`,
    async () =>
      withPublicReadAuth(() =>
        getDocs(query(collection(db, "reviews"), where("carId", "==", carId)))
      )
  );

  return Array.isArray(snapshot) ? snapshot : snapshot.docs.map(mapReview);
}

export async function fetchAllReviews() {
  const snapshot = await readWithApiFallback(
    "/api/reviews",
    async () => withPublicReadAuth(() => getDocs(collection(db, "reviews")))
  );

  return Array.isArray(snapshot) ? snapshot : snapshot.docs.map(mapReview);
}
