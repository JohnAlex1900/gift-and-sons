import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  Auth,
} from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

const apiKey =
  import.meta.env.VITE_FIREBASE_API_KEY ||
  "AIzaSyBUoow980B4TWoEhVSYuTfRbbvspQdL6kk";
const projectId =
  import.meta.env.VITE_FIREBASE_PROJECT_ID || "giftandsons-f2952";
const appId =
  import.meta.env.VITE_FIREBASE_APP_ID ||
  "1:511753409697:web:07d449384bb60b5bf84ce0";

// Ensure all required configuration values are present
const requiredEnvVars = {
  apiKey: apiKey,
  projectId: projectId,
  appId: appId,
};

// Debug configuration (remove in production)
console.log("Firebase Configuration Check:", {
  apiKeyExists: !!requiredEnvVars.apiKey,
  projectIdExists: !!requiredEnvVars.projectId,
  appIdExists: !!requiredEnvVars.appId,
});

// Validate Firebase configuration
Object.entries(requiredEnvVars).forEach(([key, value]) => {
  if (!value) {
    throw new Error(`Missing Firebase configuration: ${key}`);
  }
});

console.log("Environment Variables:", import.meta.env);
console.log("VITE_FIREBASE_API_KEY:", import.meta.env.VITE_FIREBASE_API_KEY);

const firebaseConfig = {
  apiKey: "AIzaSyBUoow980B4TWoEhVSYuTfRbbvspQdL6kk",
  authDomain: `${projectId}.firebaseapp.com`,
  projectId: projectId,
  storageBucket: `${projectId}.appspot.com`,
  appId: appId,
};

let auth: Auth;
let db: Firestore; // Explicitly define the Firestore type

try {
  console.log("Initializing Firebase app...");
  const app = initializeApp(firebaseConfig);
  console.log("Firebase app initialized successfully");

  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  console.error("Firebase initialization error:", error);
  throw error;
}

// Google Auth Provider
const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.setCustomParameters({
  prompt: "select_account",
});

// Function to handle Google sign-in with popup
const signInWithGoogle = async () => {
  try {
    console.log("Attempting Google sign-in...");
    const result = await signInWithPopup(auth, googleAuthProvider);
    console.log("Google sign-in successful:", result.user);
    return result.user; // Return the user object for further use
  } catch (error) {
    console.error("Google sign-in error:", error);
    throw error;
  }
};

export { auth, db, signInWithGoogle };
