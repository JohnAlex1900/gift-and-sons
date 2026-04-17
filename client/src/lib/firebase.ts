import { getApp, getApps, initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  signInAnonymously,
  GoogleAuthProvider,
  Auth,
} from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

const getRequiredFirebaseEnv = (key: keyof ImportMetaEnv) => {
  const value = import.meta.env[key];

  if (!value) {
    throw new Error(`Missing required Firebase environment variable: ${key}`);
  }

  return value;
};

const apiKey = getRequiredFirebaseEnv("VITE_FIREBASE_API_KEY");
const projectId = getRequiredFirebaseEnv("VITE_FIREBASE_PROJECT_ID");
const appId = getRequiredFirebaseEnv("VITE_FIREBASE_APP_ID");
const authDomain =
  import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${projectId}.firebaseapp.com`;
const storageBucket =
  import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`;

const firebaseConfig = {
  apiKey,
  authDomain,
  projectId,
  storageBucket,
  appId,
};

let auth: Auth;
let db: Firestore;

try {
  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

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

const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleAuthProvider);
    return result.user;
  } catch (error) {
    console.error("Google sign-in error:", error);
    throw error;
  }
};

let publicReadAuthPromise: Promise<void> | null = null;

const ensurePublicReadAuth = async () => {
  if (auth.currentUser) {
    return;
  }

  if (!publicReadAuthPromise) {
    publicReadAuthPromise = signInAnonymously(auth)
      .then(() => {
        // No-op: we only need an authenticated context for Firestore rules.
      })
      .catch((error) => {
        publicReadAuthPromise = null;
        throw error;
      });
  }

  await publicReadAuthPromise;
};

export { auth, db, signInWithGoogle, ensurePublicReadAuth };
