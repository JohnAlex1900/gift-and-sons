import { db } from "./firebase-admin.js"; // Ensure Firestore import
// Define Firestore collections
const usersCollection = db.collection("users");
const propertiesCollection = db.collection("properties");
const reviewsCollection = db.collection("reviews");
const carsCollection = db.collection("cars");
const getPropertyStatusBucket = (status) => status?.toLowerCase() === "sold" ? 1 : 0;
const getPropertyPriority = (priorityOrder) => {
    if (typeof priorityOrder !== "number" || Number.isNaN(priorityOrder)) {
        return Number.MAX_SAFE_INTEGER;
    }
    return priorityOrder;
};
const normalizePriorityOrder = (priorityOrder) => {
    if (typeof priorityOrder !== "number" || !Number.isFinite(priorityOrder)) {
        return undefined;
    }
    return Math.max(0, Math.trunc(priorityOrder));
};
const normalizePropertyStatus = (status) => {
    if (typeof status !== "string" || status.trim() === "") {
        return "available";
    }
    return status.toLowerCase();
};
const sortProperties = (a, b) => {
    const statusSort = getPropertyStatusBucket(a.status) - getPropertyStatusBucket(b.status);
    if (statusSort !== 0)
        return statusSort;
    const prioritySort = getPropertyPriority(a.priorityOrder) - getPropertyPriority(b.priorityOrder);
    if (prioritySort !== 0)
        return prioritySort;
    if (a.featured !== b.featured)
        return a.featured ? -1 : 1;
    return (a.title || "").localeCompare(b.title || "");
};
const sortByExistingPriority = (a, b) => {
    const prioritySort = getPropertyPriority(a.data?.priorityOrder) -
        getPropertyPriority(b.data?.priorityOrder);
    if (prioritySort !== 0)
        return prioritySort;
    return (a.data?.title || "").localeCompare(b.data?.title || "");
};
const getStatusBucketKey = (status) => status?.toLowerCase() === "sold" ? "sold" : "active";
// Fetch all users
export const getAllUsers = async () => {
    const snapshot = await usersCollection.get();
    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }));
};
// Get a single user by ID
export const getUserById = async (id) => {
    const docRef = usersCollection.doc(id);
    const userDoc = await docRef.get();
    return userDoc.exists ? { id: userDoc.id, ...userDoc.data() } : null;
};
// Add a new user
export const addUser = async (user) => {
    const newUserRef = await usersCollection.add(user);
    return { id: newUserRef.id, ...user };
};
// Update an existing user
export const updateUser = async (id, userData) => {
    const docRef = usersCollection.doc(id);
    await docRef.set(userData, { merge: true });
};
// Delete a user
export const deleteUser = async (id) => {
    const docRef = usersCollection.doc(id);
    await docRef.delete();
};
// Fetch all properties
export const getAllProperties = async () => {
    const snapshot = await propertiesCollection.get();
    const properties = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }));
    // Non-sold first, sold last; then priorityOrder controls manual display order.
    properties.sort(sortProperties);
    return properties;
};
// Get a single property by ID
export const getPropertyById = async (id) => {
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
export const addProperty = async (property) => {
    console.log("\uD83D\uDCCC Saving property to Firestore:", property);
    const allPropertiesSnapshot = await propertiesCollection.get();
    const maxPriorityOrder = allPropertiesSnapshot.docs.reduce((max, doc) => {
        const data = doc.data();
        const priority = typeof data.priorityOrder === "number" ? data.priorityOrder : -1;
        return Math.max(max, priority);
    }, -1);
    const propertyData = {
        ...property,
        bedrooms: Array.isArray(property.bedrooms) ? property.bedrooms : [], // Ensure an array
        status: (property.status || "available").toLowerCase(),
        priorityOrder: typeof property.priorityOrder === "number"
            ? property.priorityOrder
            : maxPriorityOrder + 1,
    };
    const newPropertyRef = await propertiesCollection.add(propertyData);
    return { id: newPropertyRef.id, ...propertyData };
};
// Update a property
export const updateProperty = async (id, updates) => {
    const normalizedUpdates = { ...updates };
    if ("status" in normalizedUpdates) {
        normalizedUpdates.status = normalizePropertyStatus(normalizedUpdates.status);
    }
    if ("priorityOrder" in normalizedUpdates) {
        const normalizedPriority = normalizePriorityOrder(normalizedUpdates.priorityOrder);
        if (normalizedPriority === undefined) {
            delete normalizedUpdates.priorityOrder;
        }
        else {
            normalizedUpdates.priorityOrder = normalizedPriority;
        }
    }
    const needsPriorityGuardrail = "status" in normalizedUpdates || "priorityOrder" in normalizedUpdates;
    if (!needsPriorityGuardrail) {
        const docRef = propertiesCollection.doc(id);
        await docRef.set(normalizedUpdates, { merge: true });
        const updatedDoc = await docRef.get();
        return updatedDoc.exists ? { id: updatedDoc.id, ...updatedDoc.data() } : null;
    }
    const updatedProperty = await db.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(propertiesCollection);
        const allDocs = snapshot.docs;
        const targetDoc = allDocs.find((doc) => doc.id === id);
        if (!targetDoc) {
            throw new Error("Property not found");
        }
        const currentData = targetDoc.data();
        const currentStatus = normalizePropertyStatus(currentData.status);
        const nextStatus = "status" in normalizedUpdates
            ? normalizePropertyStatus(normalizedUpdates.status)
            : currentStatus;
        const explicitPriority = "priorityOrder" in normalizedUpdates
            ? normalizePriorityOrder(normalizedUpdates.priorityOrder)
            : undefined;
        const activeProperties = [];
        const soldProperties = [];
        for (const doc of allDocs) {
            if (doc.id === id)
                continue;
            const data = doc.data();
            const bucket = getStatusBucketKey(normalizePropertyStatus(data.status));
            const entry = {
                ref: doc.ref,
                data,
            };
            if (bucket === "sold") {
                soldProperties.push(entry);
            }
            else {
                activeProperties.push(entry);
            }
        }
        activeProperties.sort(sortByExistingPriority);
        soldProperties.sort(sortByExistingPriority);
        const insertionBucket = getStatusBucketKey(nextStatus) === "sold" ? soldProperties : activeProperties;
        const currentPriority = getPropertyPriority(currentData.priorityOrder);
        const defaultIndex = insertionBucket.findIndex((item) => getPropertyPriority(item.data.priorityOrder) > currentPriority);
        const targetIndex = explicitPriority !== undefined
            ? Math.min(explicitPriority, insertionBucket.length)
            : "status" in normalizedUpdates
                ? insertionBucket.length
                : defaultIndex === -1
                    ? insertionBucket.length
                    : defaultIndex;
        const targetReference = propertiesCollection.doc(id);
        insertionBucket.splice(targetIndex, 0, {
            ref: targetReference,
            data: {
                ...currentData,
                ...normalizedUpdates,
                status: nextStatus,
            },
        });
        const applySequentialPriorities = (items) => {
            items.forEach((item, index) => {
                if (getPropertyPriority(item.data.priorityOrder) !== index) {
                    transaction.set(item.ref, { priorityOrder: index }, { merge: true });
                }
            });
        };
        applySequentialPriorities(activeProperties);
        applySequentialPriorities(soldProperties);
        const assignedPriority = (getStatusBucketKey(nextStatus) === "sold" ? soldProperties : activeProperties).findIndex((item) => item.ref.id === id);
        const targetUpdateData = {
            ...normalizedUpdates,
            status: nextStatus,
            priorityOrder: assignedPriority,
        };
        transaction.set(targetReference, targetUpdateData, { merge: true });
        return {
            id,
            ...currentData,
            ...targetUpdateData,
        };
    });
    return updatedProperty;
};
// Delete a property
export const deleteProperty = async (id) => {
    const docRef = propertiesCollection.doc(id);
    await docRef.delete();
};
// Add an review
export const createReview = async (review) => {
    const reviewWithDateString = {
        ...review,
        createdAt: new Date().toISOString().split("T")[0], // Ensure createdAt is included
        viewed: false,
    };
    const newReviewRef = await reviewsCollection.add(reviewWithDateString);
    return { id: newReviewRef.id, ...reviewWithDateString };
};
export const markReviewsAsViewed = async ({ propertyId, carId, }) => {
    let query = reviewsCollection.where("viewed", "==", false);
    if (propertyId) {
        query = query.where("propertyId", "==", propertyId);
    }
    else if (carId) {
        query = query.where("carId", "==", carId);
    }
    const snapshot = await query.get();
    const batch = reviewsCollection.firestore.batch();
    snapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { viewed: true });
    });
    await batch.commit();
    return snapshot.size; // number of reviews marked as viewed
};
export const countUnviewedReviews = async () => {
    const query = reviewsCollection.where("viewed", "==", false);
    const snapshot = await query.get();
    return snapshot.size;
};
//Replies
// Add a reply to a review
export const addReplyToReview = async (reviewId, replyMessage) => {
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
export const getReviewsByUser = async (userId) => {
    const snapshot = await reviewsCollection.where("userId", "==", userId).get();
    return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }));
};
// Get inquiries by property ID
export const getReviewsByProperty = async (propertyId) => {
    const snapshot = await reviewsCollection
        .where("propertyId", "==", propertyId)
        .get();
    return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            createdAt: typeof data.createdAt === "string" ? data.createdAt : "Unknown Date",
        };
    });
};
export const getReviewsByCar = async (carId) => {
    const snapshot = await reviewsCollection.where("carId", "==", carId).get();
    return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            createdAt: typeof data.createdAt === "string" ? data.createdAt : "Unknown Date",
        };
    });
};
export const deleteReview = async (id) => {
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
export const getCarById = async (id) => {
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
export const addCar = async (car) => {
    console.log("\uD83D\uDCCC Saving car to Firestore:", car);
    const carData = {
        ...car,
    };
    const newcarRef = await carsCollection.add(carData);
    return { id: newcarRef.id, ...carData };
};
export const updateCar = async (id, updates) => {
    const docRef = carsCollection.doc(id);
    await docRef.set(updates, { merge: true });
    const updatedDoc = await docRef.get();
    return updatedDoc.exists ? { id: updatedDoc.id, ...updatedDoc.data() } : null;
};
// Delete a property
export const deleteCar = async (id) => {
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
    markReviewsAsViewed,
    countUnviewedReviews,
};
export default storage;
