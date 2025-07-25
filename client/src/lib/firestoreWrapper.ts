// Temporarily disable Firebase operations to get app running
console.warn("🚧 Firebase operations temporarily disabled to prevent errors");

// Mock Firebase Firestore functions to prevent errors
export const collection = (path: string, ...pathSegments: string[]) => {
  console.warn(`🚧 Firebase collection(${path}) call disabled`);
  return null; // Return null instead of throwing
};

export const doc = (path: string, ...pathSegments: string[]) => {
  console.warn(`🚧 Firebase doc(${path}) call disabled`);
  return null;
};

export const addDoc = async (reference: any, data: any) => {
  console.warn("🚧 Firebase addDoc call disabled");
  return { id: "mock-id" };
};

export const getDoc = async (reference: any) => {
  console.warn("🚧 Firebase getDoc call disabled");
  return { exists: () => false, data: () => null };
};

export const setDoc = async (reference: any, data: any, options?: any) => {
  console.warn("🚧 Firebase setDoc call disabled");
  return Promise.resolve();
};

export const updateDoc = async (reference: any, data: any) => {
  console.warn("🚧 Firebase updateDoc call disabled");
  return Promise.resolve();
};

export const deleteDoc = async (reference: any) => {
  console.warn("🚧 Firebase deleteDoc call disabled");
  return Promise.resolve();
};

export const query = (...args: any[]) => {
  console.warn("🚧 Firebase query call disabled");
  return null;
};

export const where = (field: string, op: any, value: any) => {
  console.warn("🚧 Firebase where call disabled");
  return null;
};

export const orderBy = (field: string, direction?: any) => {
  console.warn("🚧 Firebase orderBy call disabled");
  return null;
};

export const limit = (count: number) => {
  console.warn("🚧 Firebase limit call disabled");
  return null;
};

export const onSnapshot = (reference: any, callback: any, errorCallback?: any) => {
  console.warn("🚧 Firebase onSnapshot call disabled");
  return () => {}; // Return empty unsubscribe function
};

export const getDocs = async (query: any) => {
  console.warn("🚧 Firebase getDocs call disabled");
  return { empty: true, docs: [], forEach: () => {} };
};

// Mock timestamp functions
export const serverTimestamp = () => {
  console.warn("🚧 Firebase serverTimestamp call disabled");
  return new Date();
};

export const Timestamp = {
  now: () => ({ seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 }),
  fromDate: (date: Date) => ({ seconds: Math.floor(date.getTime() / 1000), nanoseconds: 0 })
};

export const increment = (value: number) => {
  console.warn("🚧 Firebase increment call disabled");
  return value;
};

export const arrayUnion = (...elements: any[]) => {
  console.warn("🚧 Firebase arrayUnion call disabled");
  return elements;
};

export const arrayRemove = (...elements: any[]) => {
  console.warn("🚧 Firebase arrayRemove call disabled");
  return elements;
};
