import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// ============================================================
// Firebase Configuration
// ============================================================
// Config values are loaded from .env.local (NEXT_PUBLIC_ prefix)
// This keeps your API keys out of source code.
//
// Setup:
//   1. Go to https://console.firebase.google.com
//   2. Create project → Add Web App → Copy config
//   3. Paste values in .env.local (see .env.local.example)
// ============================================================

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "",
};

// Check if Firebase config is available
const isFirebaseConfigured = !!firebaseConfig.apiKey && !!firebaseConfig.projectId;

// Initialize Firebase (prevent duplicate initialization)
let app;
if (isFirebaseConfigured) {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
} else {
  console.warn(
    "[Firebase] No configuration found. Add your Firebase config to .env.local. " +
    "The app will use localStorage fallback mode."
  );
  // Create a dummy app reference that won't crash
  app = null;
}

// Export services - only if Firebase is configured
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export const storage = app ? getStorage(app) : null;

/** Check if Firebase is properly configured and ready to use */
export function isFirebaseReady(): boolean {
  return isFirebaseConfigured && app !== null;
}

export default app;
