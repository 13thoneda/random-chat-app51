import * as React from "react";
import { auth } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { getUserProfile, updatePremiumStatus } from "../lib/firestoreUtils";

interface PremiumContextType {
  isPremium: boolean;
  premiumExpiry: Date | null;
  premiumPlan: string | null;
  loading: boolean;
  setPremium: (premium: boolean, expiry?: Date, plan?: string) => Promise<boolean>;
  checkPremiumStatus: () => boolean;
  syncPremiumStatus: () => Promise<void>;
  isUltraPremium: () => boolean;
  isProMonthly: () => boolean;
}

const PremiumContext = React.createContext<PremiumContextType | null>(null);

export const usePremium = () => {
  const context = React.useContext(PremiumContext);
  if (!context) {
    throw new Error("usePremium must be used within a PremiumProvider");
  }
  return context;
};

interface PremiumProviderProps {
  children: React.ReactNode;
}

export const PremiumProvider = ({ children }: PremiumProviderProps) => {
  const [isPremium, setIsPremium] = React.useState(false);
  const [premiumExpiry, setPremiumExpiry] = React.useState<Date | null>(null);
  const [premiumPlan, setPremiumPlan] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);

  // Monitor auth state and sync premium status
  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUserId(user.uid);
        await syncPremiumStatus(user.uid);
      } else {
        setCurrentUserId(null);
        setIsPremium(false);
        setPremiumExpiry(null);
        setPremiumPlan(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const syncPremiumStatus = async (userId?: string) => {
    try {
      setLoading(true);
      const userIdToUse = userId || currentUserId;
      if (!userIdToUse) return;

      const userProfile = await getUserProfile(userIdToUse);
      if (userProfile) {
        const { isPremium: userIsPremium, premiumExpiry: userPremiumExpiry, premiumPlan: userPremiumPlan } = userProfile;

        // Check if premium has expired
        const now = new Date();
        const expiryDate = userPremiumExpiry?.toDate();

        if (userIsPremium && expiryDate && expiryDate > now) {
          setIsPremium(true);
          setPremiumExpiry(expiryDate);
          setPremiumPlan(userPremiumPlan || null);

          // Sync with localStorage for offline access
          localStorage.setItem("premium_status", "true");
          localStorage.setItem("premium_expiry", expiryDate.toISOString());
          localStorage.setItem("ajnabicam_premium_plan", userPremiumPlan || "");
        } else if (userIsPremium && (!expiryDate || expiryDate <= now)) {
          // Premium expired, update Firestore
          await updatePremiumStatus(userIdToUse, false);
          setIsPremium(false);
          setPremiumExpiry(null);
          setPremiumPlan(null);

          // Clear localStorage
          localStorage.removeItem("premium_status");
          localStorage.removeItem("premium_expiry");
          localStorage.removeItem("ajnabicam_premium_plan");
        } else {
          setIsPremium(false);
          setPremiumExpiry(null);
          setPremiumPlan(null);

          // Clear localStorage
          localStorage.removeItem("premium_status");
          localStorage.removeItem("premium_expiry");
          localStorage.removeItem("ajnabicam_premium_plan");
        }
      }
    } catch (error) {
      console.error("Error syncing premium status:", error);

      // Fallback to localStorage if Firestore fails
      const savedPremium = localStorage.getItem("premium_status");
      const savedExpiry = localStorage.getItem("premium_expiry");
      const savedPlan = localStorage.getItem("ajnabicam_premium_plan");

      if (savedPremium && savedExpiry) {
        const expiryDate = new Date(savedExpiry);
        if (expiryDate > new Date()) {
          setIsPremium(true);
          setPremiumExpiry(expiryDate);
          setPremiumPlan(savedPlan || null);
        } else {
          setIsPremium(false);
          setPremiumExpiry(null);
          setPremiumPlan(null);
          localStorage.removeItem("premium_status");
          localStorage.removeItem("premium_expiry");
          localStorage.removeItem("ajnabicam_premium_plan");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const setPremium = async (premium: boolean, expiry?: Date, plan?: string): Promise<boolean> => {
    if (!currentUserId) return false;

    try {
      // Update Firestore first
      const success = await updatePremiumStatus(currentUserId, premium, expiry, plan);

      if (success) {
        // Update local state
        setIsPremium(premium);

        if (premium && expiry) {
          setPremiumExpiry(expiry);
          setPremiumPlan(plan || null);
          localStorage.setItem("premium_status", "true");
          localStorage.setItem("premium_expiry", expiry.toISOString());
          localStorage.setItem("ajnabicam_premium_plan", plan || "");
        } else {
          setPremiumExpiry(null);
          setPremiumPlan(null);
          localStorage.removeItem("premium_status");
          localStorage.removeItem("premium_expiry");
          localStorage.removeItem("ajnabicam_premium_plan");
        }

        return true;
      }

      return false;
    } catch (error) {
      console.error("Error updating premium status:", error);
      return false;
    }
  };

  const checkPremiumStatus = (): boolean => {
    if (premiumExpiry && new Date() > premiumExpiry) {
      // Premium expired, sync with Firestore
      if (currentUserId) {
        updatePremiumStatus(currentUserId, false).then(() => {
          syncPremiumStatus();
        });
      }
      return false;
    }
    return isPremium;
  };

  const isUltraPremium = (): boolean => {
    return isPremium && premiumPlan === 'ultra-quarterly';
  };

  const isProMonthly = (): boolean => {
    return isPremium && premiumPlan === 'pro-monthly';
  };

  return (
    <PremiumContext.Provider
      value={{
        isPremium,
        premiumExpiry,
        premiumPlan,
        loading,
        setPremium,
        checkPremiumStatus,
        syncPremiumStatus,
        isUltraPremium,
        isProMonthly,
      }}
    >
      {children}
    </PremiumContext.Provider>
  );
};
