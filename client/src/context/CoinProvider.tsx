import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import * as React from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { firebaseApp, db } from "../firebaseConfig";
import { getCoins, addCoins as firestoreAddCoins, spendCoins } from "../lib/firestoreUtils";

interface CoinContextType {
  coins: number;
  addCoins: (amount: number) => Promise<boolean>;
  deductCoins: (amount: number) => Promise<boolean>;
  watchAd: () => Promise<void>;
  referFriend: () => Promise<void>;
  claimDailyBonus: () => Promise<boolean>;
  completeChat: () => Promise<void>;
  checkStreakBonus: () => Promise<void>;
  requestFriendship: (partnerName: string) => Promise<{ success: boolean; needsAds?: boolean; }>;
  adsWatchedToday: number;
  maxAdsPerDay: number;
  canClaimDailyBonus: boolean;
  currentStreak: number;
  hasCompletedOnboarding: boolean;
  isLoading: boolean;
  currentUser: string | null;
  pendingAds: number;
  setPendingAds: (count: number) => void;
}

const CoinContext = createContext<CoinContextType | null>(null);

export const useCoin = () => {
  const context = useContext(CoinContext);
  if (!context) {
    throw new Error("useCoin must be used within a CoinProvider");
  }
  return context;
};

interface CoinProviderProps {
  children: ReactNode;
}

