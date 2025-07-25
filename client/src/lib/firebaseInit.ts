import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyB3wZTanCdGxG6jpo39CkqUcM9LhK17BME",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "ajnabicam.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "ajnabicam",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "ajnabicam.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "558188110620",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:558188110620:web:500cdf55801d5b00e9d0d9",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-XM2WK7W95Q",
};

// Initialize Firebase
let firebaseApp: any = null;
let db: any = null;
let auth: any = null;
let storage: any = null;

function initializeFirebase() {
  try {
    // Initialize Firebase app
    firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    
    // Initialize services
    db = getFirestore(firebaseApp);
    auth = getAuth(firebaseApp);
    storage = getStorage(firebaseApp);
    
    console.log("✅ Firebase initialized successfully");
    return true;
  } catch (error) {
    console.error("❌ Firebase initialization failed:", error);
    return false;
  }
}

// Initialize immediately
const isInitialized = initializeFirebase();

// Export safe getters
export function getDatabase() {
  if (!db && !initializeFirebase()) {
    throw new Error("Firebase database is not available");
  }
  return db;
}

export function getAuthInstance() {
  if (!auth && !initializeFirebase()) {
    throw new Error("Firebase auth is not available");
  }
  return auth;
}

export function getStorageInstance() {
  if (!storage && !initializeFirebase()) {
    throw new Error("Firebase storage is not available");
  }
  return storage;
}

export function getAppInstance() {
  if (!firebaseApp && !initializeFirebase()) {
    throw new Error("Firebase app is not available");
  }
  return firebaseApp;
}

// Also export the instances directly for compatibility
export { firebaseApp, db, auth, storage };
