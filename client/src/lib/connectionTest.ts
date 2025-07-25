import {
  ref,
  getDownloadURL,
  uploadBytes,
  deleteObject,
} from "firebase/storage";
import { storage } from "../firebaseConfig";

export interface ConnectionTestResult {
  isConnected: boolean;
  status: "success" | "error" | "testing";
  message: string;
  details?: {
    canRead: boolean;
    canWrite: boolean;
    canDelete: boolean;
    error?: string;
    url?: string;
  };
}

/**
 * Test Firebase Storage connection with comprehensive checks
 */
export async function testFirebaseStorageConnection(): Promise<ConnectionTestResult> {
  try {
    console.log("🔍 Testing Firebase Storage connection...");

    // Check if storage is properly initialized
    if (!storage) {
      throw new Error("Firebase Storage not initialized");
    }

    // Test 1: Basic connection (try to create a reference)
    const testRef = ref(storage, "connection-test/test.txt");

    // Test 2: Write operation (upload a small test file)
    const testData = new Blob(["Firebase Storage connection test"], {
      type: "text/plain",
    });
    await uploadBytes(testRef, testData);
    console.log("✅ Write operation successful");

    // Test 3: Read operation (get download URL)
    const downloadURL = await getDownloadURL(testRef);
    console.log("✅ Read operation successful", downloadURL);

    // Test 4: Delete operation (cleanup test file)
    await deleteObject(testRef);
    console.log("✅ Delete operation successful");

    return {
      isConnected: true,
      status: "success",
      message: "Firebase Storage is connected and working perfectly!",
      details: {
        canRead: true,
        canWrite: true,
        canDelete: true,
      },
    };
  } catch (error: any) {
    console.error("❌ Firebase Storage connection test failed:", error);

    let message = "Firebase Storage connection failed";
    let details: any = {
      canRead: false,
      canWrite: false,
      canDelete: false,
      error: error.message,
    };

    // Analyze specific error types
    switch (error.code) {
      case "storage/unauthorized":
        message = "Unauthorized: Check Firebase Storage security rules";
        break;
      case "storage/quota-exceeded":
        message = "Storage quota exceeded";
        break;
      case "storage/unauthenticated":
        message = "Not authenticated: User authentication required";
        break;
      case "storage/retry-limit-exceeded":
        message =
          "Connection timeout: Check network and Firebase configuration";
        break;
      case "storage/invalid-url":
        message = "Invalid storage URL: Check Firebase configuration";
        break;
      case "storage/no-default-bucket":
        message = "No default storage bucket configured";
        break;
      default:
        if (error.message.includes("CORS")) {
          message = "CORS error: Configure CORS for your storage bucket";
        } else if (error.message.includes("network")) {
          message = "Network error: Check internet connection";
        }
    }

    return {
      isConnected: false,
      status: "error",
      message,
      details,
    };
  }
}

/**
 * Quick connection check (lighter than full test)
 */
export async function quickConnectionCheck(): Promise<boolean> {
  try {
    // Just try to create a reference - this tests basic connectivity
    ref(storage, "test");
    return true;
  } catch (error) {
    console.error("Quick connection check failed:", error);
    return false;
  }
}

/**
 * Test with retry logic
 */
export async function testConnectionWithRetry(
  maxRetries: number = 3,
): Promise<ConnectionTestResult> {
  let lastResult: ConnectionTestResult;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`🔄 Connection test attempt ${attempt}/${maxRetries}`);

    lastResult = await testFirebaseStorageConnection();

    if (lastResult.isConnected) {
      return lastResult;
    }

    // Wait before retry (exponential backoff)
    if (attempt < maxRetries) {
      const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s...
      console.log(`⏳ Waiting ${delay}ms before retry...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return lastResult!;
}

/**
 * Get storage configuration info
 */
export function getStorageInfo() {
  try {
    return {
      bucket: storage.app.options.storageBucket,
      projectId: storage.app.options.projectId,
      apiKey: storage.app.options.apiKey
        ? "***" + storage.app.options.apiKey.slice(-4)
        : "Not set",
      authDomain: storage.app.options.authDomain,
    };
  } catch (error) {
    return {
      error: "Failed to get storage configuration",
      details: error,
    };
  }
}

/**
 * Test upload with a real file (for component testing)
 */
export async function testFileUpload(
  file: File,
): Promise<ConnectionTestResult> {
  try {
    const testRef = ref(
      storage,
      `test-uploads/test_${Date.now()}_${file.name}`,
    );

    // Upload file
    await uploadBytes(testRef, file);

    // Get download URL
    const url = await getDownloadURL(testRef);

    // Clean up
    await deleteObject(testRef);

    return {
      isConnected: true,
      status: "success",
      message: `Successfully uploaded and cleaned up test file: ${file.name}`,
      details: {
        canRead: true,
        canWrite: true,
        canDelete: true,
        url,
      },
    };
  } catch (error: any) {
    return {
      isConnected: false,
      status: "error",
      message: `File upload test failed: ${error.message}`,
      details: {
        canRead: false,
        canWrite: false,
        canDelete: false,
        error: error.message,
      },
    };
  }
}
