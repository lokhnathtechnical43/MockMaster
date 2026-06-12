import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBCaeu0_deneDAUthMKgoO_n0iW7ke-jPE",
  authDomain: "examprep-bharat.firebaseapp.com",
  projectId: "examprep-bharat",
  storageBucket: "examprep-bharat.firebasestorage.app",
  messagingSenderId: "739166898850",
  appId: "1:739166898850:web:4620317216058d509d65fb"
};

// Initialize Firebase (prevent duplicate initialization)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
