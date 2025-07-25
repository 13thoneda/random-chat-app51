import { 
  collection as firestoreCollection,
  doc as firestoreDoc,
  addDoc as firestoreAddDoc,
  getDoc as firestoreGetDoc,
  setDoc as firestoreSetDoc,
  updateDoc as firestoreUpdateDoc,
  deleteDoc as firestoreDeleteDoc,
  query as firestoreQuery,
  where as firestoreWhere,
  orderBy as firestoreOrderBy,
  limit as firestoreLimit,
  onSnapshot as firestoreOnSnapshot,
  getDocs as firestoreGetDocs,
  serverTimestamp,
  Timestamp,
  increment,
  arrayUnion,
  arrayRemove
} from "firebase/firestore";

// Safe database getter with initialization check
let dbInstance: any = null;
let initializationAttempted = false;
let lastError: string | null = null;

const getDatabase = () => {
  if (!dbInstance && !initializationAttempted) {
    initializationAttempted = true;
    try {
      // Try multiple approaches to get the database
      let firebaseConfig;

      // Approach 1: Direct require
      try {
        firebaseConfig = require("../firebaseConfig");
      } catch (e) {
        console.warn("Could not require firebaseConfig directly");
      }

      // Approach 2: Try alternative config
      if (!firebaseConfig || !firebaseConfig.db) {
        try {
          firebaseConfig = require("../config/firebase.config");
        } catch (e) {
          console.warn("Could not require alternative firebase config");
        }
      }

      if (firebaseConfig && firebaseConfig.db) {
        dbInstance = firebaseConfig.db;
        console.log("✅ Database instance obtained successfully");
        lastError = null;
      } else {
        lastError = "Database not found in any firebaseConfig";
        console.error("❌", lastError);
        // Wait a bit and try again
        setTimeout(() => {
          initializationAttempted = false;
        }, 2000);
      }
    } catch (error) {
      lastError = `Failed to get database instance: ${error}`;
      console.error(lastError);
      // Reset flag to allow retry
      setTimeout(() => {
        initializationAttempted = false;
      }, 2000);
    }
  }
  return dbInstance;
};

// Safe wrapper functions
export const collection = (path: string, ...pathSegments: string[]) => {
  const db = getDatabase();
  if (!db) {
    const errorMsg = `Database not available. Cannot access collection: ${path}. Last error: ${lastError || 'Unknown'}`;
    console.error("❌ Collection operation failed:", errorMsg);

    // Create a more descriptive error
    const error = new Error(errorMsg);
    error.name = "FirestoreWrapperError";
    throw error;
  }

  try {
    return firestoreCollection(db, path, ...pathSegments);
  } catch (error) {
    console.error("❌ Firestore collection() call failed:", error);
    throw error;
  }
};

export const doc = (path: string, ...pathSegments: string[]) => {
  const db = getDatabase();
  if (!db) {
    console.error("Database not available for doc operation, path:", path);
    throw new Error(`Database not available. Cannot access document: ${path}`);
  }
  return firestoreDoc(db, path, ...pathSegments);
};

export const addDoc = async (reference: any, data: any) => {
  return firestoreAddDoc(reference, data);
};

export const getDoc = async (reference: any) => {
  return firestoreGetDoc(reference);
};

export const setDoc = async (reference: any, data: any, options?: any) => {
  return firestoreSetDoc(reference, data, options);
};

export const updateDoc = async (reference: any, data: any) => {
  return firestoreUpdateDoc(reference, data);
};

export const deleteDoc = async (reference: any) => {
  return firestoreDeleteDoc(reference);
};

export const query = (...args: any[]) => {
  return firestoreQuery(...args);
};

export const where = (field: string, op: any, value: any) => {
  return firestoreWhere(field, op, value);
};

export const orderBy = (field: string, direction?: any) => {
  return firestoreOrderBy(field, direction);
};

export const limit = (count: number) => {
  return firestoreLimit(count);
};

export const onSnapshot = (reference: any, callback: any, errorCallback?: any) => {
  return firestoreOnSnapshot(reference, callback, errorCallback);
};

export const getDocs = async (query: any) => {
  return firestoreGetDocs(query);
};

// Re-export other utilities
export { 
  serverTimestamp, 
  Timestamp, 
  increment, 
  arrayUnion, 
  arrayRemove 
};
