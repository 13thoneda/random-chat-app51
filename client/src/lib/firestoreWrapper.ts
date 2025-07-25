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

const getDatabase = () => {
  if (!dbInstance) {
    try {
      // Dynamic import to avoid circular dependencies
      const { db } = require("../firebaseConfig");
      if (!db) {
        throw new Error("Database not initialized");
      }
      dbInstance = db;
    } catch (error) {
      console.error("Failed to get database instance:", error);
      return null;
    }
  }
  return dbInstance;
};

// Safe wrapper functions
export const collection = (path: string, ...pathSegments: string[]) => {
  const db = getDatabase();
  if (!db) {
    throw new Error("Database not available");
  }
  return firestoreCollection(db, path, ...pathSegments);
};

export const doc = (path: string, ...pathSegments: string[]) => {
  const db = getDatabase();
  if (!db) {
    throw new Error("Database not available");
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
