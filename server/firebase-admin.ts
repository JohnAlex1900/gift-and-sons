import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore"; // ✅ Import Firestore
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const serviceAccount = require("../gift&sons.json");

// Initialize Firebase Admin SDK
const app = initializeApp({
  credential: cert(serviceAccount),
});

export const adminAuth = getAuth(app);
export const db = getFirestore(app); // ✅ Add Firestore instance
