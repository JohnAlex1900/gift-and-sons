import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore"; // ✅ Import Firestore
import { createRequire } from "module";
var require = createRequire(import.meta.url);
var serviceAccount = require("./gift&sons.json");
// Initialize Firebase Admin SDK
var app = initializeApp({
    credential: cert(serviceAccount),
});
export var adminAuth = getAuth(app);
export var db = getFirestore(app); // ✅ Add Firestore instance
