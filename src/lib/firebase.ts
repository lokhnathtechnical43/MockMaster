import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// ============================================================
// Firebase Configuration - with safe initialization
// ============================================================

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || undefined,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

// Remove undefined values
Object.keys(firebaseConfig).forEach(key => {
  if ((firebaseConfig as any)[key] === undefined || (firebaseConfig as any)[key] === "") {
    delete (firebaseConfig as any)[key];
  }
});

// Check if Firebase config is available
const isFirebaseConfigured = !!firebaseConfig.apiKey && !!firebaseConfig.projectId;

// Safe initialization with try-catch
let app: any = null;
let authInstance: any = null;
let dbInstance: any = null;
let storageInstance: any = null;
let firebaseReady = false;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    authInstance = getAuth(app);
    dbInstance = getFirestore(app);
    storageInstance = getStorage(app);
    firebaseReady = true;
    console.log("[Firebase] Initialized successfully for project:", firebaseConfig.projectId);
  } catch (error) {
    console.error("[Firebase] Initialization failed:", error);
    app = null;
    authInstance = null;
    dbInstance = null;
    storageInstance = null;
    firebaseReady = false;
  }
} else {
  console.warn(
    "[Firebase] No configuration found. The app will use localStorage fallback mode."
  );
}

// Export services
export const auth = authInstance;
export const db = dbInstance;
export const storage = storageInstance;

/** Check if Firebase is properly configured and ready to use */
export function isFirebaseReady(): boolean {
  return firebaseReady && app !== null;
}

export default app;
