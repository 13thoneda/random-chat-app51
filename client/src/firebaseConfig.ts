// src/firebaseConfig.ts - DEPRECATED: Use config/firebase.config.ts instead
// This file is kept for backwards compatibility but should use environment variables

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// ⚠️ WARNING: This configuration should be moved to environment variables
// Use the secure configuration from config/firebase.config.ts instead

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyB3wZTanCdGxG6jpo39CkqUcM9LhK17BME",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "ajnabicam.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "ajnabicam",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "ajnabicam.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "558188110620",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:558188110620:web:500cdf55801d5b00e9d0d9",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-XM2WK7W95Q",
};

// ✅ Prevent duplicate initialization
const firebaseApp = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApp();

// Add error handling for Firebase initialization
if (!firebaseApp) {
  console.error("Failed to initialize Firebase app");
  throw new Error("Firebase initialization failed");
}

console.log("✅ Firebase app initialized successfully");

// ✅ Core exports with initialization checks
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);
export { firebaseApp };

// Verify database is properly initialized
try {
  if (!db) {
    throw new Error("Firestore database not initialized");
  }
  console.log("✅ Firebase Firestore initialized successfully");
} catch (error) {
  console.error("❌ Firebase Firestore initialization error:", error);
}

// ✅ Optional: Analytics (only in production + HTTPS)
let analytics: any = null;

if (import.meta.env.PROD) {
  isSupported()
    .then((supported) => {
      if (supported) {
        analytics = getAnalytics(firebaseApp);
      }
    })
    .catch(() => {
      analytics = null;
    });
}

export { analytics };