export const CoinProvider = ({ children }: CoinProviderProps) => {
  const [coins, setCoins] = useState(0);
  const [adsWatchedToday, setAdsWatchedToday] = useState(0);
  const [canClaimDailyBonus, setCanClaimDailyBonus] = useState(true);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [pendingAds, setPendingAds] = useState(0);

  const maxAdsPerDay = 3;
  const auth = getAuth(firebaseApp);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user.uid);
      } else {
        setCurrentUser(null);
        setCoins(0);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [auth]);

  // Set up real-time listener for user's coin balance
  useEffect(() => {
    if (!currentUser) return;

    const userDocRef = doc(db, "users", currentUser);
    const unsubscribe = onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        const userData = doc.data();
        setCoins(userData.coins || 0);
        setHasCompletedOnboarding(userData.onboardingComplete || false);
      }
      setIsLoading(false);
    }, (error) => {
      console.error("Error listening to user document:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Initialize local storage data (ads, daily bonus, streak, pending ads)
  useEffect(() => {
    const lastDailyBonus = localStorage.getItem("ajnabicam_last_daily_bonus");
    const adsToday = localStorage.getItem("ajnabicam_ads_today");
    const adsDate = localStorage.getItem("ajnabicam_ads_date");
    const streakData = localStorage.getItem("ajnabicam_streak_data");
    const storedPendingAds = localStorage.getItem("ajnabicam_pending_ads");

    const today = new Date().toDateString();

    // Load pending ads
    if (storedPendingAds) {
      setPendingAds(parseInt(storedPendingAds));
    }
    
    // Check daily bonus eligibility
    if (lastDailyBonus !== today) {
      setCanClaimDailyBonus(true);
    } else {
      setCanClaimDailyBonus(false);
    }

    // Reset ads count if it's a new day
    if (adsDate !== today) {
      setAdsWatchedToday(0);
      localStorage.setItem("ajnabicam_ads_today", "0");
      localStorage.setItem("ajnabicam_ads_date", today);
    } else if (adsToday) {
      setAdsWatchedToday(parseInt(adsToday));
    }

    // Load streak data
    if (streakData) {
      try {
        const { streak, lastDate } = JSON.parse(streakData);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastDate === today) {
          // Already checked in today
          setCurrentStreak(streak);
        } else if (lastDate === yesterday.toDateString()) {
          // Can continue streak
          setCurrentStreak(streak);
        } else {
          // Streak broken
          setCurrentStreak(0);
          localStorage.setItem("ajnabicam_streak_data", JSON.stringify({
            streak: 0,
            lastDate: ""
          }));
        }
      } catch (error) {
        console.error("Error parsing streak data:", error);
        setCurrentStreak(0);
      }
    }
  }, []);

  const addCoins = async (amount: number): Promise<boolean> => {
    if (!currentUser) {
      console.error("No authenticated user");
      return false;
    }

    try {
      await firestoreAddCoins(currentUser, amount);
      return true;
    } catch (error) {
      console.error("Error adding coins:", error);
      return false;
    }
  };

  const deductCoins = async (amount: number): Promise<boolean> => {
    if (!currentUser) {
      console.error("No authenticated user");
      return false;
    }

    try {
      const result = await spendCoins(currentUser, amount);
      if (!result.success) {
        console.warn("Failed to deduct coins:", result.message);
      }
      return result.success;
    } catch (error) {
      console.error("Error deducting coins:", error);
      return false;
    }
  };

  const watchAd = async (): Promise<void> => {
    if (adsWatchedToday >= maxAdsPerDay) {
      alert("❌ You've reached the daily limit of 3 ads. Come back tomorrow!");
      return;
    }

    // Simulate watching an ad
    const newAdsCount = adsWatchedToday + 1;
    setAdsWatchedToday(newAdsCount);
    localStorage.setItem("ajnabicam_ads_today", newAdsCount.toString());
    
    const success = await addCoins(10);
    
    if (success) {
      const remaining = maxAdsPerDay - newAdsCount;
      if (remaining > 0) {
        alert(`🎉 You earned 10 coins! ${remaining} ads remaining today.`);
      } else {
        alert("🎉 You earned 10 coins! That's all ads for today. Come back tomorrow for more!");
      }
    } else {
      alert("❌ Failed to add coins. Please try again.");
    }
  };

  const claimDailyBonus = async (): Promise<boolean> => {
    if (!canClaimDailyBonus || !currentUser) {
      if (!currentUser) {
        alert("❌ Please sign in to claim daily bonus.");
      }
      return false;
    }

    const today = new Date().toDateString();
    const success = await addCoins(5);
    
    if (success) {
      setCanClaimDailyBonus(false);
      localStorage.setItem("ajnabicam_last_daily_bonus", today);
      
      // Update streak
      const streakData = localStorage.getItem("ajnabicam_streak_data");
      let newStreak = 1;
      
      if (streakData) {
        try {
          const { streak, lastDate } = JSON.parse(streakData);
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          
          if (lastDate === yesterday.toDateString()) {
            newStreak = streak + 1;
          }
        } catch (error) {
          console.error("Error parsing streak data:", error);
        }
      }
      
      setCurrentStreak(newStreak);
      localStorage.setItem("ajnabicam_streak_data", JSON.stringify({
        streak: newStreak,
        lastDate: today
      }));

      // Check for streak bonus
      if (newStreak === 3) {
        const bonusSuccess = await addCoins(20);
        if (bonusSuccess) {
          alert("🎉 Daily bonus claimed! +5 coins\n🔥 3-day streak bonus! +20 coins\nTotal: +25 coins!");
        } else {
          alert(`🎉 Daily bonus claimed! +5 coins\n🔥 Current streak: ${newStreak} days`);
        }
      } else {
        alert(`🎉 Daily bonus claimed! +5 coins\n🔥 Current streak: ${newStreak} days`);
      }
    } else {
      alert("❌ Failed to claim daily bonus. Please try again.");
    }

    return success;
  };

  const completeChat = async (): Promise<void> => {
    const success = await addCoins(3);
    if (success) {
      // Don't show alert for automatic coin earning
      console.log("🎉 Chat completed! You earned 3 coins!");
    }
  };

  const checkStreakBonus = async (): Promise<void> => {
    if (currentStreak >= 3 && currentStreak % 3 === 0) {
      const success = await addCoins(20);
      if (success) {
        alert(`🔥 ${currentStreak}-day streak bonus! You earned 20 coins!`);
      }
    }
  };

  const referFriend = async (): Promise<void> => {
    // Simulate successful referral
    const success = await addCoins(25);
    if (success) {
      alert("🎉 You earned 25 coins for referring a friend!");
    }
  };

  const requestFriendship = async (partnerName: string): Promise<{ success: boolean; needsAds?: boolean; }> => {
    const friendshipCost = 20;

    if (coins >= friendshipCost) {
      // User has enough coins, deduct them
      const success = await deductCoins(friendshipCost);
      return { success };
    } else {
      // User doesn't have enough coins, they need to watch ads
      const newPendingAds = pendingAds + 2;
      setPendingAds(newPendingAds);
      localStorage.setItem("ajnabicam_pending_ads", newPendingAds.toString());

      return { success: true, needsAds: true };
    }
  };

  const updatePendingAds = (count: number) => {
    setPendingAds(count);
    localStorage.setItem("ajnabicam_pending_ads", count.toString());
  };

  return (
    <CoinContext.Provider
      value={{
        coins,
        addCoins,
        deductCoins,
        watchAd,
        referFriend,
        claimDailyBonus,
        completeChat,
        checkStreakBonus,
        requestFriendship,
        adsWatchedToday,
        maxAdsPerDay,
        canClaimDailyBonus,
        currentStreak,
        hasCompletedOnboarding,
        isLoading,
        currentUser,
        pendingAds,
        setPendingAds: updatePendingAds,
      }}
    >
      {children}
    </CoinContext.Provider>
  );
};
