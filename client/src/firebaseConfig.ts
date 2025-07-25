// Export from the new reliable Firebase initialization
export { 
  firebaseApp, 
  db, 
  auth, 
  storage,
  getDatabase,
  getAuthInstance,
  getStorageInstance,
  getAppInstance
} from "./lib/firebaseInit";

// For compatibility, also export analytics
export let analytics: any = null;

// Initialize analytics only in production
if (import.meta.env.PROD) {
  import("firebase/analytics").then(({ getAnalytics, isSupported }) => {
    isSupported()
      .then((supported) => {
        if (supported) {
          const { getAppInstance } = require("./lib/firebaseInit");
          analytics = getAnalytics(getAppInstance());
        }
      })
      .catch(() => {
        analytics = null;
      });
  });
}
